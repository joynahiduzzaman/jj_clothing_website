import { brand } from "@/config/brand";

/**
 * The header brand mark.
 *
 * PLACEHOLDER: the original `/logo-mark.png` etc. files in `public/` are the
 * previous brand's actual artwork (a rose/botanical emblem baked into the
 * image itself) — that can't be edited like text, and showing it here would
 * be visually wrong for a clothing brand, not just generic. Until real logo
 * files are supplied, this renders a simple typographic monogram from
 * `brand.shortName` instead.
 *
 * To swap in a real logo later: replace this component's contents with an
 * `<Image src={brand.logo.mark} .../>` (the path is already wired through
 * `src/config/brand.ts`), and drop the real file at that path in `public/`.
 */
export default function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span
      // White plate, not cream: gives the mark a defined edge instead of
      // letting it float directly on the header background.
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink ring-1 ring-ink/[0.07] shadow-e1 ${className}`}
    >
      <span className="font-display text-[11px] font-semibold tracking-wide text-cream sm:text-sm" aria-hidden="true">
        {brand.shortName}
      </span>
    </span>
  );
}
