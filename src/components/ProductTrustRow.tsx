import { ShieldCheck, Globe2, Truck, RotateCcw } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, title: "Quality Checked", body: "Fit, fabric & finish" },
  { icon: Globe2, title: "Considered Design", body: "Made to last" },
  { icon: Truck, title: "Fast Delivery", body: "Dhaka in 1–3 days" },
  { icon: RotateCcw, title: "Easy Returns", body: "7-day window" },
];

/**
 * The shipping and authenticity promises.
 *
 * A full-width band below the product rather than a strip inside the buy
 * column: these four are the same on every product, so they are reassurance
 * once the case for this particular item has been made, not part of making it.
 *
 * One hairline-bordered strip, not four separate shadowed cards — four small
 * boxes with circular icon badges reads as a generic SaaS feature grid, which
 * fights the editorial, photography-led tone the rest of the product page is
 * going for. A single quiet rule top and bottom, icons sitting directly on
 * the page background, lets the row read as a supporting detail rather than a
 * fourth call for attention.
 */
export default function ProductTrustRow() {
  return (
    <section className="mt-14 md:mt-20 border-y border-border-soft py-7">
      <ul className="mx-auto grid max-w-4xl grid-cols-2 gap-y-6 gap-x-3 md:grid-cols-4 md:divide-x md:divide-border-soft">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex flex-col items-center gap-1.5 px-3 text-center md:first:pl-0 md:last:pr-0">
            <Icon aria-hidden="true" size={20} strokeWidth={1.5} className="text-rose-gold-text" />
            <span className="text-[13px] font-semibold leading-tight text-ink">{title}</span>
            <span className="text-xs leading-tight text-body">{body}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
