"use client";

import { fetchWithSession } from "@/lib/admin/session-fetch";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import ProductForm, { EMPTY_PRODUCT_FORM, ProductFormValues } from "@/components/admin/ProductForm";
import { parseJsonArray } from "@/lib/utils";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [initialValues, setInitialValues] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);

  useEffect(() => {
    fetch(`/api/admin/products/${productId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.product) {
          toast.error("Product not found");
          router.push("/admin/products");
          return;
        }
        const p = d.product;
        setInitialValues({
          name: p.name,
          slug: p.slug,
          banglaName: p.banglaName || "",
          collectionId: p.collectionId || "",
          categoryId: p.categoryId,
          description: p.description,
          material: p.material || "",
          fit: p.fit || "",
          careInstructions: p.careInstructions || "",
          gender: p.gender || "UNISEX",
          modelInfo: p.modelInfo || "",
          price: String(p.price),
          costPrice: p.costPrice != null ? String(p.costPrice) : "",
          discountPercent: String(p.discountPercent),
          images: parseJsonArray(p.images),
          status: p.status,
          weightGrams: p.weightGrams != null ? String(p.weightGrams) : "",
          metaTitle: p.metaTitle || "",
          metaDescription: p.metaDescription || "",
          isFeatured: p.isFeatured,
          isBestSeller: p.isBestSeller,
          isNewArrival: p.isNewArrival,
          isFlashSale: p.isFlashSale,
          isTrending: p.isTrending,
          variants: (p.variants || []).map((v: any) => ({
            id: v.id,
            color: v.color,
            size: v.size,
            sku: v.sku || "",
            stock: String(v.stock),
            priceOverride: v.priceOverride != null ? String(v.priceOverride) : "",
          })),
        });
      })
      .catch(() => toast.error("Failed to load product"))
      .finally(() => setFetching(false));
  }, [productId, router]);

  async function handleSubmit(form: ProductFormValues) {
    setLoading(true);
    try {
      const res = await fetchWithSession(`/api/admin/products/${productId}`, {
        method: "PATCH",
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
            id: v.id,
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
      toast.success("Product updated");
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return <div className="max-w-2xl text-sm text-ink/70">Loading product…</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold mb-8">Edit Product</h1>
      <ProductForm initialValues={initialValues} submitLabel="Save Changes" loading={loading} onSubmit={handleSubmit} />
    </div>
  );
}
