import Link from "next/link";
import Image from "next/image";
import { trimmedLogoUrl } from "@/lib/brand-logo";

export interface CollectionCardItem {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  /** Representative product shot — the fallback when no logo has been uploaded. */
  image?: string | null;
  productCount?: number;
}

/** Last resort only: a collection with neither a logo nor product imagery still
 *  needs to render as something deliberate rather than an empty box. */
function CollectionMonogram({ name }: { name: string }) {
  const letters = name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <span className="font-display text-2xl font-semibold tracking-wide text-rose-gold/70">{letters}</span>
  );
}

/**
 * One collection, presented as a logo first — same silhouette as CategoryCard
 * so the two directories read as one system.
 *
 * Once their built-in transparent margin is trimmed away, marks on file can run
 * from 1.2:1 to 6.2:1 — a stacked roundel and a long wordmark cannot share a
 * frame without one being cropped or dwarfed. So the plate is a fixed box and
 * the mark is *contained* within a generous inset: the frame does the sizing,
 * not the source file's arbitrary canvas.
 *
 * The plate is white, not cream: marks are typically transparent PNGs of mostly
 * dark artwork, and white is the surface a logo's own guidelines assume. It
 * also separates the mark from the cream page so each logo sits on its own card.
 */
export default function CollectionCard({ collection, priority }: { collection: CollectionCardItem; priority?: boolean }) {
  const count = collection.productCount;
  // A collection with nothing in it yet. It stays on the wall — knowing a
  // collection is coming is useful — but it is not a link, because the page
  // behind it is an empty grid and an apology. Marked, not hidden, and not
  // silently clickable.
  const comingSoon = count === 0;

  const frameClass = `group relative flex flex-col overflow-hidden rounded-xl2 border border-border-soft bg-white shadow-e1 transition-all duration-500 ease-silk ${
    comingSoon
      ? "cursor-default"
      : "hover:-translate-y-1 hover:border-rose-gold/30 hover:shadow-e4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold focus-visible:ring-offset-2"
  }`;

  const body = (
    <>
      {/* Logo plate. aspect-[5/3] is wide enough that a 1.91:1 wordmark still has
          room to breathe, and short enough that a square roundel does not float
          in a tall empty box. */}
      <div className="relative aspect-[5/3] w-full bg-white">
        <div className="absolute inset-0 flex items-center justify-center">
          {collection.logo ? (
            <Image
              src={trimmedLogoUrl(collection.logo)}
              alt={`${collection.name} logo`}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
              priority={priority}
              // The inset must live on the image, not the wrapper: `fill` is
              // absolutely positioned, and an absolutely positioned box resolves
              // against its ancestor's PADDING box — so padding on the wrapper is
              // ignored entirely and the trimmed marks ran to the card edge.
              // object-fit honours this element's own content box.
              className={`object-contain p-6 transition-transform duration-500 ease-silk sm:p-8 ${
                comingSoon ? "" : "group-hover:scale-[1.06]"
              }`}
            />
          ) : collection.image ? (
            <Image
              src={collection.image}
              alt={`${collection.name}`}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
              className={`object-cover transition-transform duration-700 ease-silk ${
                comingSoon ? "" : "group-hover:scale-[1.08]"
              }`}
            />
          ) : (
            <CollectionMonogram name={collection.name} />
          )}
        </div>
      </div>

      {/* Label plate, tinted so the white logo area above reads as its own
          surface and the card gains a base to sit on. */}
      <div
        className={`flex flex-1 flex-col items-center gap-1 border-t border-border-soft px-3 py-3.5 text-center transition-colors duration-500 ${
          comingSoon ? "bg-beige/40" : "bg-beige/40 group-hover:bg-beige/70"
        }`}
      >
        <span
          className={`line-clamp-1 font-display text-[15px] leading-snug text-ink transition-colors duration-300 ${
            comingSoon ? "" : "group-hover:text-rose-gold-text"
          }`}
        >
          {collection.name}
        </span>
        {comingSoon ? (
          // A pill rather than grey text: it has to read as a deliberate status,
          // not as a count that failed to load.
          <span className="mt-0.5 inline-flex items-center rounded-full bg-rose-gold/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-gold-text ring-1 ring-rose-gold/25">
            Coming soon
          </span>
        ) : (
          typeof count === "number" && (
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink/50">
              {count} {count === 1 ? "product" : "products"}
            </span>
          )
        )}
      </div>
    </>
  );

  if (comingSoon) {
    return (
      <div className={frameClass} aria-label={`${collection.name} — coming soon`}>
        {body}
      </div>
    );
  }

  return (
    <Link href={`/collections/${collection.slug}`} className={frameClass}>
      {body}
    </Link>
  );
}
