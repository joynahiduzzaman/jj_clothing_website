"use client";

import { useEffect } from "react";
import { recordRecentlyViewed } from "@/lib/recently-viewed";

interface Props {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPercent: number;
  images: string;
  variants: { id: string; color: string; size: string; stock: number; priceOverride?: number | null }[];
  category?: { name: string; slug: string };
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFlashSale?: boolean;
  isTrending?: boolean;
}

/** Silently logs this product view to localStorage for the "Recently Viewed" rail. */
export default function RecordRecentlyViewed(props: Props) {
  useEffect(() => {
    recordRecentlyViewed(props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id]);

  return null;
}
