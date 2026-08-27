import { test, expect } from "@playwright/test";

/**
 * Browser-based QA smoke suite for the JJ Clothing storefront/admin.
 *
 * Runs Chromium only, against the local dev server (see playwright.config.ts —
 * baseURL is always localhost, never a production URL). Uses only local,
 * disposable test data: the seeded admin account and a customer account
 * created earlier for QA purposes. Never touches the original Seoul Glow
 * Bangladesh project or any production database.
 *
 * Screenshots are saved under tests/e2e/screenshots/ for visual review, in
 * addition to Playwright's own trace/video artifacts under test-results/
 * (configured for on-failure retention).
 *
 * Admin credentials come from E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD (falling back
 * to SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD, i.e. whatever your local .env seeded
 * the admin account with) — never hardcoded here, since that would mean
 * committing a real local password to source control.
 */

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || "";
const SCREENSHOT_DIR = "tests/e2e/screenshots";

test.describe("Storefront — customer flow", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/JJ Clothing/);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-homepage.png`, fullPage: true });
  });

  test("navigate from homepage into the shop", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /shop|new arrivals/i }).first().click();
    await page.waitForURL(/\/shop/);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-shop.png`, fullPage: true });
  });

  test("product page shows variants", async ({ page }) => {
    await page.goto("/product/canvas-tote-bag");
    await expect(page.getByRole("heading", { name: "Canvas Tote Bag" })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-product-page.png`, fullPage: true });
  });

  test("add to cart and open cart drawer", async ({ page }) => {
    await page.goto("/product/canvas-tote-bag");
    await page.getByRole("button", { name: /add to bag|add to cart/i }).click();
    // The drawer opens automatically after adding; give the slide-in animation a moment.
    await expect(page.getByText(/canvas tote bag/i).first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-cart-drawer.png`, fullPage: true });
  });

  test("checkout page loads with the cart item", async ({ page }) => {
    await page.goto("/product/canvas-tote-bag");
    await page.getByRole("button", { name: /add to bag|add to cart/i }).click();
    // Let the add-to-cart state settle before navigating away — starting a
    // hard navigation while the client is mid-update raced and aborted here.
    await expect(page.getByText(/canvas tote bag/i).first()).toBeVisible({ timeout: 5000 });
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toContainText(/canvas tote bag/i);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-checkout.png`, fullPage: true });
  });
});

test.describe("Admin — login and dashboard", () => {
  test.skip(!ADMIN_PASSWORD, "Set E2E_ADMIN_PASSWORD (or SEED_ADMIN_PASSWORD) to run the admin tests locally.");

  test("admin can log in", async ({ page }) => {
    await page.goto("/login");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-login-page.png`, fullPage: true });

    await page.getByLabel(/email/i).first().fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).first().fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /log ?in|sign in/i }).click();

    // page.waitForURL() defaults to also waiting for the "load" event, which
    // never fires for a Next.js App Router client-side redirect (no full page
    // navigation happens) — it would time out even though the URL genuinely
    // changed. Polling the URL via page.waitForFunction sidesteps that.
    await page.waitForFunction(() => !location.pathname.includes("/login"), null, { timeout: 10_000 });
  });

  test("admin dashboard loads", async ({ page }) => {
    // Log in fresh in this test too — Playwright tests don't share page state
    // across test() blocks by default, which is the correct isolation.
    await page.goto("/login");
    await page.getByLabel(/email/i).first().fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).first().fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /log ?in|sign in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10_000 });

    await page.goto("/admin");
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-admin-dashboard.png`, fullPage: true });
  });
});
