import { prisma } from "@/server/db";
import ProductCard from "@/components/ProductCard";
import SortSelect from "@/components/SortSelect";
import FlashSaleCountdown from "@/components/FlashSaleCountdown";
import MobileFilterDrawer from "@/components/MobileFilterDrawer";
import Link from "next/link";
import { X } from "lucide-react";
import { GENDERS } from "@/lib/product-attributes";

export const dynamic = "force-dynamic";

export const metadata = { title: "Shop All" };

interface Props {
  searchParams: {
    category?: string;
    collection?: string;
    gender?: string;
    color?: string;
    size?: string;
    q?: string;
    filter?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  };
}

const FILTER_BANNERS: Record<string, { title: string; subtitle: string; showCountdown?: boolean }> = {
  bestseller: { title: "Best Sellers", subtitle: "The pieces our customers reorder again and again." },
  new: { title: "New Arrivals", subtitle: "Fresh in, before it sells through." },
  flashsale: { title: "Sale", subtitle: "Limited-time prices on selected pieces.", showCountdown: true },
  featured: { title: "Featured Products", subtitle: "Our current picks." },
  trending: { title: "Trending Now", subtitle: "What's being added to bags this week." },
};

interface Banner {
  title: string;
  subtitle: string;
  showCountdown?: boolean;
}

