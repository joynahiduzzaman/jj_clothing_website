import type { ContentValues } from "./site-content";
import { BLOG_POSTS, postToRow } from "./blog-posts";

// The copy each page shipped with. Kept in its own module (rather than inline in
// site-content.ts) purely for readability — the field *definitions* describe the
// editor, these describe the site as it looks before anybody edits anything.
//
// Every key here must match a field key in PAGE_DEFS, and every page must have a
// complete set: getPageContent() merges saved values over these, so a missing
// default would render as empty rather than falling back to something sensible.

export const PAGE_DEFAULTS: Record<string, ContentValues> = {
  about: {
    heroEyebrow: "Our Story",
    heroTitle: "Considered clothing, brought home to Bangladesh.",
    heroImage: "https://placehold.co/1600x900/EBE5DC/1C1B19/png?text=About+Us",

    storyEyebrow: "Who We Are",
    storyTitle: "A clothing brand built for everyday wear.",
    storyBody1:
      "We design and select clothing meant to be worn on repeat — considered basics and a few statement pieces, built to hold up wash after wash.",
    storyBody2:
      "Every piece is checked for fit, fabric and finish before it ships. Our goal is to make well-made, everyday clothing accessible and reliable, backed by real customer support.",
    storyBody3:
      "Whether you're building a capsule wardrobe, replacing a worn-out favorite, or just browsing, we're committed to helping you find pieces that actually get worn.",
    storyImage: "https://placehold.co/900x1125/EBE5DC/1C1B19/png?text=Our+Story",

    promises: [
      { text: "Quality Checked, Every Piece" },
      { text: "Considered Fabric & Fit" },
      { text: "Premium Customer Service" },
      { text: "Fast Nationwide Delivery" },
      { text: "Carefully Selected Collections" },
      { text: "Secure Shopping Experience" },
    ],

    whyEyebrow: "Our Approach",
    whyTitle: "What makes our clothing worth it.",
    whyItems: [
      {
        title: "Considered Materials",
        body: "We pick fabrics for how they wear over time, not just how they photograph — cotton, linen and blends chosen for comfort in Bangladesh's climate.",
      },
      {
        title: "Fit Discipline",
        body: "Every fit — slim, regular, relaxed, oversized — is deliberate, with real garment measurements published on every product page, not just a size label.",
      },
      {
        title: "Everyday, Not Occasion-Only",
        body: "Clothing meant for daily wear rather than a single outing — the philosophy we try to bring into every order that leaves our warehouse.",
      },
    ],

    missionQuote:
      "Help Bangladeshi wardrobes get clothing that actually lasts — with fast delivery, real customer support, and prices that make sense for our market.",
    missionAttribution: "— The team",

    processEyebrow: "Our Process",
    processTitle: "From design to your doorstep.",
    processSteps: [
      { title: "Considered Design", body: "Every piece is designed or selected with fit, fabric and everyday wear in mind." },
      { title: "Quality Check", body: "Every unit is checked for fit, fabric and finish before it's listed for sale." },
      { title: "Careful Packing", body: "Packed to arrive exactly as shown, with full documentation kept on file." },
      { title: "Fast BD Delivery", body: "1–3 business days inside Dhaka, 2–5 business days nationwide, with Cash on Delivery available everywhere." },
    ],

    stats: [
      { value: "100%", label: "Quality Checked" },
      { value: "3", label: "Collections" },
      { value: "24/7", label: "Customer Support" },
      { value: "7-Day", label: "Easy Returns" },
    ],

    ctaTitle: "Ready to refresh your wardrobe?",
    ctaBody: "Shop considered clothing, made to last — delivered across Bangladesh.",
    ctaButton: "Shop the Collection",
  },

  contact: {
    eyebrow: "Get in Touch",
    title: "We're happy to help.",
    intro: "Questions about a product, an order, or sizing advice? Reach us however's easiest for you.",

    formTitle: "Send us a message",
    formNote: "Fields marked are required — we'll reply to the email you provide.",

    faqEyebrow: "Before You Write In",
    faqTitle: "Quick answers",
    faqs: [
      {
        q: "How fast will I get a reply?",
        a: "We're online 24/7, so most messages get a reply within a few hours — WhatsApp is usually the fastest channel.",
      },
      {
        q: "I have a question about an existing order — where do I go?",
        a: "For order-specific questions, opening a support ticket from My Account → Support Tickets gets you a faster, order-linked reply than the general contact form. You can also use Track Order to check status without an account.",
      },
      {
        q: "Do you offer support in Bangla?",
        a: "Yes — WhatsApp, Messenger, and phone support are available in both Bangla and English.",
      },
    ],
  },

  faq: {
    eyebrow: "Help Center",
    title: "Frequently Asked Questions",
    intro: "Search, or browse by category — orders, payments, returns, sizing, and account questions all in one place.",
    ctaTitle: "Still can't find what you're looking for?",
    ctaBody: "We're online 24/7 — our team usually replies within a few hours.",
    entries: [
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
      { category: "account", q: "I forgot my password — what do I do?", a: 'Use the "Forgot password?" link on the login page to reset it via email.' },
      { category: "account", q: "Do you have a referral or affiliate program?", a: "Not yet — it's currently in development. Check back soon for details." },
    ],
  },

  "shipping-policy": {
    eyebrow: "Delivery Information",
    title: "Shipping Policy",
    intro: "Straightforward rates, realistic timelines, and Cash on Delivery everywhere in Bangladesh.",
    zones: [
      { zone: "Inside Dhaka", fee: "৳70 flat", time: "1–3 business days", note: "Fast local delivery" },
      { zone: "Outside Dhaka", fee: "৳130 flat", time: "2–5 business days", note: "Via courier partners" },
    ],
    codTitle: "Cash on Delivery, everywhere",
    codBody1:
      "Don't want to pay online? Choose Cash on Delivery at checkout and pay our courier in cash when your order arrives — available in every delivery zone, no minimum order required.",
    codBody2: "Prefer to pay ahead? bKash and Nagad are launching soon.",
    stepsEyebrow: "What to Expect",
    stepsTitle: "From confirmation to your door.",
    steps: [
      { title: "Order Confirmed", body: "Your order is verified and handed to our warehouse team." },
      { title: "Out for Delivery", body: "Handed to our courier partner and on its way to your address." },
      { title: "Tracking Sent", body: "You'll get tracking details via SMS or email as soon as it ships." },
      { title: "Delivered", body: "Pay on delivery if you chose COD, or it's already settled if paid online." },
    ],
  },

  "refund-policy": {
    eyebrow: "Returns Made Simple",
    title: "Refund Policy",
    intro: "Unworn products with tags attached can be returned within 7 days of delivery for a full refund.",
    conditions: [
      { title: "Unworn, Tags Attached", body: "The original tags must still be on — this is what lets us resell the item as new to the next customer too." },
      { title: "Within 7 Days", body: "Counted from the date your order was delivered, not the date you ordered it." },
      { title: "Original Packaging", body: "Any bag, box, or inserts included, the way it arrived to you." },
      { title: "Damaged or Defective? Different Rule", body: "If the item itself arrived damaged or wrong, the tag/packaging conditions above don't apply — just contact us." },
    ],
    stepsEyebrow: "How It Works",
    stepsTitle: "Four steps, start to refund.",
    steps: [
      { title: "Contact Us", body: "WhatsApp, email, or a support ticket — include your order number and, for damage, a photo." },
      { title: "We Review", body: "We're open 24/7, so it's usually within a few hours." },
      { title: "Return Approved", body: "We'll confirm and, if needed, arrange pickup or a drop-off point." },
      { title: "Refund Issued", body: "Processed to your original payment method within 5–7 business days." },
    ],
    examplesEyebrow: "In Plain Terms",
    examplesTitle: "A few real examples.",
    examples: [
      { eligible: "yes", scenario: "The item arrived damaged or with a defect.", note: "Damaged-on-arrival — contact us with a photo and your order number." },
      { eligible: "yes", scenario: "You received the wrong product or size entirely.", note: "Our mistake — we'll send the correct item or refund in full." },
      { eligible: "no", scenario: "You wore the item and decided you didn't like the fit.", note: "Not eligible once worn or tags are removed — unless the product itself was defective." },
      { eligible: "no", scenario: "You changed your mind after 10 days.", note: "Outside the 7-day window from delivery." },
    ],
  },

  terms: {
    eyebrow: "Legal",
    title: "Terms & Conditions",
    intro: "Please read these terms carefully before using this site.",
    sections: [
      { title: "1. Acceptance of Terms", body: "By accessing or using this site, you agree to these Terms & Conditions in full. If you don't agree with any part of them, please don't use the site." },
      { title: "2. Accounts & Eligibility", body: "You can check out as a guest or create an account — either way, you're responsible for providing accurate order and shipping information. If you do create an account, you're responsible for keeping your login details secure and for all activity under it." },
      { title: "3. Orders & Pricing", body: "Product prices and availability are subject to change without notice. Placing an order is an offer to buy — we confirm it once payment (or Cash on Delivery selection) is verified. We reserve the right to cancel an order in cases of pricing errors, suspected fraud, or stock unavailability, and will refund any payment already made in that case." },
      { title: "4. Payments", body: "We currently accept Cash on Delivery nationwide. bKash and Nagad are launching soon as additional payment options. All prices are listed in Bangladeshi Taka (BDT)." },
      { title: "5. Shipping & Delivery", body: "Delivery timelines and fees are outlined on our [Shipping Policy](/shipping-policy) page. Timelines are estimates, not guarantees — delays can occur due to courier conditions outside our control." },
      { title: "6. Returns & Refunds", body: "Returns and refunds are governed by our [Refund Policy](/refund-policy), which forms part of these Terms." },
      { title: "7. Product Information", body: "We make reasonable efforts to ensure product descriptions, images, material and sizing guidance are accurate, but colors may vary slightly by screen and fabric batches may vary slightly between production runs." },
      { title: "8. Intellectual Property", body: "All content, branding, and imagery on this site is our property, or used with permission, unless otherwise credited. You may not reproduce, resell, or repurpose it without written consent." },
      { title: "9. Prohibited Use", body: "You agree not to use the site for any unlawful purpose, to attempt unauthorized access to our systems, or to interfere with the site's normal operation." },
      { title: "10. Limitation of Liability", body: "We are not liable for indirect or consequential losses arising from use of the site, or delays outside our reasonable control." },
      { title: "11. Governing Law", body: "These Terms are governed by the laws of Bangladesh, and any disputes fall under Bangladeshi jurisdiction." },
      { title: "12. Changes to These Terms", body: "We may update these Terms from time to time. Continued use of the site after changes are posted constitutes acceptance of the revised Terms." },
      { title: "13. Contact Us", body: "Questions about these Terms? Reach us through our [Contact page](/contact) — we're happy to clarify anything." },
    ],
  },

  "privacy-policy": {
    eyebrow: "Legal",
    title: "Privacy Policy",
    intro: "This explains how we collect, use, and protect your information.",
    sections: [
      { title: "1. Overview", body: 'We ("we", "us", "our") respect your privacy. This policy explains what information we collect when you use our website, why we collect it, and how it\'s protected.' },
      { title: "2. Information We Collect", body: "When you browse, create an account, or place an order — as a guest or a registered customer — we may collect: your name, phone number, email address, and delivery address; order and payment-method details (we never store full card numbers); account credentials, if you create an account; and basic technical data like device type, browser, and pages visited." },
      { title: "3. How We Use Your Information", body: "We use your information to process and deliver orders, communicate order updates via SMS, email, or WhatsApp, respond to support requests, prevent fraud, and improve our products and website experience. We do not sell your personal information to third parties." },
      { title: "4. Sharing Your Information", body: "We share the minimum information necessary with courier partners to deliver your order, and with payment providers (once bKash and Nagad go live) solely to process transactions. We may also disclose information if required by law or to protect our legal rights." },
      { title: "5. Cookies & Analytics", body: "We use cookies to keep you signed in, remember your cart, and understand how the site is used, which helps us improve it. You can disable cookies in your browser settings, though some features — like staying signed in or checkout — may not work correctly without them." },
      { title: "6. Data Security", body: "We use reasonable technical and organizational measures — including encrypted connections and access controls — to protect your information. No online system is 100% secure, but we work to keep your data safe and only retain it as long as needed for the purposes described here." },
      { title: "7. Your Rights & Choices", body: "You can review and update your account details anytime from My Account, or contact us to request access to, correction of, or deletion of your personal information, subject to any records we're legally required to keep (such as order history for tax or dispute purposes)." },
      { title: "8. Children's Privacy", body: "Our website is not directed at children, and we do not knowingly collect personal information from anyone under 18. If you believe a child has provided us with personal information, please contact us and we'll remove it." },
      { title: "9. Changes to This Policy", body: "We may update this Privacy Policy from time to time to reflect changes in our practices or for legal reasons. Continued use of the site after changes are posted constitutes acceptance of the revised policy." },
      { title: "10. Contact Us", body: "Questions about this Privacy Policy or how your data is handled? Reach us through our [Contact page](/contact) — we're happy to help." },
    ],
  },

  blog: {
    eyebrow: "Journal",
    title: "Stories, style guides, and care tips.",
    intro: "Practical style and care guidance, written for Bangladesh's climate — not translated marketing copy.",
    // Derived from the shipped articles rather than retyped, so the prose has
    // exactly one home. src/lib/blog-posts.ts is that home.
    posts: BLOG_POSTS.map(postToRow),
  },
};
