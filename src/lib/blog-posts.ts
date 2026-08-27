// The articles the site shipped with, plus the pure helpers the blog pages use.
//
// These are no longer the live list: articles are editable content now, stored
// as rows on the `blog` PageContent record and edited at /admin/content/blog —
// photo upload included. This array is the default that record merges over, so
// a shop that has never touched the journal still renders exactly these three.
// Read the live list with getBlogPosts() (src/server/blog.ts), never from here.
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  category: string;
  date: string; // ISO date
  content: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-care-for-your-cotton-basics",
    title: "How to Care for Your Cotton Basics",
    excerpt: "A practical guide to washing, drying and storing cotton pieces so they last longer in Dhaka's climate.",
    image: "https://placehold.co/1200x800/EBE5DC/1C1B19/png?text=Cotton+Care+Guide",
    author: "Editorial Team",
    category: "Care Guides",
    date: "2026-06-02",
    content: [
      "Cotton is forgiving, but a few habits make the difference between a t-shirt that looks new after twenty washes and one that's faded and misshapen after five.",
      "Wash cold and inside-out. Cold water keeps colors from bleeding and fading, and turning a piece inside-out protects any print or embroidery from friction against zippers and buttons in the wash.",
      "In Dhaka's humidity, air-drying indoors under a fan is often more reliable than line-drying outside, where dust and pollution can settle into damp fabric. Avoid direct, prolonged sun exposure while drying — it's the fastest way to fade dark colors.",
      "Skip the tumble dryer where you can. Heat is what shrinks cotton and breaks down elastane in ribbed or fitted pieces. If you must use one, a low, short cycle is far gentler than a full high-heat run.",
    ],
  },
  {
    slug: "choosing-the-right-fit-a-sizing-guide",
    title: "Choosing the Right Fit: A Sizing Guide",
    excerpt: "Relaxed, oversized, slim — what these fit names actually mean, and how to pick between them.",
    image: "https://placehold.co/1200x800/EBE5DC/1C1B19/png?text=Sizing+Guide",
    author: "Editorial Team",
    category: "Style Guides",
    date: "2026-05-18",
    content: [
      "Fit names get used loosely across brands, which makes online sizing feel like guesswork. Here's what they actually describe on our pieces.",
      "\"Slim Fit\" sits close to the body through the chest and sleeve. \"Regular Fit\" has a little more room to move without looking baggy. \"Relaxed\" and \"Oversized\" are intentionally roomier — built to be worn a size down from your usual if you want a closer silhouette, or true to size for the full drape.",
      "When in doubt, check the size guide on the product page — it lists actual garment measurements (chest, length, shoulder for tops; waist, inseam for bottoms), which is a more reliable comparison than size labels alone.",
      "If you're between two sizes, the fit description matters more than the number. A relaxed-fit piece in your usual size will already have room to spare — sizing up on top of that usually means the fit runs looser than intended.",
    ],
  },
  {
    slug: "building-a-capsule-wardrobe-for-dhakas-climate",
    title: "Building a Capsule Wardrobe for Dhaka's Climate",
    excerpt: "A short list of pieces that mix and match easily through humid days and cooler evenings.",
    image: "https://placehold.co/1200x800/EBE5DC/1C1B19/png?text=Capsule+Wardrobe",
    author: "Editorial Team",
    category: "Style Guides",
    date: "2026-04-27",
    content: [
      "A capsule wardrobe isn't about owning less for its own sake — it's about owning fewer pieces that actually go together, so getting dressed is fast and everything gets worn.",
      "Start with two or three neutral t-shirts (black, white, sand) and one relaxed-fit shirt you can layer over them. These three alone cover most warm-weather days and pair with almost any bottom.",
      "For bottoms, one relaxed jean and one pair of wide-leg trousers cover both casual and slightly dressed-up occasions without needing a third option.",
      "Add one layer for cooler evenings and air-conditioned spaces — a lightweight hoodie or a utility jacket both work, and either one instantly extends what the rest of the capsule can do.",
    ],
  },
];

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getCategories(posts: BlogPost[]) {
  return Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));
}

/** ~200 words/minute, rounded up to a whole minute, minimum 1. */
export function getReadingTime(post: BlogPost) {
  const words = post.content.join(" ").trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getRelatedPosts(posts: BlogPost[], post: BlogPost, limit = 3) {
  const sameCategory = posts.filter((p) => p.slug !== post.slug && p.category === post.category);
  const rest = posts.filter((p) => p.slug !== post.slug && p.category !== post.category);
  return [...sameCategory, ...rest].slice(0, limit);
}

// ---------------------------------------------------------------------------
// Content-row <-> BlogPost
// ---------------------------------------------------------------------------

/** A placeholder is used rather than dropping the article: an admin who adds an
 *  article and saves before uploading its photo should see the article, not
 *  have it silently vanish from /blog. */
const PLACEHOLDER_IMAGE = "https://placehold.co/1200x800/EBE5DC/1C1B19/png?text=Journal";

export function slugifyTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Serialise a shipped post into the row shape the content editor stores. */
export function postToRow(post: BlogPost): Record<string, string> {
  return {
    title: post.title,
    slug: post.slug,
    image: post.image,
    excerpt: post.excerpt,
    category: post.category,
    author: post.author,
    date: post.date,
    body: post.content.join("\n\n"),
  };
}

/**
 * Turn saved editor rows into renderable articles, newest first.
 *
 * Everything here is defensive because these rows are hand-typed in an admin
 * form: an untitled row is dropped, a missing slug is generated from the title,
 * a duplicate slug is suffixed (two articles sharing one URL would make the
 * second unreachable), and a blank date sorts last rather than as an invalid
 * Date. Paragraphs are split on blank lines, which is how the field's hint
 * tells the admin to write them.
 */
export function rowsToPosts(rows: Array<Record<string, string>>): BlogPost[] {
  const seen = new Set<string>();
  const posts: BlogPost[] = [];

  for (const row of rows) {
    const title = (row.title || "").trim();
    if (!title) continue;

    let slug = slugifyTitle(row.slug || title);
    if (!slug) continue;
    if (seen.has(slug)) {
      let n = 2;
      while (seen.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }
    seen.add(slug);

    posts.push({
      slug,
      title,
      excerpt: (row.excerpt || "").trim(),
      image: (row.image || "").trim() || PLACEHOLDER_IMAGE,
      author: (row.author || "").trim() || "Editorial Team",
      category: (row.category || "").trim() || "Journal",
      date: (row.date || "").trim(),
      content: (row.body || "")
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
    });
  }

  return posts.sort((a, b) => {
    const ta = Date.parse(a.date);
    const tb = Date.parse(b.date);
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return tb - ta;
  });
}

export function formatBlogDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
