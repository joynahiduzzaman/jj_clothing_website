"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { formatBDT, discountedPrice, parseJsonArray } from "@/lib/utils";

export interface SearchableVariant {
  id: string;
  color: string;
  size: string;
  stock: number;
  priceOverride?: number | null;
}

export interface SearchableProduct {
  id: string;
  name: string;
  price: number;
  discountPercent: number;
  images: string;
  category?: { name: string };
  variants: SearchableVariant[];
}

/** Fetches the full admin product list once (same list the Products page uses)
 * and searches it client-side — the store's catalog is small enough that this
 * is simpler and snappier than a debounced server round-trip per keystroke.
 *
 * A product has one or more variants (color/size), so picking a result is a
 * two-step affair: pick the product, then — inline, right under that result —
 * pick which variant. A single-variant product skips straight to onSelect. */
export default function ProductSearchPicker({
  onSelect,
}: {
  onSelect: (product: SearchableProduct, variant: SearchableVariant) => void;
}) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchableProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [pickingVariantFor, setPickingVariantFor] = useState<SearchableProduct | null>(null);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, []);

  const results = query.trim().length > 0
    ? products.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  function pick(p: SearchableProduct) {
    if (p.variants.length <= 1) {
      const only = p.variants[0];
      if (only) onSelect(p, only);
      setQuery("");
      setOpen(false);
      return;
    }
    setPickingVariantFor(p);
  }

  function pickVariant(p: SearchableProduct, v: SearchableVariant) {
    onSelect(p, v);
    setPickingVariantFor(null);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setPickingVariantFor(null); }}
          onFocus={() => setOpen(true)}
          placeholder={loading ? "Loading products…" : "Search products to add…"}
          disabled={loading}
          className="w-full rounded-lg border border-ink/10 pl-9 pr-4 py-2.5 text-sm"
        />
      </div>
      {open && query.trim().length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg border border-ink/5 max-h-72 overflow-y-auto">
          {results.length === 0 && <p className="text-xs text-ink/70 p-3">No matching products.</p>}
          {results.map((p) => {
            const thumb = parseJsonArray(p.images)[0];
            const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
            if (pickingVariantFor?.id === p.id) {
              return (
                <div key={p.id} className="border-b border-ink/5 px-3 py-2.5">
                  <p className="mb-1.5 text-[11px] font-semibold text-ink/70">Choose color / size for {p.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        disabled={v.stock === 0}
                        onClick={() => pickVariant(p, v)}
                        className="rounded-full border border-ink/10 px-2.5 py-1 text-[11px] font-medium hover:bg-beige/60 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {v.color} / {v.size} · {v.stock} in stock
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pick(p)}
                className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-beige/60 text-left"
              >
                <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-beige shrink-0">
                  {thumb && <Image src={thumb} alt={p.name} fill sizes="36px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-[11px] text-ink/70">
                    {p.category?.name ? `${p.category.name} · ` : ""}
                    {formatBDT(discountedPrice(p.price, p.discountPercent))} · {totalStock} in stock
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setPickingVariantFor(null); }} />
      )}
    </div>
  );
}
