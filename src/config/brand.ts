/**
 * Single source of truth for brand identity. Every page/component/email that
 * shows the brand name, tagline, contact info, social links, or currency
 * should import from here rather than hardcoding a literal — so swapping in
 * the real brand name later is a one-line change, not a repo-wide find/replace.
 *
 * Colors are documented here for reference, but Tailwind cannot read a TS
 * module at build-config time — the actual color VALUES live in
 * tailwind.config.ts and must be kept in sync with the hex values below by
 * hand if either changes.
 */

export const brand = {
  name: "Warechhiya",
  shortName: "W",
  tagline: "Dress Your Story",
  description:
    "Modern, considered clothing for everyday wear — designed in-house, made to last, shipped across Bangladesh.",

  currency: {
    code: "BDT",
    symbol: "৳", // ৳
  },
  country: "Bangladesh",

  contact: {
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@warechhiya.example",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  },

  social: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
  },

  logo: {
    // These PNGs (plus every favicon/PWA icon in public/) are generated, not
    // hand-drawn — see tests/e2e/generate-icons.mjs and its three *-template.html
    // files. They render a typographic monogram/wordmark from plain HTML/CSS via
    // Playwright, so renaming the brand is: edit the "W"/"Warechhiya" text in
    // those three templates, then rerun `node tests/e2e/generate-icons.mjs`
    // to regenerate every size at once. Swap in real artwork at these same
    // paths whenever it's ready — nothing else needs to change.
    mark: "/logo-mark.png",
    full: "/logo.png",
  },

  // Reference palette — mirrors the actual Tailwind token names/values in
  // tailwind.config.ts (kept in sync by hand; token names were deliberately
  // NOT renamed there to avoid a repo-wide class-name rename, so these keys
  // match the Tailwind tokens directly, not a separate naming scheme).
  colors: {
    cream: "#F7F4EF",
    beige: "#EBE5DC",
    ink: "#1C1B19",
    "rose-gold": "#B8365E",
    gold: "#C99A2E",
    success: "#3F6B4F",
  },
} as const;

export type Brand = typeof brand;
