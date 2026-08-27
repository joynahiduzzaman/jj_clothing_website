import { Truck, CreditCard, RotateCcw, Ruler, UserCircle, type LucideIcon } from "lucide-react";

export interface FaqCategory {
  slug: string;
  label: string;
  icon: LucideIcon;
}

export interface FaqEntry {
  category: string; // matches FaqCategory.slug
  q: string;
  a: string;
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  { slug: "orders-shipping", label: "Orders & Shipping", icon: Truck },
  { slug: "payments", label: "Payments", icon: CreditCard },
  { slug: "returns", label: "Returns & Refunds", icon: RotateCcw },
  { slug: "sizing", label: "Sizing & Fit", icon: Ruler },
  { slug: "account", label: "Account & Support", icon: UserCircle },
];

export const FAQ_ENTRIES: FaqEntry[] = [
  { category: "orders-shipping", q: "How long does delivery take?", a: "Inside Dhaka: 1–3 business days. Outside Dhaka: 2–5 business days via our courier partners." },
  { category: "orders-shipping", q: "How much does shipping cost?", a: "৳70 flat rate inside Dhaka, ৳130 outside Dhaka — the same rate applies regardless of order size." },
  { category: "orders-shipping", q: "Can I track my order?", a: "Yes — once your order ships, you'll receive tracking details via SMS or email. You can also check status anytime from Track Order, no account needed, or from My Account → My Orders if you're signed in." },
  { category: "orders-shipping", q: "Do you ship outside Bangladesh?", a: "Not currently — we only deliver within Bangladesh." },
  { category: "orders-shipping", q: "Can I change my delivery address after ordering?", a: "If your order hasn't shipped yet, contact us via WhatsApp with your order number and we'll update it for you." },

  { category: "payments", q: "What payment methods do you accept?", a: "Cash on Delivery is available nationwide today. bKash and Nagad are launching soon for customers who'd rather pay online." },
  { category: "payments", q: "Is Cash on Delivery available everywhere?", a: "Yes, COD is available across Bangladesh, both inside and outside Dhaka." },
  { category: "payments", q: "When will bKash and Nagad be available?", a: "We're finishing integration with both gateways now — they'll appear as options at checkout as soon as they're live. Cash on Delivery works today with no waiting." },
  { category: "payments", q: "Can I use a coupon code at checkout?", a: "Yes — enter it at checkout, or check My Account → Coupons for codes already available to you." },

  { category: "returns", q: "Can I return a product?", a: "Yes, unworn products with tags attached can be returned within 7 days of delivery for a full refund." },
  { category: "returns", q: "Can I return a worn item?", a: "Items without their original tags, or that show signs of wear, can't be returned unless the item arrived damaged or defective — in that case, contact us immediately with photos." },
  { category: "returns", q: "How do I start a return?", a: "Contact us via WhatsApp or email with your order number, or open a support ticket from My Account → Support Tickets." },
  { category: "returns", q: "How long does a refund take?", a: "Refunds are processed to your original payment method within 5–7 business days of approval." },

  { category: "sizing", q: "How do I know what size to order?", a: "Every product page has a Size Guide with actual garment measurements — chest, length and shoulder for tops, waist and inseam for bottoms — plus the fit type (slim, regular, relaxed, oversized)." },
  { category: "sizing", q: "What if the size I want is out of stock?", a: "Add it to your wishlist and check back — we restock popular sizes regularly." },
  { category: "sizing", q: "Can I exchange for a different size?", a: "Yes — contact us within 7 days of delivery to arrange an exchange, as long as the item is unworn with tags attached." },
  { category: "sizing", q: "Are your sizes true to size?", a: "Each product page notes the fit (e.g. Regular, Relaxed, Oversized) so you know what to expect beyond the raw measurements." },

  { category: "account", q: "Do I need an account to order?", a: "No — you can check out as a guest and use Track Order anytime afterward with your order number and phone number. Creating an account just lets you save addresses and access your order history, coupons, and wishlist in one place." },
  { category: "account", q: "Do you offer support in Bangla?", a: "Yes — WhatsApp, Messenger, and phone support are available in both Bangla and English." },
  { category: "account", q: "I forgot my password — what do I do?", a: "Use the \"Forgot password?\" link on the login page to reset it via email." },
  { category: "account", q: "Do you have a referral or affiliate program?", a: "Not yet — it's currently in development. Check back soon for details." },
];
