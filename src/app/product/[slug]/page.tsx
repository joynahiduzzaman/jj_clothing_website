import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import { formatBDT, discountedPrice, parseJsonArray, safeJsonLd } from "@/lib/utils";
import ProductMediaTabs from "@/components/ProductMediaTabs";
import AddToCartPanel from "@/components/AddToCartPanel";
import StickyAddToCart from "@/components/StickyAddToCart";
import ProductTrustRow from "@/components/ProductTrustRow";
import ReviewCard from "@/components/ReviewCard";
import ProductCard from "@/components/ProductCard";
import RecordRecentlyViewed from "@/components/RecordRecentlyViewed";
import RecentlyViewedRail from "@/components/RecentlyViewedRail";
import FrequentlyBoughtTogether from "@/components/FrequentlyBoughtTogether";
import ProductFaq from "@/components/ProductFaq";
import SizeGuideModal from "@/components/SizeGuideModal";
import { Star } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60; // ISR: catalog pages regenerate at most once a minute instead of on every request

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      collection: true,
      category: true,
      variants: { orderBy: { position: "asc" } },
      reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  // Draft products are only visible in the admin panel — treat them as not-found
  // on the public storefront rather than a partially-rendered "coming soon" page.
  if (!product || product.status === "DRAFT") return null;
  return product;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 155),
    openGraph: {
      images: parseJsonArray(product.images).slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) return notFound();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, status: "ACTIVE", NOT: { id: product.id } },
    take: 4,
    include: { collection: { select: { name: true, slug: true } }, variants: true },
  });

  const images = parseJsonArray(product.images);
  const images360 = parseJsonArray(product.images360);
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const finalPrice = discountedPrice(product.variants[0]?.priceOverride ?? product.price, product.discountPercent);
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : null;

  const details = [
    product.material ? { label: "Material", value: product.material } : null,
    product.fit ? { label: "Fit", value: product.fit } : null,
    product.weightGrams ? { label: "Weight", value: `${product.weightGrams} g` } : null,
  ].filter((s): s is { label: string; value: string } => Boolean(s));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images,
    description: product.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: finalPrice,
      availability: totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(avgRating && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: avgRating.toFixed(1), reviewCount: product.reviews.length },
    }),
  };

  return (
    <div className="container-px mx-auto py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <RecordRecentlyViewed
        id={product.id}
        name={product.name}
        slug={product.slug}
        price={product.price}
        discountPercent={product.discountPercent}
        images={product.images}
        variants={product.variants}
        category={{ name: product.category.name, slug: product.category.slug }}
        isBestSeller={product.isBestSeller}
        isNewArrival={product.isNewArrival}
        isFlashSale={product.isFlashSale}
        isTrending={product.isTrending}
      />

      <nav className="text-xs text-ink/70 mb-8">
        Shop / {product.category.name} / <span className="text-ink/70">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 md:gap-16">
        <div className="md:sticky md:top-28 md:self-start">
          <ProductMediaTabs images={images} images360={images360} name={product.name} />
        </div>

        <div>
          {product.collection && (
            <p className="text-xs uppercase tracking-[0.15em] text-olive font-semibold mb-3">{product.collection.name}</p>
          )}
          <h1 className="font-display text-4xl font-semibold text-ink mb-2 leading-tight">{product.name}</h1>
          {product.banglaName && <p className="text-sm text-ink/70 mb-4">{product.banglaName}</p>}

          {avgRating && (
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={15} className={i < Math.round(avgRating) ? "fill-rose-gold text-rose-gold" : "text-ink/15"} />
                ))}
              </div>
              <span className="text-sm text-ink/70">{avgRating.toFixed(1)} ({product.reviews.length} reviews)</span>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <span className="font-display text-3xl font-semibold text-ink">{formatBDT(finalPrice)}</span>
            {product.discountPercent > 0 && (
              <>
                <span className="text-ink/70 line-through">{formatBDT(product.price)}</span>
                <span className="text-xs bg-badge-sale text-white rounded-full px-2.5 py-1 font-semibold">-{product.discountPercent}%</span>
              </>
            )}
          </div>

          <p className="text-ink/70 leading-relaxed mb-6">{product.description}</p>

          {(details.length > 0 || product.category.sizeGuide) && (
            <div className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-border-soft py-4">
              <dl className="flex flex-wrap gap-x-8 gap-y-3">
                {details.map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-[11px] uppercase tracking-[0.12em] text-ink/50">{label}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              {product.category.sizeGuide && (
                <SizeGuideModal sizeGuideJson={product.category.sizeGuide} />
              )}
            </div>
          )}

          {product.modelInfo && <p className="mb-4 text-xs italic text-ink/60">{product.modelInfo}</p>}

          <div id="main-add-to-cart">
            <AddToCartPanel
              productId={product.id}
              name={product.name}
              slug={product.slug}
              image={images[0] || ""}
              price={product.price}
              discountPercent={product.discountPercent}
              variants={product.variants}
              categoryName={product.category.name}
            />
          </div>
        </div>
      </div>

      <StickyAddToCart
        name={product.name}
        image={images[0] || ""}
        price={finalPrice}
        inStock={totalStock > 0}
      />

      {/* The shipping and quality promises, once the product itself has been
          made the case for. */}
      <ProductTrustRow />

      {/* Care instructions — replaces the skincare "How to Use" ritual section. */}
      {product.careInstructions && (
        <section className="mt-14 md:mt-24 mx-auto max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-gold-text font-semibold mb-3 text-center">Care</p>
          <h2 className="font-display text-3xl font-semibold mb-4 text-center">Care Instructions</h2>
          <p className="text-ink/70 leading-relaxed text-center">{product.careInstructions}</p>
        </section>
      )}

      <FrequentlyBoughtTogether
        items={[
          { id: product.id, name: product.name, slug: product.slug, price: product.price, discountPercent: product.discountPercent, images: product.images, variants: product.variants },
          ...related.slice(0, 2).map((p) => ({ id: p.id, name: p.name, slug: p.slug, price: p.price, discountPercent: p.discountPercent, images: p.images, variants: p.variants })),
        ]}
      />

      <ProductFaq />

      {product.reviews.length > 0 && (
        <section className="mt-14 md:mt-20 max-w-2xl mx-auto">
          <h2 className="font-display text-2xl mb-8 text-center">Customer Reviews</h2>
          <div className="space-y-4">
            {product.reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-14 md:mt-20">
          <h2 className="font-display text-2xl mb-8 text-center">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewedRail excludeId={product.id} />
    </div>
  );
}
