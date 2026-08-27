import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium fashion palette, v2 — bolder and more saturated than the first
        // muted-neutral retune, per an explicit "make it colorful and
        // professional" request. IMPORTANT: token NAMES stay identical across
        // both retunes on purpose — 150+ files across the app reference classes
        // like `bg-cream`/`text-rose-gold`/`border-beige`, and renaming the
        // tokens would require an enormous, error-prone rename sweep for zero
        // visual benefit. Only the HEX VALUES change here; every existing class
        // reference repaints correctly with no file-by-file edits needed. Kept
        // in sync by hand with src/config/brand.ts (Tailwind can't read a TS
        // module at build-config time).
        cream: "#F7F4EF", // warm off-white (page background) — unchanged, still the calm canvas the bolder accents sit on
        beige: "#EBE5DC", // stone (secondary surfaces/cards) — unchanged
        "rose-gold": "#B8365E", // was #A85C3F (muted terracotta) — vivid berry/raspberry, the primary brand accent
        "rose-gold-light": "#D5688A", // was #C08165 — lighter berry tint (hover glows, gradient-ring)
        // Text-safe accent pair: the fills above are vivid enough to fail 4.5:1
        // WCAG AA as small text on cream/beige. These are the same hue, darkened
        // until they clear it with margin (measured against beige, the darker
        // surface): rose-gold-text 5.26:1, gold-text 5.24:1.
        "rose-gold-text": "#A63155",
        "gold-text": "#75591B",
        olive: "#286947", // was #4A5240 (deep moss) — vivid emerald, distinct hue from rose-gold (Buy Now button + used directly as small text, so already AA-safe: 5.24:1 on beige)
        "pastel-green": "#D3E4D6", // was #D7DCC9 — fresher mint-sage tint (status pills: Verified/Delivered/Live)
        "soft-pink": "#F0DCE2", // was #E9DED2 — soft berry-pink tint matching the new rose-gold hue
        ink: "#1C1B19", // near-black text — unchanged
        body: "#6B6255", // AA-safe body copy on cream/beige — unchanged
        "border-soft": "#E3DCD1", // hairline borders — unchanged
        success: "#3F6B4F", // semantic confirmation green — unchanged, distinct from the merchandising/CTA greens above
        gold: "#C99A2E", // was #A6863E — richer amber (ratings, premium accents)
        // Bold merchandising palette — badge/tag/urgency UI only, never brand
        // chrome. Pushed more vivid in this pass so tags read as confident
        // color rather than muted editorial tone. Same fill-vs-text-safe split
        // as before (each `-text` variant clears 4.5:1 on both cream and beige
        // with margin; badge-best/coupon/onetwo pass at full vividness already
        // and need no separate `-text` variant).
        "badge-sale-text": "#AC2D1B",
        "badge-today-text": "#7D5401",
        "badge-new-text": "#146B38",
        "badge-best": "#1E293B", // deep navy — distinct from the reds/greens/ambers around it
        "badge-sale": "#E23B23", // was #C1442A — vivid red-orange
        "badge-coupon": "#2563EB", // vivid blue
        "badge-today": "#F0A202", // was #B5772A — vivid amber (flash-sale/limited-time urgency)
        "badge-new": "#1E9E52", // was #2E6B4E — vivid emerald
        "badge-onetwo": "#7C3AED", // vivid purple — generic tertiary tag color (Badge.tsx's "1+1"/bundle variant)
      },
      fontFamily: {
        serif: ["var(--font-serif)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        // Elevation scale — one ramp used sitewide so "how far off the page" is
        // always a deliberate choice rather than an ad-hoc shadow per component.
        // Tinted with the brand warm-rose rather than neutral black, which keeps
        // shadows from going grey/dirty against the cream background.
        soft: "0 8px 30px rgba(183, 110, 121, 0.12)",
        glass: "0 8px 32px rgba(43, 38, 36, 0.08)",
        "e1": "0 1px 2px rgba(47, 42, 40, 0.04), 0 1px 3px rgba(47, 42, 40, 0.06)",
        "e2": "0 2px 6px rgba(47, 42, 40, 0.05), 0 6px 16px rgba(183, 110, 121, 0.08)",
        "e3": "0 4px 12px rgba(47, 42, 40, 0.06), 0 12px 32px rgba(183, 110, 121, 0.12)",
        "e4": "0 8px 24px rgba(47, 42, 40, 0.08), 0 24px 56px rgba(183, 110, 121, 0.16)",
      },
      borderRadius: {
        // Radius scale: pill (full) → control (xl, 12px) → card (xl2, 20px) →
        // surface (xl3, 28px). Components pick a rung, never a one-off px value.
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      transitionTimingFunction: {
        // Single easing vocabulary. `silk` is the default for UI motion —
        // a gentle decelerate that reads as expensive rather than springy.
        silk: "cubic-bezier(0.22, 0.61, 0.36, 1)",
        "silk-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};
export default config;
