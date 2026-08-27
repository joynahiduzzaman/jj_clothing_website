"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/lib/i18n/use-locale";
import { formatBDT } from "@/lib/utils";
import { ChevronUp } from "lucide-react";

interface Props {
  name: string;
  image: string;
  price: number;
  inStock: boolean;
}

/**
 * Appears once the main AddToCartPanel (marked with #main-add-to-cart in the page)
 * scrolls out of view, and hides again once it's back on screen — so the CTA is
 * always reachable without permanently shrinking the viewport.
 *
 * Unlike the skincare version this replaces, it doesn't add to cart directly:
 * a clothing purchase needs a color/size chosen first, and this bar has no
 * selector of its own. Clicking it scrolls back to the real selector instead
 * of guessing a variant on the shopper's behalf.
 */
export default function StickyAddToCart({ name, image, price, inStock }: Props) {
  const [visible, setVisible] = useState(false);
  const { dict } = useLocale();

  useEffect(() => {
    const target = document.getElementById("main-add-to-cart");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  function scrollToOptions() {
    document.getElementById("main-add-to-cart")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-border-soft shadow-glass safe-bottom"
        >
          <div className="container-px mx-auto py-3 flex items-center gap-4">
            <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-beige shrink-0 hidden sm:block">
              {image && <Image src={image} alt={name} fill sizes="44px" className="object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink line-clamp-1">{name}</p>
              <p className="text-sm font-semibold text-rose-gold-text">{formatBDT(price)}</p>
            </div>
            {!inStock ? (
              <span className="text-xs text-red-500 font-medium shrink-0">{dict.product.outOfStock}</span>
            ) : (
              // Same treatment as the in-page button so the two read as one
              // action; compact height because this bar sits over the content.
              <button onClick={scrollToOptions} className="btn-cart !h-11 shrink-0 !px-5 !text-xs sm:!px-6">
                <ChevronUp size={15} aria-hidden="true" />
                Choose Options
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
