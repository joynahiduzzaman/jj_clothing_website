import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-url";
import { trimmedLogoUrl } from "@/lib/brand-logo";

export const revalidate = 60; // ISR: catalog pages regenerate at most once a minute instead of on every request

async function getCollection(slug: string) {
  return prisma.collection.findUnique({
    where: { slug },
    include: {
      // ACTIVE only. A draft or archived product has no shop page, so listing
      // it here produced a card that 404s — and made this page's count disagree
      // with the one on the /collections tile, which counts what it can show.
      products: {
        where: { status: "ACTIVE" },
        include: { collection: { select: { name: true, slug: true } }, variants: true },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const collection = await getCollection(params.slug);
  if (!collection) return {};
  return {
    title: collection.name,
    description: collection.story || undefined,
    alternates: { canonical: `${SITE_URL}/collections/${collection.slug}` },
  };
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const collection = await getCollection(params.slug);
  if (!collection) return notFound();

  const bestSellers = collection.products.filter((p) => p.isBestSeller);
  const newProducts = collection.products.filter((p) => p.isNewArrival);
  // Highlight rows only earn their place when they are a *selection*. With one
  // or two products per collection they repeated the same card two and three
  // times down the page, which read as a rendering fault rather than curation.
  const showHighlights = collection.products.length > 4;

  return (
    <div className="bg-cream">
      {/* ── Collection masthead ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border-soft bg-gradient-to-b from-beige/45 to-cream">
        {/* The halo follows the mark to the left and shrinks with the section,
            so it still pools behind the logo rather than floating overhead. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-[260px] w-[520px] max-w-[150%] -translate-x-1/3 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(168,92,63,0.16), rgba(168,92,63,0))" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-gold/45 to-transparent"
        />

        <div className="container-px relative mx-auto pb-5 pt-4 sm:pb-7 sm:pt-6">
          {/* Left-aligned now, not centred: it starts the same reading column
              the logo, name and grid below all share. */}
          <nav aria-label="Breadcrumb" className="mb-4 sm:mb-5">
            <ol className="flex flex-wrap items-center gap-1 text-[11px] text-ink/55 sm:gap-1.5 sm:text-xs">
              <li><Link href="/" className="transition-colors hover:text-rose-gold-text">Home</Link></li>
              <ChevronRight size={11} aria-hidden="true" className="shrink-0" />
              <li><Link href="/collections" className="transition-colors hover:text-rose-gold-text">Collections</Link></li>
              <ChevronRight size={11} aria-hidden="true" className="shrink-0" />
              <li aria-current="page" className="font-medium text-ink/75">{collection.name}</li>
            </ol>
          </nav>

          {/* items-center, so a one-line collection with no story still sits
              level with its mark instead of hanging off the top of the plate. */}
          <div className="flex items-center gap-3.5 sm:gap-6">
            {collection.logo && (
              <div className="flex h-14 w-[100px] shrink-0 items-center justify-center rounded-xl2 bg-white p-2 shadow-e2 ring-1 ring-ink/[0.06] sm:h-[78px] sm:w-[150px] sm:p-3">
                <div className="relative h-full w-full">
                  <Image
                    src={trimmedLogoUrl(collection.logo)}
                    alt={`${collection.name} logo`}
                    fill
                    priority
                    sizes="(max-width: 640px) 100px, 150px"
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            {/* min-w-0: without it the flex child refuses to shrink below its
                content width and a long collection story pushes the row wider
                than the viewport. */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {/* A collection with nothing in it says "Coming soon", the same
                    wording the /collections tile uses. "0 products" is
                    technically true and reads as a bug. */}
                {collection.products.length === 0 ? (
                  <span className="inline-flex items-center rounded-full bg-rose-gold/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-gold-text ring-1 ring-rose-gold/25">
                    Coming soon
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/55 sm:text-[11px]">
                    {collection.products.length} {collection.products.length === 1 ? "product" : "products"}
                  </span>
                )}
              </div>

              <h1 className="mt-1 font-display text-[22px] font-semibold leading-[1.15] text-ink sm:mt-1.5 sm:text-[30px] md:text-[34px]">
                {collection.name}
              </h1>

              {/* Clamped rather than cut: the full story stays in the DOM for
                  search engines and screen readers, but it can never grow the
                  masthead past two lines and push the grid back down. */}
              {collection.story && (
                <p className="mt-1 line-clamp-2 max-w-2xl text-[12.5px] leading-relaxed text-body sm:mt-1.5 sm:line-clamp-3 sm:text-sm">
                  {collection.story}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* pt-6, not py-12: the gap between the masthead and the first heading was
          the other half of why no products were visible. */}
      <div className="container-px mx-auto space-y-12 pb-12 pt-6 sm:space-y-14 sm:pb-16 sm:pt-8">
        {collection.products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-display text-xl">No products in {collection.name} yet</p>
            <p className="mt-2 text-sm text-body">They are on their way — browse the rest of the catalogue meanwhile.</p>
            <Link
              href="/shop"
              className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-ink/15 px-7 text-sm font-semibold transition-colors hover:border-rose-gold hover:text-rose-gold-text"
            >
              Shop all products
            </Link>
          </div>
        ) : (
          <>
            {/* The full range leads. The curated rows only appear at all past
                four products, so for most collections this is the only section
                on the page. */}
            <ProductSection title={`Shop ${collection.name}`} products={collection.products} />
            {showHighlights && bestSellers.length > 0 && (
              <ProductSection title={`${collection.name} Best Sellers`} products={bestSellers} />
            )}
            {showHighlights && newProducts.length > 0 && (
              <ProductSection title={`New in ${collection.name}`} products={newProducts} />
            )}
          </>
        )}

        <div className="border-t border-border-soft pt-10 text-center">
          <Link
            href="/collections"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-rose-gold-text"
          >
            Browse all collections
            <ChevronRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProductSection({ title, products }: { title: string; products: ProductCardData[] }) {
  return (
    <section>
      <h2 className="mb-4 font-display text-[22px] font-semibold leading-tight text-ink sm:mb-5 sm:text-[26px]">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4 md:gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
