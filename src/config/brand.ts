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
  name: "JJ Clothing",
  shortName: "JJ",
  tagline: "Dress Your Story",
  description:
    "Modern, considered clothing for everyday wear — designed in-house, made to last, shipped across Bangladesh.",

  currency: {
    code: "BDT",
    symbol: "৳", // ৳
  },
  country: "Bangladesh",

  contact: {
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@jjclothing.example",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  },

  social: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
  },

  logo: {
    // The user supplied real artwork (a "JJ" rose-gold/black monogram over a
    // hanger icon, "CLOTHING · DRESS YOUR STORY") pasted directly into chat —
    // there is no file path for it in this environment, so it could not be
    // written to disk here. Until it's saved to these exact paths in `public/`,
    // BrandLogo.tsx renders a typographic "JJ" monogram instead (same colors,
    // same circular mark shape, so the swap will be a drop-in visual match).
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