export default async function ShopPage({ searchParams }: Props) {
  const { category, collection, gender, color, size, q, filter, minPrice, maxPrice, sort } = searchParams;

  const where: any = { status: "ACTIVE" };
  if (category) where.category = { slug: category };
  if (collection) where.collection = { slug: collection };
  if (gender) where.gender = gender;
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }
  if (color || size) {
    where.variants = {
      some: {
        ...(color ? { color: { equals: color, mode: "insensitive" } } : {}),
        ...(size ? { size: { equals: size, mode: "insensitive" } } : {}),
      },
    };
  }
  if (filter === "bestseller") where.isBestSeller = true;
  if (filter === "new") where.isNewArrival = true;
  if (filter === "flashsale") where.isFlashSale = true;
  if (filter === "trending") where.isTrending = true;
  if (filter === "featured") where.isFeatured = true;

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  if (sort === "price_desc") orderBy = { price: "desc" };

  const [products, categories, collections, allVariants] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: { collection: { select: { name: true, slug: true } }, variants: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.collection.findMany({ orderBy: { name: "asc" } }),
    // Small catalogs make a full scan of variant color/size cheap; this feeds
    // the filter sidebar's color/size lists.
    prisma.productVariant.findMany({ select: { color: true, size: true } }),
  ]);

  const availableColors = [...new Set(allVariants.map((v) => v.color))].sort();
  const availableSizes = [...new Set(allVariants.map((v) => v.size))];

  const buildHref = (params: Record<string, string | undefined>) => {
    const usp = new URLSearchParams();
    const merged = { category, collection, gender, color, size, q, filter, minPrice, maxPrice, sort, ...params };
    Object.entries(merged).forEach(([k, v]) => v && usp.set(k, v));
    return `/shop?${usp.toString()}`;
  };

  const activeCategory = categories.find((c) => c.slug === category);
  const activeCollection = collections.find((c) => c.slug === collection);

  // Contextual banner: filter-based takes priority, then category/collection, then the default.
  const banner: Banner = filter && FILTER_BANNERS[filter]
    ? FILTER_BANNERS[filter]
    : activeCategory
    ? { title: activeCategory.name, subtitle: `Shop all ${activeCategory.name.toLowerCase()}.` }
    : activeCollection
    ? { title: activeCollection.name, subtitle: activeCollection.story || `Everything in the ${activeCollection.name} collection.` }
    : q
    ? { title: `Results for "${q}"`, subtitle: `${products.length} product${products.length !== 1 ? "s" : ""} found` }
    : { title: "Shop All Products", subtitle: "Considered clothing, made to last." };

  // Active filter chips — lets someone see (and clear) exactly what's narrowing their view.
  const activeChips: { label: string; clearHref: string }[] = [];
  if (activeCategory) activeChips.push({ label: activeCategory.name, clearHref: buildHref({ category: undefined }) });
  if (activeCollection) activeChips.push({ label: activeCollection.name, clearHref: buildHref({ collection: undefined }) });
  if (gender) activeChips.push({ label: gender.charAt(0) + gender.slice(1).toLowerCase(), clearHref: buildHref({ gender: undefined }) });
  if (color) activeChips.push({ label: color, clearHref: buildHref({ color: undefined }) });
  if (size) activeChips.push({ label: size, clearHref: buildHref({ size: undefined }) });
  if (filter && FILTER_BANNERS[filter]) activeChips.push({ label: FILTER_BANNERS[filter].title, clearHref: buildHref({ filter: undefined }) });
  if (minPrice || maxPrice) {
    activeChips.push({
      label: minPrice && maxPrice ? `৳${minPrice}–৳${maxPrice}` : maxPrice ? `Under ৳${maxPrice}` : `৳${minPrice}+`,
      clearHref: buildHref({ minPrice: undefined, maxPrice: undefined }),
    });
  }

  const filterContent = (
    <>
      <div>
        <h3 className="font-display text-lg mb-4">Gender</h3>
        <ul className="space-y-2.5 text-sm">
          <li>
            <Link href={buildHref({ gender: undefined })} className={`flex items-center gap-2 py-1 transition-colors ${!gender ? "text-rose-gold-text font-semibold" : "text-ink/70 hover:text-rose-gold"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${!gender ? "bg-rose-gold" : "bg-transparent"}`} />
              All
            </Link>
          </li>
          {GENDERS.map((g) => (
            <li key={g}>
              <Link href={buildHref({ gender: g })} className={`flex items-center gap-2 py-1 transition-colors ${gender === g ? "text-rose-gold-text font-semibold" : "text-ink/70 hover:text-rose-gold"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${gender === g ? "bg-rose-gold" : "bg-transparent"}`} />
                {g.charAt(0) + g.slice(1).toLowerCase()}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-display text-lg mb-4">Category</h3>
        <ul className="space-y-2.5 text-sm">
          <li>
            <Link href={buildHref({ category: undefined })} className={`flex items-center gap-2 py-1 transition-colors ${!category ? "text-rose-gold-text font-semibold" : "text-ink/70 hover:text-rose-gold"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${!category ? "bg-rose-gold" : "bg-transparent"}`} />
              All
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={buildHref({ category: c.slug })} className={`flex items-center gap-2 py-1 transition-colors ${category === c.slug ? "text-rose-gold-text font-semibold" : "text-ink/70 hover:text-rose-gold"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${category === c.slug ? "bg-rose-gold" : "bg-transparent"}`} />
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-display text-lg mb-4">Collection</h3>
        <ul className="space-y-2.5 text-sm max-h-56 overflow-y-auto pr-2">
          <li>
            <Link href={buildHref({ collection: undefined })} className={`flex items-center gap-2 py-1 transition-colors ${!collection ? "text-rose-gold-text font-semibold" : "text-ink/70 hover:text-rose-gold"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${!collection ? "bg-rose-gold" : "bg-transparent"}`} />
              All
            </Link>
          </li>
          {collections.map((c) => (
            <li key={c.slug}>
              <Link href={buildHref({ collection: c.slug })} className={`flex items-center gap-2 py-1 transition-colors ${collection === c.slug ? "text-rose-gold-text font-semibold" : "text-ink/70 hover:text-rose-gold"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${collection === c.slug ? "bg-rose-gold" : "bg-transparent"}`} />
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {availableColors.length > 0 && (
        <div>
          <h3 className="font-display text-lg mb-4">Color</h3>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((c) => (
              <Link
                key={c}
                href={buildHref({ color: color === c ? undefined : c })}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  color === c ? "border-ink bg-ink text-cream" : "border-ink/15 text-ink/70 hover:border-ink/40"
                }`}
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      )}

      {availableSizes.length > 0 && (
        <div>
          <h3 className="font-display text-lg mb-4">Size</h3>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((s) => (
              <Link
                key={s}
                href={buildHref({ size: size === s ? undefined : s })}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  size === s ? "border-ink bg-ink text-cream" : "border-ink/15 text-ink/70 hover:border-ink/40"
                }`}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-display text-lg mb-4">Price</h3>
        <div className="flex flex-col gap-2.5 text-sm">
          <Link href={buildHref({ minPrice: undefined, maxPrice: "1000" })} className="text-ink/70 hover:text-rose-gold transition-colors py-1">Under ৳1,000</Link>
          <Link href={buildHref({ minPrice: "1000", maxPrice: "2500" })} className="text-ink/70 hover:text-rose-gold transition-colors py-1">৳1,000 – ৳2,500</Link>
          <Link href={buildHref({ minPrice: "2500", maxPrice: undefined })} className="text-ink/70 hover:text-rose-gold transition-colors py-1">৳2,500+</Link>
        </div>
      </div>
    </>
  );

  return (
    <div>
      {/* Collection banner */}
      <div className="bg-beige/50 border-b border-ink/5 py-6 md:py-12">
        <div className="container-px mx-auto text-center">
          <h1 className="font-display text-2xl md:text-5xl font-semibold mb-2 md:mb-3">{banner.title}</h1>
          <p className="text-ink/70 text-sm md:text-base max-w-lg mx-auto">{banner.subtitle}</p>
          {banner.showCountdown && (
            <div className="flex justify-center mt-4">
              <FlashSaleCountdown />
            </div>
          )}
        </div>
      </div>

      {/* Quick category pills */}
      <div className="border-b border-ink/5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="container-px mx-auto flex gap-2 py-3 md:py-4 w-max min-w-full">
          <Link
            href={buildHref({ category: undefined })}
            className={`shrink-0 text-xs font-semibold rounded-full px-4 py-2 transition-colors ${
              !category ? "bg-ink text-white" : "bg-beige text-ink/70 hover:bg-beige/70"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={buildHref({ category: c.slug })}
              className={`shrink-0 text-xs font-semibold rounded-full px-4 py-2 transition-colors ${
                category === c.slug ? "bg-ink text-white" : "bg-beige text-ink/70 hover:bg-beige/70"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="container-px mx-auto py-10">
        {/* Sidebar appears at `lg`, not `md`. At md it used to claim 240px of a
            688px row while the product grid simultaneously went to 3 columns,
            leaving ~117px per card — narrower than the same card at 640px, and
            narrow enough that the image's own action icons overflowed it. */}
        <div className="grid lg:grid-cols-[240px_1fr] gap-12">
          <aside className="hidden lg:block space-y-8 lg:sticky lg:top-28 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            {filterContent}
          </aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <MobileFilterDrawer activeCount={activeChips.length} resultCount={products.length}>
                  {filterContent}
                </MobileFilterDrawer>
                {activeChips.map((chip) => (
                  <Link
                    key={chip.label}
                    href={chip.clearHref}
                    className="inline-flex items-center gap-1.5 text-xs font-medium bg-ink text-white rounded-full pl-3 pr-2 py-1.5 hover:bg-rose-gold transition-colors"
                  >
                    {chip.label} <X size={12} />
                  </Link>
                ))}
                {activeChips.length > 0 && (
                  <Link href="/shop" className="text-xs text-ink/70 hover:text-rose-gold-text underline">Clear all</Link>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-ink/70 hidden sm:inline">{products.length} products</span>
                <SortSelect currentSort={sort} baseHref={buildHref({ sort: undefined })} />
              </div>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-24 text-ink/70">
                No products match these filters. <Link href="/shop" className="text-rose-gold underline">Clear filters</Link>
              </div>
            ) : (
              // Third column waits for `xl`: once the sidebar is present at lg,
              // splitting the remaining width three ways again produces cards
              // too narrow to hold their own content.
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
