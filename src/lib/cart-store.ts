"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
  color?: string;
  size?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clear: () => void;
  subtotal: () => number;
  totalItems: () => number;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

// Defensive: if the shape stored in localStorage from an earlier version of this app is
// ever malformed (missing fields, not an array, etc.) — very possible after testing many
// iterations on the same origin — sanitize it into something safe rather than letting
// .find/.map/.reduce throw. This function is called by every store action's first line.
// A pre-variant-migration cart (no variantId) fails the shape check below and is simply
// dropped, same as any other malformed persisted blob — there's nothing safe to migrate
// it to, since the product it referenced may not even have the same variant shape anymore.
function sanitizeItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter(
    (i): i is CartItem =>
      i &&
      typeof i === "object" &&
      typeof (i as any).productId === "string" &&
      typeof (i as any).variantId === "string" &&
      typeof (i as any).price === "number" &&
      typeof (i as any).quantity === "number"
  ).map((i) => ({ ...i, stock: typeof i.stock === "number" ? i.stock : 9999 }));
}

const sameLine = (i: CartItem, productId: string, variantId: string) =>
  i.productId === productId && i.variantId === variantId;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) => {
        const items = sanitizeItems(get().items);
        const existing = items.find((i) => sameLine(i, item.productId, item.variantId));
        if (existing) {
          set({
            items: items.map((i) =>
              sameLine(i, item.productId, item.variantId)
                ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock || item.stock || 9999) }
                : i
            ),
          });
        } else {
          set({ items: [...items, item] });
        }
      },
      removeItem: (productId, variantId) =>
        set({ items: sanitizeItems(get().items).filter((i) => !sameLine(i, productId, variantId)) }),
      updateQuantity: (productId, variantId, quantity) =>
        set({
          items: sanitizeItems(get().items).map((i) =>
            sameLine(i, productId, variantId) ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock || 9999)) } : i
          ),
        }),
      clear: () => set({ items: [] }),
      subtotal: () => sanitizeItems(get().items).reduce((sum, i) => sum + i.price * i.quantity, 0),
      totalItems: () => sanitizeItems(get().items).reduce((sum, i) => sum + i.quantity, 0),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
    }),
    {
      name: "clothing-brand-cart",
      version: 2,
      // Only persist `items` — the drawer's open/closed state should never survive a
      // page reload (it would be jarring to land on a page with the cart already open).
      partialize: (state) => ({ items: state.items }),
      // If a persisted blob from an older shape fails to merge cleanly, fall back to an
      // empty cart instead of throwing during rehydration (which would otherwise break
      // every page that reads from this store, including the header on every route).
      merge: (persistedState, currentState) => {
        try {
          const persisted = persistedState as Partial<CartState> | undefined;
          return { ...currentState, items: sanitizeItems(persisted?.items) };
        } catch {
          return currentState;
        }
      },
    }
  )
);
