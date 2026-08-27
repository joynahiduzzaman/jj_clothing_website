import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { z } from "zod";
import { GENDERS } from "@/lib/product-attributes";
import { revalidateCatalogue } from "@/server/catalogue-cache";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "MANAGER", "STAFF"].includes(user.role)) return null;
  return user;
}

const variantSchema = z.object({
  id: z.string().optional(), // present = update existing row, absent = create
  color: z.string().min(1).max(40),
  size: z.string().min(1).max(20),
  sku: z.string().max(40).optional(),
  stock: z.number().int().min(0).default(0),
  priceOverride: z.number().positive().nullable().optional(),
});

// Explicit whitelist of editable fields — never spread an untyped request body straight
// into Prisma's `data`, since that would let a caller set arbitrary columns (including
// relation IDs) beyond what the admin UI actually exposes.
const updateSchema = z.object({
  name: z.string().min(2).max(191).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens").optional(),
  banglaName: z.string().max(200).nullable().optional(),
  description: z.string().min(5).optional(),
  material: z.string().max(200).nullable().optional(),
  fit: z.string().max(100).nullable().optional(),
  careInstructions: z.string().max(2000).nullable().optional(),
  gender: z.enum(GENDERS).optional(),
  modelInfo: z.string().max(200).nullable().optional(),
  price: z.number().positive().optional(),
  costPrice: z.number().min(0).nullable().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  images: z.array(z.string()).optional(),
  images360: z.array(z.string()).optional(),
  collectionId: z.string().nullable().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["ACTIVE", "DRAFT"]).optional(),
  weightGrams: z.number().int().positive().nullable().optional(),
  metaTitle: z.string().max(70).nullable().optional(),
  metaDescription: z.string().max(160).nullable().optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isFlashSale: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  variants: z.array(variantSchema).min(1, "Add at least one color/size variant").optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const product = await prisma.product.findUnique({ where: { id: params.id }, include: { variants: { orderBy: { position: "asc" } } } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { images, images360, variants, ...rest } = parsed.data;
  const data: any = { ...rest };
  // JSON string columns. Checked against undefined rather than truthiness so
  // clearing a list to [] is saved rather than ignored.
  if (images !== undefined) data.images = JSON.stringify(images);
  if (images360 !== undefined) data.images360 = JSON.stringify(images360);

  if (data.slug) {
    const clash = await prisma.product.findFirst({ where: { slug: data.slug, NOT: { id: params.id } } });
    if (clash) return NextResponse.json({ error: "That URL slug is already in use by another product" }, { status: 409 });
  }

  if (variants) {
    const duplicateCombo = new Set<string>();
    for (const v of variants) {
      const key = `${v.color.toLowerCase()}::${v.size.toLowerCase()}`;
      if (duplicateCombo.has(key)) {
        return NextResponse.json({ error: `Duplicate variant: ${v.color} / ${v.size}` }, { status: 400 });
      }
      duplicateCombo.add(key);
    }
    const requestedSkus = variants.map((v) => v.sku).filter((s): s is string => Boolean(s));
    if (requestedSkus.length) {
      const clash = await prisma.productVariant.findFirst({
        where: { sku: { in: requestedSkus }, productId: { not: params.id } },
      });
      if (clash) return NextResponse.json({ error: `SKU "${clash.sku}" is already in use by another variant` }, { status: 409 });
    }
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      if (variants) {
        const existingIds = (await tx.productVariant.findMany({ where: { productId: params.id }, select: { id: true } })).map((v) => v.id);
        const keptIds = variants.map((v) => v.id).filter((id): id is string => Boolean(id));
        const toDelete = existingIds.filter((id) => !keptIds.includes(id));
        if (toDelete.length) await tx.productVariant.deleteMany({ where: { id: { in: toDelete } } });

        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: { color: v.color, size: v.size, sku: v.sku, stock: v.stock, priceOverride: v.priceOverride, position: i },
            });
          } else {
            await tx.productVariant.create({
              data: { productId: params.id, color: v.color, size: v.size, sku: v.sku, stock: v.stock, priceOverride: v.priceOverride, position: i },
            });
          }
        }
      }

      return tx.product.update({ where: { id: params.id }, data, include: { variants: true } });
    });

    // Covers the status field too: flipping a product to Draft is what empties a
    // collection or category, and the menu has to notice.
    revalidateCatalogue(product.slug);
    return NextResponse.json({ product });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "A variant with that SKU or color/size combination already exists" }, { status: 409 });
    }
    console.error("Product update error:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const orderItemCount = await prisma.orderItem.count({ where: { productId: params.id } });
  // A product that's appeared in a real order can't be deleted — it would orphan
  // that order's line items. Set it to Draft instead to hide it from the storefront
  // while keeping order history intact.
  if (orderItemCount > 0) {
    return NextResponse.json(
      { error: "This product has order history and can't be deleted. Set it to Draft instead to hide it from the shop." },
      { status: 409 }
    );
  }

  await prisma.product.delete({ where: { id: params.id } });
  revalidateCatalogue();
  return NextResponse.json({ success: true });
}
