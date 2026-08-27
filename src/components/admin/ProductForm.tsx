"use client";

import { useEffect, useState } from "react";
import ImageUploadField from "./ImageUploadField";
import { X, Plus } from "lucide-react";
import { GENDERS, SUGGESTED_SIZES, SUGGESTED_COLORS, type Gender } from "@/lib/product-attributes";

export interface VariantFormRow {
  id?: string;
  color: string;
  size: string;
  sku: string;
  stock: string;
  priceOverride: string;
}

export interface ProductFormValues {
  name: string;
  slug: string;
  banglaName: string;
  collectionId: string;
  categoryId: string;
  description: string;
  material: string;
  fit: string;
  careInstructions: string;
  gender: Gender;
  modelInfo: string;
  price: string;
  costPrice: string;
  discountPercent: string;
  images: string[];
  status: "ACTIVE" | "DRAFT";
  weightGrams: string;
  metaTitle: string;
  metaDescription: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFlashSale: boolean;
  isTrending: boolean;
  variants: VariantFormRow[];
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: "",
  slug: "",
  banglaName: "",
  collectionId: "",
  categoryId: "",
  description: "",
  material: "",
  fit: "",
  careInstructions: "",
  gender: "UNISEX",
  modelInfo: "",
  price: "",
  costPrice: "",
  discountPercent: "0",
  images: [],
  status: "ACTIVE",
  weightGrams: "",
  metaTitle: "",
  metaDescription: "",
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: true,
  isFlashSale: false,
  isTrending: false,
  variants: [],
};

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border-soft pt-6 first:border-0 first:pt-0">
      <h3 className="text-sm font-semibold text-ink mb-1">{title}</h3>
      {description && <p className="text-xs text-ink/70 mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/** Labelled field wrapper. Every input gets a persistent label + optional help
 * text, rather than relying on a placeholder that disappears the moment you
 * start typing — which is what made the pricing row ambiguous before. */
function Field({
  label,
  hint,
  required,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-[13px] font-medium text-ink">
        {label} {required && <span className="text-badge-sale">*</span>}
      </label>
      {hint && <p className="mb-1.5 text-[11px] leading-snug text-ink/70">{hint}</p>}
      {children}
    </div>
  );
}

/** Money input with a permanent ৳ prefix inside the control, so the unit is
 * unambiguous whether or not the field is empty. `accent` tints the prefix and
 * focus ring to visually separate cost (what you paid) from selling price
 * (what the customer pays). */
function MoneyInput({
  id,
  value,
  onChange,
  accent = "rose",
  required,
  placeholder = "0.00",
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  accent?: "rose" | "amber" | "green";
  required?: boolean;
  placeholder?: string;
}) {
  const tone = {
    rose: { prefix: "text-rose-gold bg-rose-gold/[0.08]", ring: "focus-within:border-rose-gold focus-within:ring-rose-gold/10" },
    amber: { prefix: "text-gold bg-gold/[0.12]", ring: "focus-within:border-gold focus-within:ring-gold/10" },
    green: { prefix: "text-success bg-success/[0.10]", ring: "focus-within:border-success focus-within:ring-success/10" },
  }[accent];

  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-xl border border-border-soft bg-white transition-all duration-200 focus-within:ring-4 ${tone.ring}`}
    >
      <span className={`flex items-center px-3.5 text-base font-semibold ${tone.prefix}`} aria-hidden="true">
        ৳
      </span>
      <input
        id={id}
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 bg-transparent px-3.5 py-2.5 text-sm tabular-nums placeholder:text-ink/30 focus:outline-none"
      />
    </div>
  );
}

/**
 * Color/size variant editor.
 *
 * Not a rigid color×size grid — a strict grid breaks the moment one colorway
 * doesn't come in every size (a real, common case). Instead: pick colors and
 * sizes, "Generate" cross-products them into rows (skipping any combo that
 * already exists), then each row is independently editable/deletable — delete
 * the one row that shouldn't exist rather than fighting a grid.
 */
function VariantEditor({ variants, onChange }: { variants: VariantFormRow[]; onChange: (next: VariantFormRow[]) => void }) {
  const [colorInput, setColorInput] = useState("");
  const [pendingColors, setPendingColors] = useState<string[]>([]);
  const [pendingSizes, setPendingSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState("");

  function addColor(name: string) {
    const trimmed = name.trim();
    if (!trimmed || pendingColors.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return;
    setPendingColors((c) => [...c, trimmed]);
  }

  function toggleSize(size: string) {
    setPendingSizes((s) => (s.includes(size) ? s.filter((x) => x !== size) : [...s, size]));
  }

  function generate() {
    if (pendingColors.length === 0 || pendingSizes.length === 0) return;
    const existing = new Set(variants.map((v) => `${v.color.toLowerCase()}::${v.size.toLowerCase()}`));
    const additions: VariantFormRow[] = [];
    for (const color of pendingColors) {
      for (const size of pendingSizes) {
        const key = `${color.toLowerCase()}::${size.toLowerCase()}`;
        if (existing.has(key)) continue;
        existing.add(key);
        additions.push({ color, size, sku: "", stock: "0", priceOverride: "" });
      }
    }
    onChange([...variants, ...additions]);
    setPendingColors([]);
    setPendingSizes([]);
  }

  function updateRow(i: number, patch: Partial<VariantFormRow>) {
    onChange(variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  }

  function removeRow(i: number) {
    onChange(variants.filter((_, j) => j !== i));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl2 border border-border-soft bg-beige/30 p-4">
        <p className="mb-2 text-[13px] font-medium text-ink">1. Pick colors</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {SUGGESTED_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => addColor(c)}
              className="rounded-full border border-ink/12 px-3 py-1.5 text-xs font-medium text-ink/65 transition-colors hover:border-ink/25 hover:text-ink"
            >
              + {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addColor(colorInput);
                setColorInput("");
              }
            }}
            placeholder="Type a color and press Enter (e.g. Olive Green)"
            className="field !py-2 flex-1"
          />
        </div>
        {pendingColors.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {pendingColors.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full bg-ink text-cream px-3 py-1 text-xs font-medium">
                {c}
                <button type="button" onClick={() => setPendingColors((p) => p.filter((x) => x !== c))} aria-label={`Remove ${c}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <p className="mb-2 mt-4 text-[13px] font-medium text-ink">2. Pick sizes</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={pendingSizes.includes(s)}
              onClick={() => toggleSize(s)}
              className={`min-h-[36px] rounded-full border px-3.5 text-xs font-medium transition-colors ${
                pendingSizes.includes(s) ? "border-rose-gold bg-rose-gold/10 text-rose-gold-text" : "border-ink/12 text-ink/65 hover:border-ink/25"
              }`}
            >
              {s}
            </button>
          ))}
          {pendingSizes.filter((s) => !(SUGGESTED_SIZES as readonly string[]).includes(s)).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed
              onClick={() => toggleSize(s)}
              className="min-h-[36px] rounded-full border border-rose-gold bg-rose-gold/10 px-3.5 text-xs font-medium text-rose-gold-text"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (customSize.trim()) toggleSize(customSize.trim());
                setCustomSize("");
              }
            }}
            placeholder="Custom size (e.g. 42 for shoes) and press Enter"
            className="field !py-2 flex-1"
          />
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={pendingColors.length === 0 || pendingSizes.length === 0}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-cream transition-opacity disabled:opacity-30"
        >
          <Plus size={13} /> Generate {pendingColors.length * pendingSizes.length || ""} variant{pendingColors.length * pendingSizes.length === 1 ? "" : "s"}
        </button>
      </div>

      {variants.length === 0 ? (
        <p className="rounded-lg bg-badge-sale/10 border border-badge-sale/20 px-4 py-3 text-xs text-badge-sale">
          Add at least one color/size variant before saving — every product needs at least one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl2 border border-border-soft">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-beige/40 text-left text-[11px] uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-3 py-2">Color</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Price Override</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {variants.map((v, i) => (
                <tr key={i} className="border-t border-border-soft">
                  <td className="px-3 py-2">
                    <input value={v.color} onChange={(e) => updateRow(i, { color: e.target.value })} className="w-24 rounded-lg border border-ink/10 px-2 py-1.5 text-sm" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={v.size} onChange={(e) => updateRow(i, { size: e.target.value })} className="w-16 rounded-lg border border-ink/10 px-2 py-1.5 text-sm" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={v.sku} onChange={(e) => updateRow(i, { sku: e.target.value.toUpperCase() })} placeholder="optional" className="w-28 rounded-lg border border-ink/10 px-2 py-1.5 text-sm font-mono" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} value={v.stock} onChange={(e) => updateRow(i, { stock: e.target.value })} className="w-20 rounded-lg border border-ink/10 px-2 py-1.5 text-sm tabular-nums" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} step="0.01" value={v.priceOverride} onChange={(e) => updateRow(i, { priceOverride: e.target.value })} placeholder="inherit" className="w-24 rounded-lg border border-ink/10 px-2 py-1.5 text-sm tabular-nums" />
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => removeRow(i)} aria-label="Remove variant" className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-600">
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Local draft of an in-progress product.
 *
 * Belt to the session keep-alive's braces. Even with the token refreshing in
 * the background a save can still fail — the network drops, the tab is closed
 * by accident, the browser is restarted — and a product with a description and
 * a full variant matrix represents real typing. Losing that silently was the
 * worst part of this bug.
 *
 * localStorage rather than a draft row: it survives a crashed tab and a dead
 * session equally, needs no schema change, and never leaves half-finished
 * products in the catalogue. Cleared as soon as the product actually saves.
 */
const DRAFT_KEY = "clothing-brand-admin-product-draft";
const DRAFT_DEBOUNCE_MS = 1200;

function readDraft(): { values: ProductFormValues; savedAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.values ? parsed : null;
  } catch {
    return null;
  }
}

export function clearProductDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* private mode or storage disabled — nothing to clear */
  }
}

