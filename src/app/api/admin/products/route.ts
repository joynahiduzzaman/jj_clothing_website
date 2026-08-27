import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import slugify from "slugify";
import { z } from "zod";
import { GENDERS } from "@/lib/product-attributes";
import { revalidateCatalogue } from "@/server/catalogue-cache";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "MANAGER", "STAFF"].includes(user.role)) return null;
  return user;
}

const variantSchema = z.object({
  color: z.string().min(1).max(40),
  size: z.string().min(1).max(20),
  sku: z.string().max(40).optional(),
  stock: z.number().int().min(0).default(0),
  priceOverride: z.number().positive().nullable().optional(),
});

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens").optional(),
  banglaName: z.string().max(200).nullable().optional(),
  collectionId: z.string().nullable().optional(),
  categoryId: z.string(),
  description: z.string().min(5),
  material: z.string().max(200).nullable().optional(),
  fit: z.string().max(100).nullable().optional(),
  careInstructions: z.string().max(2000).nullable().optional(),
  gender: z.enum(GENDERS).default("UNISEX"),
  modelInfo: z.string().max(200).nullable().optional(),
  price: z.number().positive(),
  // Supplier cost — optional, admin-only, never returned on storefront routes.
  costPrice: z.number().min(0).nullable().optional(),
  discountPercent: z.number().min(0).max(100).default(0),
  images: z.array(z.string()).default([]),
  images360: z.array(z.string()).default([]),
  status: z.enum(["ACTIVE", "DRAFT"]).default("ACTIVE"),
  weightGrams: z.number().int().positive().nullable().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isFlashSale: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  variants: z.array(variantSchema).min(1, "Add at least one color/size variant"),
});

export async function GET() {
  // This returns the full admin row — costPrice, variants — and every
  // product regardless of status, including unpublished DRAFTs. POST was guarded
  // but GET was not, so the whole catalogue with supplier costs was readable
  // without a session. Storefront callers have /api/products for public fields.
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const products = await prisma.product.findMany({
    include: { collection: { select: { name: true } }, category: { select: { name: true } }, variants: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { slug: manualSlug, images, images360, variants, ...data } = parsed.data;
  // A manually-entered slug is used as-is (already validated as lowercase/numbers/
  // hyphens above); otherwise auto-generate from the name, same as before.
  const slug = manualSlug || slugify(data.name, { lower: true, strict: true }) + "-" + Date.now().toString().slice(-5);

  if (manualSlug) {
    const clash = await prisma.product.findUnique({ where: { slug: manualSlug } });
    if (clash) return NextResponse.json({ error: "That URL slug is already in use by another product" }, { status: 409 });
  }

  const requestedSkus = variants.map((v) => v.sku).filter((s): s is string => Boolean(s));
  const duplicateCombo = new Set<string>();
  for (const v of variants) {
    const key = `${v.color.toLowerCase()}::${v.size.toLowerCase()}`;
    if (duplicateCombo.has(key)) {
      return NextResponse.json({ error: `Duplicate variant: ${v.color} / ${v.size}` }, { status: 400 });
    }
    duplicateCombo.add(key);
  }
  if (requestedSkus.length) {
    const clash = await prisma.productVariant.findFirst({ where: { sku: { in: requestedSkus } } });
    if (clash) return NextResponse.json({ error: `SKU "${clash.sku}" is already in use by another variant` }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      slug,
      images: JSON.stringify(images),
      images360: JSON.stringify(images360),
      variants: { create: variants.map((v, i) => ({ ...v, position: i })) },
    },
  });
  // Nothing here purged any cache, so a new product waited out the 60-second ISR
  // window before the shop showed it — and the header menu, five minutes.
  revalidateCatalogue(product.slug);
  return NextResponse.json({ product }, { status: 201 });
}
