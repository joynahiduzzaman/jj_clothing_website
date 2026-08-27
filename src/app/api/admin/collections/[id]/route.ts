import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { toSlug, uniqueSlug } from "@/server/taxonomy";
import { z } from "zod";
import { deleteImageByUrl } from "@/server/uploads/cloudinary";
import { revalidateCatalogue } from "@/server/catalogue-cache";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "MANAGER"].includes(user.role)) return null;
  return user;
}

const updateSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  slug: z.string().trim().max(80).optional(),
  logo: z.string().nullable().optional(),
  banner: z.string().nullable().optional(),
  story: z.string().max(600).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const existing = await prisma.collection.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Collection not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.logo !== undefined) data.logo = parsed.data.logo || null;

  // Replacing or clearing the logo leaves the previous Cloudinary asset
  // orphaned — still billed for, no longer referenced by anything. Capture the
  // old URL now, and delete it only once the update has actually succeeded.
  const previousImage =
    parsed.data.logo !== undefined && existing.logo !== (parsed.data.logo || null)
      ? existing.logo
      : null;

  if (parsed.data.banner !== undefined) data.banner = parsed.data.banner || null;
  if (parsed.data.story !== undefined) data.story = parsed.data.story || null;
  // Renaming does not silently move the public URL — the slug only changes when
  // it is edited directly, so existing links and any SEO on them survive.
  if (parsed.data.slug !== undefined) {
    data.slug = await uniqueSlug("collection", toSlug(parsed.data.slug), params.id);
  }

  const collection = await prisma.collection.update({ where: { id: params.id }, data });
  if (previousImage) await deleteImageByUrl(previousImage);
  revalidateCatalogue();
  return NextResponse.json({ collection });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const existing = await prisma.collection.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Collection not found" }, { status: 404 });

  // Unlike Category, Product.collectionId is optional — deleting a collection
  // simply clears it from any products (Prisma's default SetNull for an
  // optional relation), so there's no "still in use" block to check first.
  await deleteImageByUrl(existing.logo);
  await prisma.collection.delete({ where: { id: params.id } });
  revalidateCatalogue();
  return NextResponse.json({ ok: true });
}
