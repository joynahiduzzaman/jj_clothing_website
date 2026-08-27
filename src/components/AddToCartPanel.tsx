"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { useCompareStore } from "@/lib/compare-store";
import { useLocale } from "@/lib/i18n/use-locale";
import { useRouter } from "next/navigation";
import { Minus, Plus, GitCompare, ShoppingBag, Check, Loader2 } from "lucide-react";
import { discountedPrice } from "@/lib/utils";

export interface AddToCartVariant {
  id: string;
  color: string;
  size: string;
  stock: number;
  priceOverride?: number | null;
}

interface Props {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  discountPercent: number;
  variants: AddToCartVariant[];
  categoryName?: string;
}

type Status = "idle" | "adding" | "added";

export default function AddToCartPanel({ productId, name, slug, image, price, discountPercent, variants, categoryName = "" }: Props) {
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const isComparing = useCompareStore((s) => s.isComparing(productId));
  const toggleCompare = useCompareStore((s) => s.toggleItem);
  const router = useRouter();
  const { dict } = useLocale();

  const colors = useMemo(() => [...new Set(variants.map((v) => v.color))], [variants]);
  const [selectedColor, setSelectedColor] = useState(() => colors[0] ?? "");
  const sizesForColor = useMemo(() => variants.filter((v) => v.color === selectedColor), [variants, selectedColor]);
  const [selectedSize, setSelectedSize] = useState(() => sizesForColor.find((v) => v.stock > 0)?.size ?? sizesForColor[0]?.size ?? "");

  const selectedVariant = variants.find((v) => v.color === selectedColor && v.size === selectedSize);
  const stock = selectedVariant?.stock ?? 0;
  const finalPrice = discountedPrice(selectedVariant?.priceOverride ?? price, discountPercent);

  // Nothing may fire after unmount — leaving the page mid-confirmation would
  // otherwise set state on a component that is gone.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // Quantity can't outlive the variant it was set for — switching to a size
  // with less stock than the current quantity would otherwise silently submit
  // more than is available.
  useEffect(() => {
    setQty((q) => Math.max(1, Math.min(q, stock || 1)));
  }, [stock]);

  function selectColor(color: string) {
    setSelectedColor(color);
    const options = variants.filter((v) => v.color === color);
    setSelectedSize(options.find((v) => v.stock > 0)?.size ?? options[0]?.size ?? "");
  }

  function handleAdd() {
    if (status !== "idle" || !selectedVariant) return;
    // The cart is local state, so this resolves immediately; the pending frame
    // exists so the button is never a dead click on a slow device, and the
    // "Added" confirmation is what the shopper actually reads.
    setStatus("adding");
    addItem({
      productId,
      variantId: selectedVariant.id,
      name,
      slug,
      image,
      price: finalPrice,
      quantity: qty,
      stock,
      color: selectedVariant.color,
      size: selectedVariant.size,
    });
    timers.current.push(
      setTimeout(() => {
        setStatus("added");
        openCart();
        timers.current.push(setTimeout(() => setStatus("idle"), 1800));
      }, 180)
    );
  }

  function handleBuyNow() {
    if (!selectedVariant) return;
    addItem({
      productId,
      variantId: selectedVariant.id,
      name,
      slug,
      image,
      price: finalPrice,
      quantity: qty,
      stock,
      color: selectedVariant.color,
      size: selectedVariant.size,
    });
    router.push("/checkout");
  }

  const noVariantSelected = !selectedVariant;
  const outOfStock = noVariantSelected || stock === 0;

  return (
    <div className="space-y-4">
      {colors.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink/60">
            Color{selectedColor ? `: ${selectedColor}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => selectColor(color)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedColor === color ? "border-ink bg-ink text-cream" : "border-ink/15 text-ink/70 hover:border-ink/40"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {sizesForColor.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink/60">
            Size{selectedSize ? `: ${selectedSize}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {sizesForColor.map((v) => (
              <button
                key={v.size}
                type="button"
                disabled={v.stock === 0}
                onClick={() => setSelectedSize(v.size)}
                title={v.stock === 0 ? `${v.size} — out of stock` : v.size}
                className={`min-w-[3rem] rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35 disabled:line-through ${
                  selectedSize === v.size ? "border-ink bg-ink text-cream" : "border-ink/15 text-ink/70 hover:border-ink/40"
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>
      )}

      {outOfStock ? (
        <div className="space-y-3">
          <button type="button" disabled className="btn-cart w-full sm:w-auto sm:min-w-[15rem]">
            <ShoppingBag size={17} aria-hidden="true" />
            {dict.product.outOfStock}
          </button>
          <p className="text-sm font-medium text-red-600">{dict.product.outOfStock}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Quantity. Full width on a phone so the two steppers are wide, easy
                targets rather than a pinched pill. */}
            <div className="flex h-[52px] w-full items-center justify-between rounded-xl border border-ink/15 bg-white/70 sm:w-auto sm:justify-start">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="flex h-full w-14 items-center justify-center rounded-l-xl text-ink transition-colors hover:text-rose-gold-text disabled:cursor-not-allowed disabled:text-ink/25 sm:w-12"
                aria-label="Decrease quantity"
              >
                <Minus size={15} aria-hidden="true" />
              </button>
              <span className="min-w-[2.5rem] text-center text-base font-semibold tabular-nums" aria-live="polite">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(stock, q + 1))}
                disabled={qty >= stock}
                className="flex h-full w-14 items-center justify-center rounded-r-xl text-ink transition-colors hover:text-rose-gold-text disabled:cursor-not-allowed disabled:text-ink/25 sm:w-12"
                aria-label="Increase quantity"
              >
                <Plus size={15} aria-hidden="true" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={status !== "idle"}
              // The label changes, so the accessible name is pinned to the action.
              aria-label={dict.product.addToCart}
              className="btn-cart w-full sm:w-auto sm:min-w-[15rem]"
            >
              {status === "adding" ? (
                <>
                  <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                  Adding…
                </>
              ) : status === "added" ? (
                <>
                  <Check size={18} aria-hidden="true" />
                  Added to bag
                </>
              ) : (
                <>
                  <ShoppingBag size={17} aria-hidden="true" />
                  {dict.product.addToCart}
                </>
              )}
            </button>

            {/* Filled, but olive rather than rose: a real action that cannot be
                mistaken for the same one. The handler is unchanged. */}
            {/* A floor on the width so it does not collapse to a small pill beside
                the wider primary — still narrower, which is the hierarchy, but
                deliberately so rather than by accident of label length. */}
            <button onClick={handleBuyNow} className="btn-buy w-full sm:w-auto sm:min-w-[10rem]">
              {dict.product.buyNow}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-olive">
              <span className="h-1.5 w-1.5 rounded-full bg-olive" aria-hidden="true" />
              {stock} {dict.product.inStock}
            </span>
            <button
              type="button"
              aria-pressed={isComparing}
              onClick={() => toggleCompare({ productId, name, slug, image, price: finalPrice, categoryName })}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-4 text-xs font-medium transition-all duration-200 ${
                isComparing
                  ? "border-rose-gold bg-rose-gold/10 text-rose-gold-text"
                  : "border-ink/15 text-ink/70 hover:border-ink/30 hover:text-ink"
              }`}
            >
              <GitCompare size={13} aria-hidden="true" /> {isComparing ? "Added to Compare" : "Add to Compare"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
