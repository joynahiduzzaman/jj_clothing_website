import Link from "next/link";
import { prisma } from "@/server/db";
import { getReservedQuantitiesByVariant } from "@/server/inventory";
import StockAdjustButton from "@/components/admin/StockAdjustButton";
import { AlertTriangle, PackageX, PackageCheck, Search } from "lucide-react";

export const dynamic = "force-dynamic";

interface VariantRow {
  variantId: string;
  productId: string;
  productName: string;
  color: string;
  size: string;
  stock: number;
}

export default async function InventoryPage({ searchParams }: { searchParams: { q?: string; filter?: string } }) {
  const q = searchParams.q?.trim() || "";
  const filter = searchParams.filter || "all";

  const products = await prisma.product.findMany({
    where: q ? { name: { contains: q } } : {},
    include: { variants: { orderBy: { position: "asc" } } },
    orderBy: { name: "asc" },
  });

  let rows: VariantRow[] = products.flatMap((p) =>
    p.variants.map((v) => ({ variantId: v.id, productId: p.id, productName: p.name, color: v.color, size: v.size, stock: v.stock }))
  );

  const lowStockCount = rows.filter((r) => r.stock > 0 && r.stock < 10).length;
  const outOfStockCount = rows.filter((r) => r.stock === 0).length;

  if (filter === "low") rows = rows.filter((r) => r.stock > 0 && r.stock < 10);
  if (filter === "out") rows = rows.filter((r) => r.stock === 0);
  rows.sort((a, b) => a.stock - b.stock);

  const reserved = await getReservedQuantitiesByVariant(rows.map((r) => r.variantId));

  const recentHistory = await prisma.stockAdjustment.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    include: { product: { select: { name: true } }, variant: { select: { color: true, size: true } } },
  });

  const FILTERS = [
    { key: "all", label: "All Variants" },
    { key: "low", label: `Low Stock (${lowStockCount})` },
    { key: "out", label: `Out of Stock (${outOfStockCount})` },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-1">Inventory</h1>
      <p className="text-sm text-ink/70 mb-6">Current, reserved, and available stock across every color/size variant.</p>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search products…"
            className="w-full rounded-full border border-ink/10 pl-9 pr-4 py-2.5 text-sm"
          />
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        </form>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={`/admin/inventory?filter=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`text-xs rounded-full px-4 py-2.5 font-medium transition-colors whitespace-nowrap ${
                filter === f.key ? "bg-ink text-white" : "bg-white text-ink/70 hover:bg-beige/60"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl2 shadow-soft overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink/70 border-b border-ink/10">
              <th className="p-4">Product</th>
              <th className="p-4">Color / Size</th>
              <th className="p-4">Current Stock</th>
              <th className="p-4">Reserved</th>
              <th className="p-4">Available</th>
              <th className="p-4">Status</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const reservedQty = reserved.get(r.variantId) || 0;
              const available = r.stock;
              const current = available + reservedQty;
              return (
                <tr key={r.variantId} className="border-b border-ink/5">
                  <td className="p-4 font-medium max-w-[220px] truncate">{r.productName}</td>
                  <td className="p-4 text-ink/70">{r.color} / {r.size}</td>
                  <td className="p-4">{current}</td>
                  <td className="p-4 text-ink/70">{reservedQty > 0 ? reservedQty : "—"}</td>
                  <td className="p-4 font-medium">{available}</td>
                  <td className="p-4"><StockBadge stock={r.stock} /></td>
                  <td className="p-4"><StockAdjustButton variantId={r.variantId} productName={`${r.productName} — ${r.color} / ${r.size}`} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-10 text-center text-sm text-ink/70">
            {q ? `No products match "${q}".` : "No variants in this view."}
          </p>
        )}
      </div>

      {/* Stock history log */}
      <div className="bg-white rounded-xl2 shadow-soft p-6">
        <h2 className="font-display text-xl mb-1">Recent Stock Activity</h2>
        <p className="text-xs text-ink/70 mb-5">Every stock change, manual or automatic, most recent first.</p>
        {recentHistory.length === 0 ? (
          <p className="text-sm text-ink/70 text-center py-6">No stock changes recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {recentHistory.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-4 border-b border-ink/5 pb-3 last:border-0 last:pb-0 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {h.product.name}
                    {h.variant && <span className="text-ink/50 font-normal"> — {h.variant.color} / {h.variant.size}</span>}
                  </p>
                  <p className="text-xs text-ink/70 truncate">{h.reason}{h.adjustedBy ? ` · by ${h.adjustedBy}` : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-medium ${h.change > 0 ? "text-success" : "text-badge-sale"}`}>
                    {h.change > 0 ? "+" : ""}{h.change}
                  </p>
                  <p className="text-[11px] text-ink/35">{new Date(h.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="flex items-center gap-1 w-fit text-xs bg-badge-sale/10 text-badge-sale rounded-full px-2.5 py-1 font-medium"><PackageX size={11} /> Out of Stock</span>;
  if (stock < 10) return <span className="flex items-center gap-1 w-fit text-xs bg-gold/15 text-gold rounded-full px-2.5 py-1 font-medium"><AlertTriangle size={11} /> Low Stock</span>;
  return <span className="flex items-center gap-1 w-fit text-xs bg-success/10 text-success rounded-full px-2.5 py-1 font-medium"><PackageCheck size={11} /> In Stock</span>;
}
