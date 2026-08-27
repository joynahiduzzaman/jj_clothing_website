"use client";

import { useState } from "react";
import { X, Ruler } from "lucide-react";

interface SizeGuideRow {
  label: string;
  [measurement: string]: string;
}

/** `Category.sizeGuide` is a JSON string: `{ rows: [{ label, chest, length, shoulder, ... }] }`
 *  — column names vary by garment type, so they're read from whatever the first
 *  row actually has rather than a fixed list. */
function parseSizeGuide(json: string): { columns: string[]; rows: SizeGuideRow[] } {
  try {
    const parsed = JSON.parse(json);
    const rows: SizeGuideRow[] = Array.isArray(parsed?.rows) ? parsed.rows : [];
    const columns = rows.length > 0 ? Object.keys(rows[0]).filter((k) => k !== "label") : [];
    return { columns, rows };
  } catch {
    return { columns: [], rows: [] };
  }
}

export default function SizeGuideModal({ sizeGuideJson }: { sizeGuideJson: string }) {
  const [open, setOpen] = useState(false);
  const { columns, rows } = parseSizeGuide(sizeGuideJson);

  if (rows.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-gold-text hover:underline"
      >
        <Ruler size={13} aria-hidden="true" />
        Size Guide
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Size guide">
          <button
            type="button"
            aria-label="Close size guide"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/45 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-e4 sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
              <h2 className="font-display text-lg">Size Guide</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-beige hover:text-ink"
              >
                <X size={17} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-5">
              <table className="w-full min-w-[320px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border-soft text-left">
                    <th className="py-2 pr-3 font-semibold text-ink">Size</th>
                    {columns.map((col) => (
                      <th key={col} className="py-2 pr-3 font-semibold capitalize text-ink">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label} className="border-b border-border-soft/60">
                      <td className="py-2 pr-3 font-semibold text-ink">{row.label}</td>
                      {columns.map((col) => (
                        <td key={col} className="py-2 pr-3 text-ink/70">{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-[11px] text-ink/50">All measurements in inches unless noted.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
