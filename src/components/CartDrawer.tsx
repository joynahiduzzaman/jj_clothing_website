"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { formatBDT } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/use-locale";

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal } = useCartStore();
  const { dict } = useLocale();
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  // Close on Escape, lock body scroll while open, and — same treatment as
  // QuickViewModal/SearchOverlay/SizeGuideModal — move focus into the dialog
  // and back out on close. This drawer has a real click-to-dismiss backdrop
  // just like those, so it needs the same modal focus handling; it had been
  // missed when this component was first built.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    if (isOpen) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      const trigger = document.activeElement as HTMLElement | null;
      const focusTimer = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 50);
      return () => {
        window.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
        window.clearTimeout(focusTimer);
        trigger?.focus?.({ preventScroll: true });
      };
    }
    document.body.style.overflow = "";
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeCart]);

  // Keep Tab inside the dialog while it is open — same pattern as QuickViewModal.
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[70] bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* Viewport-sized clipping shell.
          Without this the panel below — `position: fixed` and parked at
          `translate-x-full` while closed — sat entirely outside the viewport to
          the right and still counted toward the document's scroll width. That
          produced a ~9px horizontal scrollbar on EVERY page of the site at
          tablet widths. The shell is exactly the viewport, clips its overflow,
          and passes pointer events through so the backdrop stays clickable. */}
      <div className="fixed inset-0 z-[71] overflow-hidden pointer-events-none">
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-md bg-cream shadow-e4 transition-transform duration-300 ease-out flex flex-col ${
            isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
          ref={panelRef}
          onKeyDown={handleKeyDown}
        >
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink/10">
          <h2 className="font-display text-xl flex items-center gap-2">
            <ShoppingBag size={18} /> {dict.cart.title}
          </h2>
          <button ref={closeRef} onClick={closeCart} aria-label="Close cart" className="text-ink/70 hover:text-ink">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-ink/70">{dict.cart.empty}</p>
            <Link href="/shop" onClick={closeCart} className="btn-primary">{dict.cart.continueShopping}</Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-4">
                  <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-beige shrink-0">
                    {item.image && <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.slug}`} onClick={closeCart} className="text-sm font-medium hover:text-rose-gold-text line-clamp-1">
                      {item.name}
                    </Link>
                    {(item.color || item.size) && (
                      <p className="text-xs text-ink/50 mt-0.5">{[item.color, item.size].filter(Boolean).join(" / ")}</p>
                    )}
                    <p className="text-rose-gold-text font-semibold text-sm mt-1">{formatBDT(item.price)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-ink/15 rounded-full">
                        <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)} className="p-1.5" aria-label="Decrease quantity"><Minus size={12} /></button>
                        <span className="w-6 text-center text-xs">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)} className="p-1.5" aria-label="Increase quantity"><Plus size={12} /></button>
                      </div>
                      <button onClick={() => removeItem(item.productId, item.variantId)} className="text-ink/30 hover:text-red-500" aria-label="Remove item">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-ink/10 px-6 py-5 space-y-4 safe-bottom">
              <div className="flex justify-between text-sm">
                <span className="text-ink/70">{dict.cart.subtotal}</span>
                <span className="font-semibold text-base">{formatBDT(subtotal())}</span>
              </div>
              <p className="text-xs text-ink/70">{dict.cart.calculatedAtCheckout}</p>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/cart" onClick={closeCart} className="btn-outline text-center">View Cart</Link>
                <Link href="/checkout" onClick={closeCart} className="btn-primary text-center">{dict.cart.proceedToCheckout}</Link>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </>,
    document.body
  );
}
