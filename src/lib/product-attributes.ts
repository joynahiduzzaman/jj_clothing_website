/**
 * Clothing attribute vocabularies for the product form.
 *
 * GENDERS is a fixed enum enforced at the application layer via zod (see the
 * admin product API routes) — same reasoning the old skinType/skinConcern
 * fields used: a typo or synonym would silently create a filter value nothing
 * matches.
 *
 * SUGGESTED_SIZES/SUGGESTED_COLORS are NOT enforced — color and size are free
 * text on ProductVariant (a color name like "Olive Green" or a shoe size like
 * "42" don't fit one fixed list across every category), these are only
 * pre-filled chip suggestions in the admin's "generate combinations" helper.
 */
export const GENDERS = ["MEN", "WOMEN", "UNISEX"] as const;
export type Gender = (typeof GENDERS)[number];

export const SUGGESTED_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const SUGGESTED_COLORS = ["Black", "White", "Navy", "Beige", "Olive", "Grey", "Brown"] as const;
