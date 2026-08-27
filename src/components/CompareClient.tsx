"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, GitCompare, ShoppingBag, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useCompareStore } from "@/lib/compare-store";
import { useCartStore } from "@/lib/cart-store";
import { formatBDT, discountedPrice, parseJsonArray } from "@/lib/utils";

interface CompareVariant {
  id: string;
  color: string;
  size: string;
  stock: number;
  priceOverride?: number | null;
}

interface CompareProduct {
  id: string;
  name: string;
  slug: string;
  images: string;
  price: number;
  discountPercent: number;
  material: string | null;
  fit: string | null;
  careInstructions: string | null;
  gender: string;
  variants: CompareVariant[];
  collection: { name: string; slug: string } | null;
  category: { name: string; slug: string };
}

function StockStatus({ stock }: { stock: number }) {
  if (stock === 0) return <span className="text-xs font-semibold text-badge-sale">Out of Stock</span>;
  if (stock <= 5) return <span className="text-xs font-semibold text-gold">Only {stock} left</span>;
  return <span className="text-xs font-semibold text-success">In Stock</span>;
}

const ROWS: { label: string; render: (p: CompareProduct) => React.ReactNode }[] = [
  {
    label: "Collection",
    render: (p) =>
      p.collection ? (
        <Link href={`/collections/${p.collection.slug}`} className="text-rose-gold hover:underline">{p.collection.name}</Link>
      ) : (
        <span className="text-ink/35">—</span>
      ),
  },
  { label: "Category", render: (p) => p.category.name },
  { label: "Gender", render: (p) => p.gender.charAt(0) + p.gender.slice(1).toLowerCase() },
  {
    label: "Price",
    render: (p) => {
      const final = discountedPrice(p.price, p.discountPercent);
      return (
        <span className="flex items-baseline gap-1.5">
          <span className="font-semibold text-ink">{formatBDT(final)}</span>
          {p.discountPercent > 0 && <span className="text-xs text-ink/35 line-through">{formatBDT(p.price)}</span>}
        </span>
      );
    },
  },
  { label: "Stock Status", render: (p) => <StockStatus stock={p.variants.reduce((s, v) => s + v.stock, 0)} /> },
  {
    label: "Colors",
    render: (p) => {
      const colors = [...new Set(p.variants.map((v) => v.color))];
      return colors.length ? (
        <div className="flex flex-wrap justify-center gap-1">
          {colors.map((c) => <span key={c} className="text-[11px] bg-beige/60 border border-border-soft rounded-full px-2 py-0.5">{c}</span>)}
        </div>
      ) : <span className="text-ink/35">—</span>;
    },
  },
  {
    label: "Sizes",
    render: (p) => {
      const sizes = [...new Set(p.variants.map((v) => v.size))];
      return sizes.length ? (
        <div className="flex flex-wrap justify-center gap-1">
          {sizes.map((s) => <span key={s} className="text-[11px] bg-beige/60 border border-border-soft rounded-full px-2 py-0.5">{s}</span>)}
        </div>
      ) : <span className="text-ink/35">—</span>;
    },
  },
  { label: "Material", render: (p) => p.material || <span className="text-ink/35">—</span> },
  { label: "Fit", render: (p) => p.fit || <span className="text-ink/35">—</span> },
  { label: "Care Instructions", render: (p) => p.careInstructions || <span className="text-ink/35">—</span> },
];

