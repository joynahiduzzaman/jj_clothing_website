import { prisma } from "./db";
import { SECTION_DEFINITIONS } from "@/lib/homepage-sections";
import { isSectionLive } from "@/lib/homepage-visibility";

/**
 * Returns every HomepageSection row, sorted by displayOrder. If the table is
 * empty — a fresh install, or an existing site that hasn't run this migration's
 * seed step — it auto-populates one row per entry in SECTION_DEFINITIONS, in
 * their defined order, so the homepage renders identically to how it always did
 * before the Homepage Builder existed. This is the actual safety net (not just
 * the seed script) since existing installations won't necessarily re-seed.
 */
/** In-memory rows built straight from SECTION_DEFINITIONS — used when the
 *  database can't be reached at all, so a transient connection blip degrades
 *  to the shipped default homepage instead of crashing every page render. */
function fallbackSections() {
  const now = new Date();
  return SECTION_DEFINITIONS.map((def, i) => ({
    id: `fallback-${def.key}`,
    sectionKey: def.key,
    title: def.label,
    settings: JSON.stringify(def.defaultSettings),
    displayOrder: i,
    enabled: true,
    status: "PUBLISHED",
    publishAt: null,
    unpublishAt: null,
    isCustom: false,
    createdAt: now,
    updatedAt: now,
  }));
}

export async function getAllHomepageSections() {
  let existing;
  try {
    existing = await prisma.homepageSection.findMany({ orderBy: { displayOrder: "asc" } });
  } catch {
    return fallbackSections();
  }
  if (existing.length > 0) return existing;

  try {
    await prisma.homepageSection.createMany({
      data: SECTION_DEFINITIONS.map((def, i) => ({
        sectionKey: def.key,
        title: def.label,
        settings: JSON.stringify(def.defaultSettings),
        displayOrder: i,
        enabled: true,
      })),
    });
    return await prisma.homepageSection.findMany({ orderBy: { displayOrder: "asc" } });
  } catch {
    return fallbackSections();
  }
}

/** Same as above, but only the sections actually visible right now — enabled,
 * published (not draft), and within their publish/unpublish window if scheduled.
 * This is what the live homepage renders. */
export async function getEnabledHomepageSections() {
  const all = await getAllHomepageSections();
  return all.filter((s) => isSectionLive(s));
}
