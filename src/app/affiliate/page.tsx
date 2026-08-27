// Affiliate Program is temporarily disabled — see _disabled/original-page.tsx for
// the full landing page this replaces, kept intact for a future re-enable.
import { Users } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";
import { brand } from "@/config/brand";

export const metadata = { title: "Affiliate Program" };

export default function AffiliatePage() {
  return (
    <ComingSoon
      icon={Users}
      eyebrow="Coming Soon"
      title="Our Affiliate Program is currently under development."
      body={`We're building something worth sharing. Check back soon to learn more about how you'll be able to partner with ${brand.name}.`}
      ctaLabel="Continue Shopping"
      ctaHref="/shop"
    />
  );
}
