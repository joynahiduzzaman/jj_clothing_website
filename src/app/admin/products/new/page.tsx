"use client";

import { fetchWithSession } from "@/lib/admin/session-fetch";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ProductForm, { EMPTY_PRODUCT_FORM, ProductFormValues, clearProductDraft } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(form: ProductFormValues) {
    setLoading(true);
    try {
      const res = await fetchWithSession("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || undefined,
          banglaName: form.banglaName || null,
          collectionId: form.collectionId || null,
          categoryId: form.categoryId,
          description: form.description,
          material: form.material || null,
          fit: form.fit || null,
          careInstructions: form.careInstructions || null,
          gender: form.gender,
          modelInfo: form.modelInfo || null,
          price: Number(form.price),
          costPrice: form.costPrice ? Number(form.costPrice) : null,
          discountPercent: Number(form.discountPercent),
          images: form.images,
          status: form.status,
          weightGrams: form.weightGrams ? Math.round(Number(form.weightGrams)) : null,
          metaTitle: form.metaTitle || undefined,
          metaDescription: form.metaDescription || undefined,
          isFeatured: form.isFeatured,
          isBestSeller: form.isBestSeller,
          isNewArrival: form.isNewArrival,
          isFlashSale: form.isFlashSale,
          isTrending: form.isTrending,
          variants: form.variants.map((v) => ({
            color: v.color,
            size: v.size,
            sku: v.sku || undefined,
            stock: Number(v.stock) || 0,
            priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // The product is safely in the database now, so the local copy is no
      // longer a safety net — leaving it would offer to restore it next time.
      clearProductDraft();
      toast.success("Product created");
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold mb-8">Add New Product</h1>
      <ProductForm initialValues={EMPTY_PRODUCT_FORM} submitLabel="Create Product" loading={loading} onSubmit={handleSubmit} draftKeyEnabled />
    </div>
  );
}
