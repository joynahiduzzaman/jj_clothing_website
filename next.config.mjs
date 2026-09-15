/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

// CRITICAL: Next.js dev mode (`npm run dev`) uses eval()-wrapped modules for Hot Module
// Replacement / Fast Refresh. A CSP without 'unsafe-eval' silently blocks ALL of that in
// the browser — meaning NO client-side JavaScript executes at all in dev mode. Every
// button, form, and click handler on the site would appear completely dead (while the
// page still looks fully rendered, since that part is plain server-rendered HTML that
// doesn't need JS). This is why CSP is standard practice to relax or skip in development
// and only enforce strictly in production, where Next.js ships a real bundle with no eval.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com`,
  "style-src 'self' 'unsafe-inline'",
  // blob: is required by the admin image fields. They show the picked file via
  // URL.createObjectURL while the upload is still in flight, and without blob:
  // the browser blocks that preview outright — the tile stays empty until the
  // round trip finishes, which is precisely the "did my image upload?" doubt the
  // preview exists to remove. A blob: URL is an object the page itself created,
  // so this grants no ability to load anything remote.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://analytics.tiktok.com https://connect.facebook.net",
  // google.com/maps is here for the embedded location map on /contact — without
  // it the CSP blocks the iframe and the contact page shows an empty grey box.
  "frame-src 'self' https://www.facebook.com https://www.google.com https://maps.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig = {
  // Required for the cPanel/Passenger deployment (warechhiya.com): Passenger's
  // "Setup Node.js App" tool needs one self-contained JS entry file it can
  // launch directly — the default build instead produces a `.next/` directory
  // meant to be served via `next start`, which assumes the full node_modules
  // tree and the Next CLI are both present and invoked a specific way, neither
  // of which Passenger does. Standalone mode traces the minimal dependency set
  // and emits `.next/standalone/server.js`, a plain Node http server with no
  // external CLI needed — exactly what Passenger's startup file field wants.
  // Harmless for the Vercel deployment: Vercel's own build pipeline ignores
  // this and uses its own output format regardless of what's set here.
  output: "standalone",
  images: {
    // Next's default is 60 seconds — far too short for product photography,
    // which effectively never changes at a given URL: uploaded filenames
    // already embed a timestamp + random suffix (see the admin upload route),
    // and Cloudinary/placehold.co URLs are likewise immutable per-URL. A long
    // TTL here means the optimizer serves the same re-encoded asset from cache
    // instead of redoing the work on every expiry, with no staleness risk.
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Product images uploaded through the admin panel are served from
      // Cloudinary. Without this entry next/image refuses the host outright and
      // every uploaded image renders as a broken placeholder.
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Demo/seed placeholder imagery only — see prisma/seed.ts. Safe to remove
      // once real product photography replaces every placehold.co URL.
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
  async redirects() {
    return [
      {
        // The old brand-directory route — renamed to /collections as part of
        // the clothing-brand transformation.
        source: "/brands",
        destination: "/collections",
        permanent: true,
      },
      {
        source: "/brands/:slug",
        destination: "/collections/:slug",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Applies to every route — standard hardening headers.
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