export default function CompareClient() {
  const storedItems = useCompareStore((s) => s.items);
  const removeItem = useCompareStore((s) => s.removeItem);
  const clear = useCompareStore((s) => s.clear);
  const addToCart = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storedItems.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ids = storedItems.map((i) => i.productId).join(",");
    fetch(`/api/products/compare?ids=${ids}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
    // storedItems is a new array reference on every store update, but we only care
    // about which ids are selected, so re-fetching whenever the id set changes is correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedItems.map((i) => i.productId).join(",")]);

  function addProductToCart(p: CompareProduct) {
    const variant = p.variants.find((v) => v.stock > 0);
    if (!variant) return;
    const images = parseJsonArray(p.images);
    addToCart({
      productId: p.id,
      variantId: variant.id,
      name: p.name,
      slug: p.slug,
      image: images[0] || "",
      price: discountedPrice(variant.priceOverride ?? p.price, p.discountPercent),
      quantity: 1,
      stock: variant.stock,
      color: variant.color,
      size: variant.size,
    });
    toast.success(`${p.name} added to bag`);
    openCart();
  }

  if (storedItems.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-gold/10 text-rose-gold">
          <GitCompare size={26} />
        </div>
        <h2 className="font-display text-xl font-semibold mb-2">Nothing to compare yet</h2>
        <p className="text-sm text-ink/70 mb-6">
          Browse the shop and tap the <GitCompare size={13} className="inline -mt-0.5" /> icon on any 2–4 products to line them up here.
        </p>
        <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
          Browse Products <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${storedItems.length}, minmax(0, 1fr))` }}>
        {storedItems.map((i) => (
          <div key={i.productId} className="aspect-[3/4] rounded-xl2 bg-beige/60 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {products.length < 2 && (
        <div className="max-w-lg mx-auto text-center mb-10 rounded-xl2 bg-gold/[0.08] border border-gold/20 p-5">
          <p className="text-sm text-ink/70">Add at least one more product to see a side-by-side comparison.</p>
          <Link href="/shop" className="link-tap text-sm text-rose-gold-text hover:underline mt-2 inline-block">Keep Browsing →</Link>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button onClick={clear} className="text-xs text-ink/70 hover:text-rose-gold-text transition-colors">Clear all</button>
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-border-soft shadow-e1 bg-white">
        <div
          className="grid min-w-[640px]"
          style={{ gridTemplateColumns: `160px repeat(${products.length}, minmax(200px, 1fr))` }}
        >
          {/* Product header row: image, name, remove */}
          <div className="sticky left-0 z-10 bg-white border-b border-r border-border-soft" />
          {products.map((p) => {
            const images = parseJsonArray(p.images);
            const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
            return (
              <div key={p.id} className="relative border-b border-l border-border-soft p-4 text-center">
                <button
                  onClick={() => removeItem(p.id)}
                  aria-label={`Remove ${p.name} from comparison`}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full text-ink/30 hover:bg-beige hover:text-ink transition-colors"
                >
                  <X size={14} />
                </button>
                <Link href={`/product/${p.slug}`} className="block">
                  <div className="relative aspect-square w-24 mx-auto rounded-xl overflow-hidden bg-beige mb-3">
                    {images[0] && <Image src={images[0]} alt={p.name} fill sizes="96px" className="object-cover" />}
                  </div>
                  <p className="text-sm font-medium text-ink line-clamp-2 hover:text-rose-gold-text transition-colors">{p.name}</p>
                </Link>
                <button
                  onClick={() => addProductToCart(p)}
                  disabled={totalStock === 0}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink text-white px-4 py-2 text-xs font-medium hover:bg-rose-gold transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ShoppingBag size={12} /> Add to Bag
                </button>
              </div>
            );
          })}

          {/* Attribute rows */}
          {ROWS.map((row, i) => (
            <Fragment key={row.label}>
              <div
                className={`sticky left-0 z-10 bg-beige/40 border-r border-border-soft px-4 py-4 text-xs font-semibold uppercase tracking-wide text-ink/70 ${i === ROWS.length - 1 ? "" : "border-b"}`}
              >
                {row.label}
              </div>
              {products.map((p) => (
                <div
                  key={`${row.label}-${p.id}`}
                  className={`border-l border-border-soft px-4 py-4 text-sm text-ink/80 text-center ${i === ROWS.length - 1 ? "" : "border-b"}`}
                >
                  {row.render(p)}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
