// Authenticated screenshot helper — logs in as the seeded admin, then
// screenshots the given admin path. Ad-hoc, not part of the test suite.
// Usage: E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... node tests/e2e/shot-admin.mjs <path> <output-filename>
// (falls back to SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD, i.e. your local .env)
import { chromium } from "@playwright/test";

const [, , path = "/admin", outFile = "admin-shot.png"] = process.argv;
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || "";
if (!ADMIN_PASSWORD) {
  console.error("Set E2E_ADMIN_PASSWORD (or SEED_ADMIN_PASSWORD) before running this script.");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
await page.getByLabel(/email/i).first().fill(ADMIN_EMAIL);
await page.getByLabel(/password/i).first().fill(ADMIN_PASSWORD);
await page.getByRole("button", { name: /sign in/i }).click();
await page.waitForFunction(() => !location.pathname.includes("/login"), null, { timeout: 10000 });

await page.goto(`http://localhost:3000${path}`, { waitUntil: "domcontentloaded", timeout: 20000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: `tests/e2e/screenshots/${outFile}`, fullPage: true });
await browser.close();
console.log(`saved tests/e2e/screenshots/${outFile}`);
