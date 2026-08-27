import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "MANAGER", "STAFF"].includes(user.role)) return null;
  return user;
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const original = await prisma.product.findUnique({ where: { id: params.id }, include: { variants: true } });
  if (!original) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // New product needs its own unique slug — copy everything else as-is,
  // including images. Starts as Draft and with stats/flags reset so it doesn't
  // immediately show up as a "best seller" duplicate of itself. Variants are
  // copied with fresh (SKU-less) rows and stock reset to 0 — a "duplicate"
  // is a new, unstocked listing, not a second copy of the same on-hand
  // inventory (the previous product-level `stock` field used to get copied
  // verbatim here, which was never actually correct).
  const { id, slug, variants, isBestSeller, isNewArrival, isFlashSale, isTrending, isFeatured, createdAt, updatedAt, ...rest } = original;

  const duplicate = await prisma.product.create({
    data: {
      ...rest,
      name: `${original.name} (Copy)`,
      slug: `${slug}-copy-${Date.now().toString().slice(-5)}`,
      status: "DRAFT",
      isBestSeller: false,
      isNewArrival: false,
      isFlashSale: false,
      isTrending: false,
      isFeatured: false,
      variants: {
        create: variants.map((v) => ({ color: v.color, size: v.size, priceOverride: v.priceOverride, position: v.position, stock: 0, sku: null })),
      },
    },
  });

  return NextResponse.json({ product: duplicate }, { status: 201 });
}
