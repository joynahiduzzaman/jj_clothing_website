import { prisma } from "@/server/db";
import TaxonomyManager from "@/components/admin/TaxonomyManager";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const collections = await prisma.collection.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <TaxonomyManager
      kind="collections"
      rows={collections.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        // The manager shows one image; for a collection that is its logo.
        image: c.logo,
        // Collection.story is the existing description column — no schema change needed.
        description: c.story,
        productCount: c._count.products,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
