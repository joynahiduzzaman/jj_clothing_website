"use client";

const STORAGE_KEY = "clothing-brand-recently-viewed";
const MAX_ITEMS = 10;

export interface RecentlyViewedItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPercent: number;
  images: string; // JSON string, matches ProductCardData shape
  variants: { id: string; color: string; size: string; stock: number; priceOverride?: number | null }[];
  category?: { name: string; slug: string };
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFlashSale?: boolean;
  isTrending?: boolean;
  viewedAt: number;
}

export function getRecentlyViewed(excludeId?: string): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const items: RecentlyViewedItem[] = raw ? JSON.parse(raw) : [];
    return items.filter((i) => i.id !== excludeId).sort((a, b) => b.viewedAt - a.viewedAt);
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(item: Omit<RecentlyViewedItem, "viewedAt">) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const items: RecentlyViewedItem[] = raw ? JSON.parse(raw) : [];
    const withoutCurrent = items.filter((i) => i.id !== item.id);
    const updated = [{ ...item, viewedAt: Date.now() }, ...withoutCurrent].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (private browsing, etc.) — silently skip, non-critical feature
  }
}
