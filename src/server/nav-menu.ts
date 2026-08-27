import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/server/db";
import { parseJsonArray } from "@/lib/utils";

const NAV_TAG = "header-nav-menu";

export interface NavLink {
  label: string;
  href: string;
}

export interface NavMenu {
  /** Photography for the two mega-menu panels. */
  images: { collections: string | null; categories: string | null };
  collections: NavLink[];
  categories: NavLink[];
}

/** The panel lists two columns of three; more than six turns the menu into a
 *  directory, which is what "View All" is for. */
const MAX_LINKS = 6;

/**
 * Two same-named rows are a data mistake, not two things to show. Keeping the
 * better-stocked one means the menu never lists the same word twice — a
 * duplicate in a dropdown reads as a broken site, whatever the cause.
 */
function dedupeByName<T extends { name: string; count: number }>(rows: T[]): T[] {
  const best = new Map<string, T>();
  for (const row of rows) {
    const key = row.name.trim().toLowerCase();
    const seen = best.get(key);
    if (!seen || row.count > seen.count) best.set(key, row);
  }
  return [...best.values()];
}

/** Best-stocked first, then alphabetical — the menu should lead with the
 *  labels the shop actually has depth in, not whatever sorts first.
 *
 *  Exported for its tests: it decides what the whole site's navigation says,
 *  and the query around it can't be unit-tested without a database. */
export function rank<T extends { name: string; count: number }>(rows: T[]): T[] {
  return dedupeByName(rows)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, MAX_LINKS);
}

/**
 * Everything the header's two mega-menus need, in one cached read.
 *
 * The link lists used to be hardcoded, which meant a panel could advertise a
 * collection or category with no products and drop anyone who clicked onto an
 * empty page, while ones that *are* stocked never appeared at all. A
 * navigation written by hand goes stale the first time the catalogue changes,
 * so it is read from the catalogue instead: a collection or category earns its
 * place in the menu by having at least one ACTIVE product.
 *
 * Stock level deliberately doesn't matter — a sold-out product still has a page
 * worth linking to, and the shop wants that visit. Only "no products at all"
 * hides an entry.
 *
 * The images fall back to null for an empty catalogue; the header keeps its
 * shipped stand-in for that case rather than rendering a hole in the panel.
 */
const EMPTY_NAV_MENU: NavMenu = { images: { collections: null, categories: null }, collections: [], categories: [] };

export const getNavMenu = unstable_cache(
  async (): Promise<NavMenu> => {
    let products: { images: string }[], collections: { name: string; slug: string; _count: { products: number } }[], categories: { name: string; slug: string; _count: { products: number } }[];
    try {
      [products, collections, categories] = await Promise.all([
        prisma.product.findMany({
          where: { status: "ACTIVE", images: { not: "[]" } },
          orderBy: [{ isBestSeller: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
          take: 6,
          select: { images: true },
        }),
        prisma.collection.findMany({
          where: { products: { some: { status: "ACTIVE" } } },
          select: {
            name: true,
            slug: true,
            _count: { select: { products: { where: { status: "ACTIVE" } } } },
          },
        }),
        prisma.category.findMany({
          where: { products: { some: { status: "ACTIVE" } } },
          select: {
            name: true,
            slug: true,
            _count: { select: { products: { where: { status: "ACTIVE" } } } },
          },
        }),
      ]);
    } catch {
      // A transient DB blip here would otherwise crash the root layout — every
      // single page includes the header nav menu, so this can't be allowed to
      // throw. An empty menu (no dropdown links, generic panel imagery) is a
      // degraded header, not a broken site.
      return EMPTY_NAV_MENU;
    }

    const photos = products
      .map((p) => parseJsonArray(p.images)[0])
      .filter((url): url is string => Boolean(url));

    return {
      images: {
        collections: photos[0] ?? null,
        // A second photo where one exists, so the two panels aren't the same
        // image side by side.
        categories: photos[1] ?? photos[0] ?? null,
      },
      collections: rank(collections.map((c) => ({ name: c.name, slug: c.slug, count: c._count.products }))).map(
        (c) => ({ label: c.name, href: `/collections/${c.slug}` })
      ),
      categories: rank(
        categories.map((c) => ({ name: c.name, slug: c.slug, count: c._count.products }))
      ).map((c) => ({ label: c.name, href: `/shop?category=${c.slug}` })),
    };
  },
  [NAV_TAG],
  { revalidate: 300, tags: [NAV_TAG] }
);

/**
 * Called after any admin write that can change which collections and
 * categories have products: creating, editing or deleting a product, a
 * collection or a category.
 *
 * Without it the menu is only eventually correct — an admin who adds the first
 * product to a new collection would still not see it in the dropdown for
 * another five minutes, and would reasonably conclude the feature was broken.
 * The whole point of reading the menu from the catalogue is that it tracks the
 * catalogue.
 */
export function invalidateNavMenu() {
  revalidateTag(NAV_TAG);
}
