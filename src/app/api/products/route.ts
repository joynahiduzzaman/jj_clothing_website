import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { isFuzzyMatch } from "@/lib/fuzzy-search";

// GET /api/products?category=&collection=&gender=&color=&size=&minPrice=&maxPrice=&sort=&q=&filter=&limit=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const collection = searchParams.get("collection");
  const gender = searchParams.get("gender");
  const color = searchParams.get("color");
  const size = searchParams.get("size");
  const q = searchParams.get("q");
  const filter = searchParams.get("filter");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort");
  const inStock = searchParams.get("inStock");
  // Used by the search overlay's live-suggestion dropdown to keep the query cheap —
  // the shop page's full listing leaves this unset and gets everything as before.
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

  const where: any = { status: "ACTIVE" };
  if (category) where.category = { slug: category };
  if (collection) where.collection = { slug: collection };
  if (gender) where.gender = gender;
  if (color || size) {
    where.variants = {
      some: {
        ...(color ? { color: { equals: color, mode: "insensitive" } } : {}),
        ...(size ? { size: { equals: size, mode: "insensitive" } } : {}),
      },
    };
  }
  if (inStock === "true") {
    where.variants = { ...(where.variants || {}), some: { ...(where.variants?.some || {}), stock: { gt: 0 } } };
  }
  // Matches product name, collection name, and category — the search box
  // promises "products, collections, or categories", so "denim" or "essentials"
  // both work.
  //
  // `mode: "insensitive"` is load-bearing on PostgreSQL. Prisma compiles
  // `contains` to SQL LIKE, which SQLite evaluates case-insensitively for ASCII
  // but PostgreSQL does not — so after the move to Neon, "snail" matched nothing
  // while "Snail" matched, and every lowercase search (i.e. how people actually
  // type) silently returned an empty catalogue. This forces ILIKE.
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { collection: { name: { contains: q, mode: "insensitive" } } },
      { category: { name: { contains: q, mode: "insensitive" } } },
      { variants: { some: { color: { contains: q, mode: "insensitive" } } } },
    ];
  }
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }
  if (filter === "bestseller") where.isBestSeller = true;
  if (filter === "new") where.isNewArrival = true;
  if (filter === "flashsale") where.isFlashSale = true;
  if (filter === "trending") where.isTrending = true;
  if (filter === "featured") where.isFeatured = true;

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  if (sort === "price_desc") orderBy = { price: "desc" };
  if (sort === "newest") orderBy = { createdAt: "desc" };

  const include = {
    collection: { select: { name: true, slug: true } },
    category: { select: { name: true, slug: true } },
    reviews: { select: { rating: true } },
    variants: true,
  } as const;

  let products = await prisma.product.findMany({ where, orderBy, take: limit, include });

  // Typo-tolerance fallback: `contains` is still an exact substring match, so
  // "denm" or "esentials" would otherwise come back empty. Only kicks in for the
  // suggestion dropdown (limit set) and only once exact matching came up short —
  // most searches never reach this, so the extra query is rare, not per-keystroke.
  if (q && limit && products.length < limit) {
    const exactIds = new Set(products.map((p) => p.id));
    const candidates = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        ...(category ? { category: { slug: category } } : {}),
        ...(collection ? { collection: { slug: collection } } : {}),
      },
      take: 500,
      include,
    });
    const fuzzyMatches = candidates.filter(
      (p) =>
        !exactIds.has(p.id) &&
        (isFuzzyMatch(q, p.name) ||
          (p.collection ? isFuzzyMatch(q, p.collection.name) : false) ||
          isFuzzyMatch(q, p.category.name) ||
          p.variants.some((v) => isFuzzyMatch(q, v.color)))
    );
    products = [...products, ...fuzzyMatches].slice(0, limit);
  }

  // Same avgRating/reviewCount pattern already used on the homepage (see src/app/page.tsx)
  // — computed here instead of stored, since review counts are low enough that this is cheap.
  const withRatings = products.map(({ reviews, ...p }) => ({
    ...p,
    avgRating: reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null,
    reviewCount: reviews.length,
  }));

  return NextResponse.json({ products: withRatings });
}
