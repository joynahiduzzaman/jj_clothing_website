const COMMON_FAQS = [
  {
    q: "Is Cash on Delivery available for this product?",
    a: "Yes — Cash on Delivery is available nationwide. bKash and Nagad are launching soon for customers who'd rather pay online.",
  },
  {
    q: "How long will delivery take?",
    a: "Inside Dhaka: 1–3 business days. Outside Dhaka: 2–5 business days via our courier partners.",
  },
  {
    q: "What if the size doesn't fit?",
    a: "Check the Size Guide on this page before ordering. If it still doesn't fit, unworn items with tags attached can be exchanged or returned within 7 days of delivery.",
  },
  {
    q: "Can I return this if I change my mind?",
    a: "Unworn products with tags attached can be returned within 7 days of delivery. See our Refund Policy for full details.",
  },
];

export default function ProductFaq() {
  return (
    <section className="mt-16 max-w-2xl">
      <h2 className="font-display text-2xl mb-6">Product FAQ</h2>
      <div className="space-y-3">
        {COMMON_FAQS.map((f) => (
          <details key={f.q} className="border-b border-ink/10 pb-4">
            <summary className="font-medium cursor-pointer text-sm">{f.q}</summary>
            <p className="text-sm text-ink/70 mt-2">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
