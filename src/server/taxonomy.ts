import slugify from "slugify";
import { prisma } from "./db";

/**
 * Shared rules for the two catalogue taxonomies, Category and Collection.
 *
 * They differ only in their fields; everything that can go wrong is identical,
 * so the guards live here rather than being written twice and drifting.
 */

/** URL-safe slug. Falls back to a timestamp if the name is all punctuation. */
export function toSlug(name: string): string {
  const slug = slugify(name, { lower: true, strict: true, trim: true });
  return slug || `item-${Date.now()}`;
}

/**
 * Ensures a slug is unique, appending -2, -3 … on collision.
 *
 * Slugs are the public URL for a category or collection page, so a duplicate
 * would make one of the two unreachable. `exceptId` lets an edit keep its own
 * slug.
 */
export async function uniqueSlug(
  model: "category" | "collection",
  desired: string,
  exceptId?: string
): Promise<string> {
  let slug = desired;
  for (let attempt = 2; attempt < 50; attempt++) {
    const clash =
      model === "category"
        ? await prisma.category.findUnique({ where: { slug }, select: { id: true } })
        : await prisma.collection.findUnique({ where: { slug }, select: { id: true } });
    if (!clash || clash.id === exceptId) return slug;
    slug = `${desired}-${attempt}`;
  }
  return `${desired}-${Date.now()}`;
}

/**
 * Whether a Category can be deleted.
 *
 * Product.categoryId is a required relation, so Prisma's default Restrict
 * makes the delete throw a foreign-key error that surfaces to an admin as an
 * unexplained 500. Check first and say plainly what is in the way, and how
 * many.
 *
 * Collection has no equivalent guard: Product.collectionId is optional, so
 * Prisma's default referential action (SetNull) already lets a Collection be
 * deleted freely — products simply lose that reference, they don't block it.
 */
export async function blockingProductCount(id: string): Promise<number> {
  return prisma.product.count({ where: { categoryId: id } });
}
