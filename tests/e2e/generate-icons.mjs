// One-off generator: renders the temporary "JJ" monogram templates via
// Playwright/Chromium and screenshots them at each size the app actually
// references, replacing the leftover Seoul Glow Bangladesh artwork in
// public/. Not part of the test suite — run manually if the placeholder
// needs regenerating (e.g. after changing the template HTML).
import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../../public");

const markTemplate = "file://" + path.resolve(__dirname, "logo-template.html").replace(/\\/g, "/");
const fullTemplate = "file://" + path.resolve(__dirname, "logo-full-template.html").replace(/\\/g, "/");
const transparentTemplate = "file://" + path.resolve(__dirname, "logo-transparent-template.html").replace(/\\/g, "/");

const browser = await chromium.launch();

async function shot(url, size, outPath, omitBackground = false) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.goto(url);
  await page.screenshot({ path: outPath, omitBackground });
  await page.close();
  console.log(`wrote ${outPath} (${size}x${size})`);
}

await shot(markTemplate, 16, path.join(publicDir, "favicon-16.png"));
await shot(markTemplate, 32, path.join(publicDir, "favicon-32.png"));
await shot(markTemplate, 180, path.join(publicDir, "apple-touch-icon.png"));
await shot(markTemplate, 192, path.join(publicDir, "icon-192.png"));
await shot(markTemplate, 512, path.join(publicDir, "icon-512.png"));
await shot(markTemplate, 512, path.join(publicDir, "logo-mark.png"));
await shot(fullTemplate, 1254, path.join(publicDir, "logo.png"));
await shot(transparentTemplate, 512, path.join(publicDir, "logo-transparent.png"), true);

await browser.close();
