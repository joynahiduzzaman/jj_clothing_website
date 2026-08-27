import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { checkRateLimit, getClientIp } from "@/server/rate-limit";

// Public, unauthenticated, and answers "is this exact code valid?" for
// whatever string is passed — without a rate limit, this endpoint alone lets
// anyone brute-force through unpublished/internal coupon codes at whatever
// speed a script can send requests. 20 tries/5 min is generous for a genuine
// shopper mistyping a code, tight enough to blunt real enumeration.
export async function GET(req: NextRequest) {
  const rl = checkRateLimit(`coupon-validate:${getClientIp(req)}`, 20, 5 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ valid: false, message: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.toUpperCase();
  const subtotal = Number(searchParams.get("subtotal") || 0);

  if (!code) return NextResponse.json({ valid: false, message: "Enter a coupon code" });

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) return NextResponse.json({ valid: false, message: "Invalid or expired coupon" });
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return NextResponse.json({ valid: false, message: "Coupon expired" });
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return NextResponse.json({ valid: false, message: "Coupon usage limit reached" });
  if (subtotal < coupon.minSpend) return NextResponse.json({ valid: false, message: `Minimum spend ${coupon.minSpend} BDT required` });

  const rawDiscount = coupon.type === "PERCENT" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  // Same cap as resolveCoupon() in src/server/orders.ts — a FIXED coupon
  // larger than the cart shouldn't preview a discount bigger than the
  // subtotal it's discounting.
  const discount = Math.min(rawDiscount, subtotal);
  return NextResponse.json({ valid: true, discount, code: coupon.code, type: coupon.type, value: coupon.value });
}
