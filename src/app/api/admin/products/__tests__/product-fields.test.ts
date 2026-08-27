import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The Product model carries material, fit, careInstructions, gender and
 * modelInfo, and a Product always has at least one ProductVariant (color,
 * size, sku, stock, priceOverride) — but nothing writing or rendering these
 * is worth much if a field silently drops somewhere along the way. Two
 * separate ways to lose a field showed up before, on the skincare version of
 * this model, and the same shape of bug is just as possible here:
 *
 *  1. The create/update handlers could hardcode a field instead of using the
 *     request value, so a correct request body is discarded on the way in.
 *  2. There are three client call sites that build a product payload (the new
 *     page, the edit page, the drawer). Adding a field to the form but to only
 *     two of the three silently drops it on the third.
 *
 * Both are invisible in review and neither throws. These are source checks
 * rather than request tests because the failure is a missing line, not a
 * runtime error.
 */
const read = (rel: string) => readFileSync(path.resolve(process.cwd(), rel), "utf8");

const PAYLOAD_FIELDS = ["material", "fit", "careInstructions", "gender", "modelInfo", "variants"] as const;

describe("admin product write path keeps every editable field", () => {
  it("the create handler persists variants as a nested create, not a hardcoded value", () => {
    const src = read("src/app/api/admin/products/route.ts");
    expect(src, "variants must be created from the request body, not pinned to an empty array").toMatch(
      /variants:\s*\{\s*create:/
    );
  });

  it("the update handler treats a resubmitted variants array as a real value", () => {
    const src = read("src/app/api/admin/products/[id]/route.ts");
    // `if (variants)` guards the whole variant-sync block — an emptied array
    // would still be truthy-checked against `.length` inside the zod schema
    // (min(1)), so this just confirms the block is reachable at all.
    expect(src, "the variants array from the request must drive the update").toMatch(/if \(variants\)/);
  });

  it.each([
    ["src/app/admin/products/new/page.tsx", "Add Product page"],
    ["src/app/admin/products/[id]/edit/page.tsx", "Edit Product page"],
    ["src/components/admin/ProductDrawer.tsx", "product drawer"],
  ])("%s sends every field the form collects", (file) => {
    const src = read(file);
    const missing = PAYLOAD_FIELDS.filter((f) => !new RegExp(`\\b${f}\\b`).test(src));
    expect(missing, `these fields never reach the API from this call site`).toEqual([]);
  });

  it("the product page renders the fields customers were promised", () => {
    const src = read("src/app/product/[slug]/page.tsx");
    for (const marker of ["material", "fit", "careInstructions", "modelInfo"]) {
      expect(src, `${marker} is stored but never shown to the customer`).toMatch(new RegExp(`\\b${marker}\\b`));
    }
  });
});
