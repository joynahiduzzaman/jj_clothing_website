import { prisma } from "@/server/db";
import Link from "next/link";
import type { Metadata } from "next";
import CollectionDirectory from "@/components/CollectionDirectory";
import { SITE_URL } from "@/lib/site-url";
import { parseJsonArray } from "@/lib/utils";
import { brand } from "@/config/brand";

// ISR, matching the other catalogue pages: the collection list changes rarely,
// and a stale-by-a-minute directory is cheaper than a query on every visit.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Collections",
  description: `Shop ${brand.name}'s collections — seasonal drops and curated edits, all in one place.`,
  alternates: { canonical: `${SITE_URL}/collections` },
};

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      // Counted with the same filter the collection page renders with, so a
      // tile never promises products that the page it opens won't show.
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
      // Fallback tile art for a collection whose logo has not been uploaded yet.
      products: { where: { status: "ACTIVE" }, select: { images: true }, take: 1 },
    },
  });

  const stocked = collections.filter((c) => c._count.products > 0);

  const items = collections.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    logo: c.logo,
    productCount: c._count.products,
    image: parseJsonArray(c.products[0]?.images)[0] ?? null,
  }));

  return (
    <div className="bg-cream">
      {/* The page still needs one h1: it is the document's heading for screen
          readers and the target search engines pair with the title and canonical
          on this route. The visual masthead was removed, not the heading. */}
      <h1 className="sr-only">Our Collections</h1>

      {/* ── Directory ─────────────────────────────────────────────────────── */}
      {/* Bottom padding is deliberately small: the footer already carries a
          global mt-16/mt-24, and a full pb here stacked on top of it left ~176px
          of empty page between the last control and the footer. */}
      <section className="container-px mx-auto pb-6 pt-10 sm:pb-8 sm:pt-14">
        {items.length === 0 ? (
          <p className="py-20 text-center text-body">No collections have been added yet.</p>
        ) : (
          <CollectionDirectory collections={items} />
        )}

        {stocked.length > 0 && (
          // A wider gap than anything inside the directory: this is a way out of
          // the page, not part of it.
          <div className="mt-14 border-t border-border-soft pt-10 text-center sm:mt-20 sm:pt-12">
            <p className="text-sm text-body">Prefer to browse everything at once?</p>
            <Link
              href="/shop"
              className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full border border-ink/15 px-7 text-sm font-semibold text-ink transition-colors duration-300 hover:border-rose-gold hover:text-rose-gold-text"
            >
              Shop all products
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