export default function ProductForm({
  initialValues,
  submitLabel,
  loading,
  onSubmit,
  draftKeyEnabled = false,
}: {
  initialValues: ProductFormValues;
  submitLabel: string;
  loading: boolean;
  onSubmit: (values: ProductFormValues) => void;
  /** Drafts are only kept for new products — an edit already has a saved
   *  record to fall back on, and restoring a stale draft over a live product
   *  would be worse than losing it. */
  draftKeyEnabled?: boolean;
}) {
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState<ProductFormValues>(initialValues);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues.slug));
  const [errors, setErrors] = useState<string[]>([]);
  const [draft, setDraft] = useState<{ values: ProductFormValues; savedAt: number } | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/meta").then((r) => r.json()).then((d) => {
      setCollections(d.collections);
      setCategories(d.categories);
    });
  }, []);

  // Offer to restore rather than restoring silently: quietly repopulating a
  // form with work from a previous session is disorienting, and the admin may
  // have moved on deliberately.
  useEffect(() => {
    if (!draftKeyEnabled) return;
    const found = readDraft();
    if (found && found.values.name?.trim()) setDraft(found);
  }, [draftKeyEnabled]);

  // Debounced so a fast typist is not writing to storage on every keystroke.
  useEffect(() => {
    if (!draftKeyEnabled) return;
    const dirty = form.name.trim() || form.description.trim() || form.images.length > 0;
    if (!dirty) return;
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ values: form, savedAt: Date.now() }));
        setDraftSavedAt(Date.now());
      } catch {
        /* storage full or disabled — the form still works, just without a net */
      }
    }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [form, draftKeyEnabled]);

  // Re-sync if the parent hands us different initial values later (e.g. the edit
  // page finishes fetching the product after this component has already mounted).
  useEffect(() => {
    setForm(initialValues);
    setSlugTouched(Boolean(initialValues.slug));
  }, [initialValues]);

  // Slug auto-follows the name until the admin edits it directly — then it stops
  // following, so a deliberate manual override never gets silently overwritten.
  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  }

  // Per-unit profit, derived live from the two price fields. Null unless both
  // are present and the selling price is non-zero, so an empty cost never
  // renders as a flattering "100% margin".
  const margin = (() => {
    const cost = Number(form.costPrice);
    const sell = Number(form.price);
    if (!form.costPrice || !form.price || !Number.isFinite(cost) || !Number.isFinite(sell) || sell <= 0) return null;
    const profit = sell - cost;
    return { profit, percent: (profit / sell) * 100 };
  })();

  function validate(): string[] {
    const errs: string[] = [];
    if (!form.name.trim()) errs.push("Product name is required");
    if (form.slug && !/^[a-z0-9-]+$/.test(form.slug)) errs.push("Slug can only contain lowercase letters, numbers, and hyphens");
    if (!form.price || Number(form.price) <= 0) errs.push("Price must be greater than 0");
    if (!form.categoryId) errs.push("Select a category");
    if (!form.description.trim()) errs.push("Description is required");
    if (form.variants.length === 0) errs.push("Add at least one color/size variant");
    const comboKeys = new Set<string>();
    for (const v of form.variants) {
      if (!v.color.trim() || !v.size.trim()) { errs.push("Every variant needs a color and size"); break; }
      const key = `${v.color.trim().toLowerCase()}::${v.size.trim().toLowerCase()}`;
      if (comboKeys.has(key)) { errs.push(`Duplicate variant: ${v.color} / ${v.size}`); break; }
      comboKeys.add(key);
    }
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) return;
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl2 shadow-soft p-6 space-y-6">
      {draft && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-rose-gold/25 bg-rose-gold/[0.06] p-3.5 text-xs">
          <span className="flex-1 text-ink/75">
            An unsaved draft of <strong className="text-ink">{draft.values.name || "a product"}</strong> was found from{" "}
            {new Date(draft.savedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.
          </span>
          <button
            type="button"
            onClick={() => {
              setForm(draft.values);
              setSlugTouched(Boolean(draft.values.slug));
              setDraft(null);
            }}
            className="rounded-full bg-ink px-3.5 py-1.5 font-semibold text-cream"
          >
            Restore it
          </button>
          <button
            type="button"
            onClick={() => {
              clearProductDraft();
              setDraft(null);
            }}
            className="font-semibold text-ink/50 hover:text-ink"
          >
            Discard
          </button>
        </div>
      )}

      {errors.length > 0 && (
        <div className="rounded-lg bg-badge-sale/10 border border-badge-sale/20 p-3.5 text-xs text-badge-sale space-y-1">
          {errors.map((e) => <p key={e}>• {e}</p>)}
        </div>
      )}

      <FormSection title="Basic Information" description="What customers see and how it's found.">
        <Field label="Product Name" hint="Shown on the product page, search results and cards." required htmlFor="name">
          <input
            id="name"
            required
            placeholder="e.g. Oversized Cotton T-Shirt"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="field"
          />
        </Field>

        <Field label="Bangla Name (optional)" hint="Shown alongside the English name for the Bangla storefront." htmlFor="banglaName">
          <input
            id="banglaName"
            value={form.banglaName}
            onChange={(e) => setForm({ ...form, banglaName: e.target.value })}
            className="field"
          />
        </Field>

        <Field label="URL Slug" hint="The web address for this product. Auto-generated from the name — edit only if you need a specific link.">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs text-ink/35">/product/</span>
            <input
              value={form.slug}
              onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: slugify(e.target.value) }); }}
              placeholder={slugify(form.name) || "auto-generated-from-name"}
              className="field flex-1 !py-2 font-mono !text-xs"
            />
            {slugTouched && (
              <button type="button" onClick={() => { setSlugTouched(false); setForm({ ...form, slug: slugify(form.name) }); }} className="shrink-0 text-xs text-rose-gold-text hover:underline">
                Reset
              </button>
            )}
          </div>
        </Field>

        <Field label="Description" hint="What this piece is and who it's for. Shown on the product page." required htmlFor="description">
          <textarea
            id="description"
            required
            placeholder="Describe the fabric, silhouette, and how it's meant to be worn…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="field resize-y"
          />
        </Field>
      </FormSection>

      <FormSection title="Fit &amp; Material" description="Shown on the product page as Material, Fit and Care Instructions.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Material" hint="e.g. 100% Cotton" htmlFor="material">
            <input id="material" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="field" placeholder="100% Cotton" />
          </Field>
          <Field label="Fit" hint="e.g. Relaxed Fit, Slim Fit, Oversized" htmlFor="fit">
            <input id="fit" value={form.fit} onChange={(e) => setForm({ ...form, fit: e.target.value })} className="field" placeholder="Relaxed Fit" />
          </Field>
        </div>

        <Field label="Care Instructions" htmlFor="careInstructions">
          <textarea
            id="careInstructions"
            placeholder="Machine wash cold. Do not bleach. Tumble dry low."
            value={form.careInstructions}
            onChange={(e) => setForm({ ...form, careInstructions: e.target.value })}
            rows={3}
            className="field resize-y"
          />
        </Field>

        <Field label="Model Info" hint="Shown near the size selector, e.g. helps a shopper judge sizing." htmlFor="modelInfo">
          <input
            id="modelInfo"
            value={form.modelInfo}
            onChange={(e) => setForm({ ...form, modelInfo: e.target.value })}
            placeholder={`Model is 5'10" wearing size M`}
            className="field"
          />
        </Field>
      </FormSection>

      <FormSection title="Images">
        <ImageUploadField images={form.images} onChange={(images) => setForm({ ...form, images })} />
      </FormSection>

      <FormSection title="Pricing" description="What you paid, and what the customer pays. A variant below can override the selling price.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl2 border border-gold/25 bg-gold/[0.05] p-4">
            <Field
              label="💰 Cost Price"
              hint="What you paid your supplier for one unit. Admin-only — never shown to customers."
              htmlFor="costPrice"
            >
              <MoneyInput id="costPrice" accent="amber" value={form.costPrice} onChange={(v) => setForm({ ...form, costPrice: v })} />
            </Field>
          </div>

          <div className="rounded-xl2 border border-rose-gold/25 bg-rose-gold/[0.05] p-4">
            <Field
              label="🏷️ Selling Price"
              hint="The price a customer pays, before any discount below."
              required
              htmlFor="price"
            >
              <MoneyInput id="price" accent="rose" required value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
            </Field>
          </div>
        </div>

        {/* Live margin readout — only shown once both numbers are real, so it
            never displays a misleading 100% margin against an empty cost. */}
        {margin && (
          <div
            className={`flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl px-4 py-3 text-[13px] ${
              margin.profit >= 0 ? "bg-success/[0.07] text-success" : "bg-badge-sale/[0.07] text-badge-sale"
            }`}
          >
            <span className="font-semibold">{margin.profit >= 0 ? "Profit per unit" : "Loss per unit"}</span>
            <span className="tabular-nums">৳ {Math.abs(margin.profit).toFixed(2)}</span>
            <span className="opacity-40">·</span>
            <span className="tabular-nums">{margin.percent.toFixed(1)}% margin</span>
            {margin.profit < 0 && <span className="text-xs opacity-80">Selling below cost.</span>}
          </div>
        )}

        <Field label="Discount %" hint="Percentage off the selling price. Leave at 0 for no discount." htmlFor="discountPercent">
          <div className="flex max-w-xs items-stretch overflow-hidden rounded-xl border border-border-soft bg-white transition-all duration-200 focus-within:border-rose-gold focus-within:ring-4 focus-within:ring-rose-gold/10">
            <input
              id="discountPercent"
              type="number"
              min={0}
              max={100}
              value={form.discountPercent}
              onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
              placeholder="0"
              className="w-full min-w-0 bg-transparent px-3.5 py-2.5 text-sm tabular-nums placeholder:text-ink/30 focus:outline-none"
            />
            <span className="flex items-center bg-ink/[0.04] px-3.5 text-sm font-semibold text-ink/70" aria-hidden="true">%</span>
          </div>
        </Field>
      </FormSection>

      <FormSection title="Colors &amp; Sizes" description="Every product needs at least one color/size variant — stock and SKU live here, per variant.">
        <VariantEditor variants={form.variants} onChange={(variants) => setForm({ ...form, variants })} />
      </FormSection>

      <FormSection title="Shipping Details" description="Optional — used for courier weight.">
        <Field label="Weight" hint="Package weight in grams." htmlFor="weightGrams">
          <div className="flex max-w-xs items-stretch overflow-hidden rounded-xl border border-border-soft bg-white transition-all duration-200 focus-within:border-rose-gold focus-within:ring-4 focus-within:ring-rose-gold/10">
            <input
              id="weightGrams"
              type="number"
              step="1"
              min={0}
              value={form.weightGrams}
              onChange={(e) => setForm({ ...form, weightGrams: e.target.value })}
              placeholder="0"
              className="w-full min-w-0 bg-transparent px-3.5 py-2.5 text-sm tabular-nums placeholder:text-ink/30 focus:outline-none"
            />
            <span className="flex items-center bg-ink/[0.04] px-3.5 text-xs font-medium text-ink/70" aria-hidden="true">g</span>
          </div>
        </Field>
      </FormSection>

      <FormSection title="Organization" description="How this product is grouped and merchandised.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Gender" required htmlFor="gender">
            <select
              id="gender"
              required
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
              className="field"
            >
              {GENDERS.map((g) => <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>)}
            </select>
          </Field>
          <Field label="Category" hint="Where it appears when customers browse by type." required htmlFor="categoryId">
            <select
              id="categoryId"
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="field"
            >
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Collection" hint="Optional — the seasonal/thematic collection this belongs to.">
          <select
            value={form.collectionId}
            onChange={(e) => setForm({ ...form, collectionId: e.target.value })}
            className="field"
          >
            <option value="">No collection</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <Field label="Status" hint="Drafts are saved but stay hidden from the shop until you set them Active.">
          <div className="flex flex-col gap-2 sm:flex-row">
            {(["ACTIVE", "DRAFT"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={form.status === s}
                onClick={() => setForm({ ...form, status: s })}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-silk ${
                  form.status === s
                    ? s === "ACTIVE"
                      ? "border-success bg-success/[0.08] text-success shadow-e1"
                      : "border-gold bg-gold/[0.10] text-gold shadow-e1"
                    : "border-border-soft text-ink/70 hover:border-ink/20 hover:text-ink"
                }`}
              >
                {s === "ACTIVE" ? "Active — visible in shop" : "Draft — hidden from shop"}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Merchandising Tags" hint="Controls which homepage rails and badges this product appears in.">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(
              [
                ["isFeatured", "Featured"],
                ["isBestSeller", "Best Seller"],
                ["isNewArrival", "New Arrival"],
                ["isFlashSale", "Sale"],
                ["isTrending", "Trending"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] transition-all duration-200 ease-silk ${
                  form[key] ? "border-rose-gold bg-rose-gold/[0.07] font-medium text-rose-gold-text" : "border-border-soft text-ink/70 hover:border-ink/20"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="accent-rose-gold"
                />
                {label}
              </label>
            ))}
          </div>
        </Field>
      </FormSection>

      <FormSection title="Search Engine (SEO)" description="Optional — falls back to the product name and description if left blank.">
        <Field label="Meta Title" hint="The headline Google shows. Aim for under 60 characters." htmlFor="metaTitle">
          <input
            id="metaTitle"
            maxLength={70}
            placeholder="e.g. Oversized Cotton T-Shirt — JJ Clothing"
            value={form.metaTitle}
            onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
            className="field"
          />
          <p className={`mt-1 text-right text-[11px] tabular-nums ${form.metaTitle.length > 60 ? "text-gold" : "text-ink/35"}`}>
            {form.metaTitle.length}/70
          </p>
        </Field>
        <Field label="Meta Description" hint="The summary under the headline in search results." htmlFor="metaDescription">
          <textarea
            id="metaDescription"
            maxLength={160}
            placeholder="One or two sentences on what the piece is and why it's worth buying…"
            rows={3}
            value={form.metaDescription}
            onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
            className="field resize-y"
          />
          <p className={`mt-1 text-right text-[11px] tabular-nums ${form.metaDescription.length > 155 ? "text-gold" : "text-ink/35"}`}>
            {form.metaDescription.length}/160
          </p>
        </Field>
      </FormSection>

      <div>
        <button disabled={loading} className="btn-primary w-full">{loading ? "Saving…" : submitLabel}</button>
        {draftKeyEnabled && draftSavedAt && (
          // Visible reassurance that the work is recoverable — the point of the
          // draft is lost if nobody knows it exists.
          <p className="mt-2 text-center text-[11px] text-ink/45">
            Draft saved locally at{" "}
            {new Date(draftSavedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} — it will be
            restored if this page is closed before saving.
          </p>
        )}
      </div>
    </form>
  );
}
