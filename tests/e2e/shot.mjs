// Ad-hoc screenshot helper for fast design iteration — NOT part of the test
// suite. Only points at localhost, never a production URL.
//
// Usage: node tests/e2e/shot.mjs <path> <output-filename> [--mobile] [--viewport]
//   --mobile     390x844 viewport instead of the 1280x900 desktop default
//   --viewport   capture only the visible viewport instead of the full page
//                (full-page screenshots of long pages get scaled down so much
//                when previewed that small text/details become illegible —
//                use --viewport to inspect a specific section at native size)
import { chromium } from "@playwright/test";

const [, , path = "/", outFile = "shot.png", ...rest] = process.argv;
const mobile = rest.includes("--mobile");
const viewportOnly = rest.includes("--viewport");

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
  reducedMotion: "no-preference",
});
await page.goto(`http://localhost:3000${path}`, { waitUntil: "domcontentloaded", timeout: 20000 });
await page.waitForTimeout(4000);
await page.screenshot({ path: `tests/e2e/screenshots/${outFile}`, fullPage: !viewportOnly });
await browser.close();
console.log(`saved tests/e2e/screenshots/${outFile}`);
