import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for local browser-based QA against this clothing-project
 * storefront/admin. Chromium only — this is for visual inspection and flow
 * testing during development, not a cross-browser compatibility suite.
 *
 * Never points anywhere but localhost: baseURL is always this project's own
 * dev server, never the original Seoul Glow Bangladesh site or any production
 * URL.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  // Generous for Next.js dev mode, where a route not yet hit in this server
  // session pays a one-time on-demand compile — a real production build (or a
  // dev server that's been warm for a while) is far faster than this floor.
  timeout: 45_000,
  // 5s was too tight against Next.js dev mode: a route's first on-demand
  // compile in a given server session can legitimately take longer than that,
  // which surfaced as intermittent `toHaveTitle`/`toBeVisible` failures that
  // were really "the page hadn't finished its first compile yet," not a real
  // assertion failure — confirmed by the same checks passing reliably once
  // given more time in a direct, isolated reproduction.
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  outputDir: "./test-results",

  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "on",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Reuses the dev server if one is already running on :3000 (the common case
  // in this workflow); starts a fresh one otherwise. Never runs `npm run
  // build && npm start` here — this is for live local QA against `next dev`.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
