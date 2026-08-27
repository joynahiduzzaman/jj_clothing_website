import { prisma } from "./db";
import { RESERVED_STATUSES } from "@/lib/order-status";

/**
 * The single place that changes a variant's stock and logs why. Used by manual
 * admin adjustments, automatic decrements when an order is placed, and automatic
 * restoration when an order is cancelled/refunded — so the Stock History log is a
 * complete, honest record instead of only capturing manual changes.
 *
 * Stock lives on ProductVariant, not Product — every product has at least one
 * variant, so this is always the correct unit of stock, never a "does this
 * product have variants?" branch.
 *
 * Stock is clamped at 0 — a manual adjustment or a restoration can never push a
 * variant negative, even if the numbers passed in would imply it should.
 */
export async function adjustStock(
  variantId: string,
  change: number,
  reason: string,
  adjustedBy?: string | null
) {
  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true, productId: true },
    });
    if (!variant) return null;

    const newStock = Math.max(0, variant.stock + change);
    const actualChange = newStock - variant.stock;
    if (actualChange === 0) return variant.stock;

    await tx.productVariant.update({ where: { id: variantId }, data: { stock: newStock } });
    await tx.stockAdjustment.create({
      data: {
        productId: variant.productId,
        variantId,
        change: actualChange,
        previousStock: variant.stock,
        newStock,
        reason,
        adjustedBy: adjustedBy || null,
      },
    });

    return newStock;
  });
}

/** Reserved = quantity sitting in orders that are accepted but not yet shipped —
 * see RESERVED_STATUSES in src/lib/order-status.ts (currently PENDING/CONFIRMED/
 * PACKED). Once an order is SHIPPED, DELIVERED, CANCELLED, RETURNED, or REFUNDED
 * it's no longer "in flight" so it drops out of this count. DRAFT orders were
 * never decremented in the first place, so they don't reserve anything either.
 * This is computed live from existing Order/OrderItem data — no new field to
 * keep in sync.
 *
 * Two variants (pun intended) of the same query: the Inventory table's product
 * row needs a per-product rollup, a per-variant drill-down needs the finer one.
 */
export async function getReservedQuantitiesByVariant(variantIds: string[]): Promise<Map<string, number>> {
  if (variantIds.length === 0) return new Map();
  const rows = await prisma.orderItem.groupBy({
    by: ["variantId"],
    where: { variantId: { in: variantIds }, order: { status: { in: RESERVED_STATUSES } } },
    _sum: { quantity: true },
  });
  return new Map(rows.filter((r) => r.variantId).map((r) => [r.variantId as string, r._sum.quantity || 0]));
}

export async function getReservedQuantitiesByProduct(productIds: string[]): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const rows = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, order: { status: { in: RESERVED_STATUSES } } },
    _sum: { quantity: true },
  });
  return new Map(rows.map((r) => [r.productId, r._sum.quantity || 0]));
}

// Alias kept for existing call sites that reserved-quantity-by-product before
// variants existed — same behavior as getReservedQuantitiesByProduct.
export const getReservedQuantities = getReservedQuantitiesByProduct;
