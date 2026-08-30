import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

/** [label, email, password] for accounts whose password this run generated. */
const generatedCredentials: Array<[string, string, string]> = [];

// Size charts, one per category "family" — tops (chest/length/shoulder) vs
// bottoms (waist/inseam). Stored as Category.sizeGuide JSON, per-category so
// every product in that category shares the chart the size-guide modal reads.
const TOP_SIZE_GUIDE = JSON.stringify({
  rows: [
    { label: "S", chest: "38", length: "27", shoulder: "17" },
    { label: "M", chest: "40", length: "28", shoulder: "18" },
    { label: "L", chest: "42", length: "29", shoulder: "19" },
    { label: "XL", chest: "44", length: "30", shoulder: "20" },
    { label: "XXL", chest: "46", length: "31", shoulder: "21" },
  ],
});
const BOTTOM_SIZE_GUIDE = JSON.stringify({
  rows: [
    { label: "28", waist: "28", inseam: "30" },
    { label: "30", waist: "30", inseam: "30" },
    { label: "32", waist: "32", inseam: "31" },
    { label: "34", waist: "34", inseam: "31" },
    { label: "36", waist: "36", inseam: "32" },
  ],
});

const categories = [
  { name: "T-Shirts", slug: "t-shirts", sizeGuide: TOP_SIZE_GUIDE },
  { name: "Shirts", slug: "shirts", sizeGuide: TOP_SIZE_GUIDE },
  { name: "Polos", slug: "polos", sizeGuide: TOP_SIZE_GUIDE },
  { name: "Hoodies & Sweatshirts", slug: "hoodies-sweatshirts", sizeGuide: TOP_SIZE_GUIDE },
  { name: "Outerwear", slug: "outerwear", sizeGuide: TOP_SIZE_GUIDE },
  { name: "Jeans", slug: "jeans", sizeGuide: BOTTOM_SIZE_GUIDE },
  { name: "Trousers", slug: "trousers", sizeGuide: BOTTOM_SIZE_GUIDE },
  { name: "Accessories", slug: "accessories", sizeGuide: null },
];

// Formerly Brand rows — now seasonal/thematic Collections (see schema.prisma:
// Collection reuses the same shape a multi-brand catalogue would have used).
const collections = [
  { name: "The Everyday Edit", slug: "the-everyday-edit", story: "Considered basics built to be worn on repeat." },
  { name: "Summer Essentials", slug: "summer-essentials", story: "Lightweight pieces for warm-weather days." },
  { name: "Weekend Layers", slug: "weekend-layers", story: "Hoodies, jackets and knits for cooler days off." },
];

const SIZES_TOP = ["S", "M", "L", "XL"];
const SIZES_BOTTOM = ["28", "30", "32", "34"];

// Real (freely-licensed, Unsplash) clothing photography for demo purposes —
// every URL below was checked with a live HTTP request before being added
// here, so nothing resolves to a broken image. Swap for real product
// photography before going live (see the "Images" section of the admin
// product form). next.config.mjs already allowlists images.unsplash.com.
const unsplash = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const PRODUCT_IMAGES: Record<string, [string, string]> = {
  "Oversized Cotton T-Shirt": [unsplash("1618354691373-d851c5c3a990"), unsplash("1576566588028-4147f3842f27")],
  "Ribbed Basic Top": [unsplash("1521572163474-6864f9cf17ab"), unsplash("1489987707025-afc232f7ea0f")],
  "Graphic Print Tee": [unsplash("1576566588028-4147f3842f27"), unsplash("1618354691373-d851c5c3a990")],
  "Classic Oxford Shirt": [unsplash("1562157873-818bc0726f68"), unsplash("1489274495757-95c7c837b101")],
  "Linen Shirt": [unsplash("1489274495757-95c7c837b101"), unsplash("1562157873-818bc0726f68")],
  "Flannel Check Shirt": [unsplash("1489274495757-95c7c837b101"), unsplash("1562157873-818bc0726f68")],
  "Premium Polo": [unsplash("1591195853828-11db59a44f6b"), unsplash("1620799140408-edc6dcb6d633")],
  "Pique Polo Shirt": [unsplash("1620799140408-edc6dcb6d633"), unsplash("1591195853828-11db59a44f6b")],
  "Relaxed Fit Jeans": [unsplash("1594633312681-425c7b97ccd1"), unsplash("1541099649105-f69ad21f3246")],
  "Straight Leg Denim": [unsplash("1542272604-787c3835535d"), unsplash("1541840031508-326b77c9a17e")],
  "Wide Leg Trousers": [unsplash("1523381210434-271e8be1f52b"), unsplash("1517841905240-472988babdf9")],
  "Tailored Chino Trousers": [unsplash("1517841905240-472988babdf9"), unsplash("1523381210434-271e8be1f52b")],
  "Minimal Hoodie": [unsplash("1591047139829-d91aecb6caea"), unsplash("1556821840-3a63f95609a7")],
  "Oversized Sweatshirt": [unsplash("1556821840-3a63f95609a7"), unsplash("1591047139829-d91aecb6caea")],
  "Utility Jacket": [unsplash("1591343395082-e120087004b4"), unsplash("1544022613-e87ca75a784a")],
  "Denim Jacket": [unsplash("1544022613-e87ca75a784a"), unsplash("1551028719-00167b16eac5")],
  "Canvas Tote Bag": [unsplash("1591561954557-26941169b49e"), unsplash("1544441893-675973e31985")],
  "Knit Beanie": [unsplash("1523293182086-7651a899d37f"), unsplash("1544441893-675973e31985")],
};

const CATEGORY_IMAGES: Record<string, string> = {
  "t-shirts": unsplash("1618354691373-d851c5c3a990"),
  shirts: unsplash("1562157873-818bc0726f68"),
  polos: unsplash("1591195853828-11db59a44f6b"),
  "hoodies-sweatshirts": unsplash("1591047139829-d91aecb6caea"),
  outerwear: unsplash("1591343395082-e120087004b4"),
  jeans: unsplash("1594633312681-425c7b97ccd1"),
  trousers: unsplash("1523381210434-271e8be1f52b"),
  accessories: unsplash("1591561954557-26941169b49e"),
};

/** Fallback only — every seeded product/category above has an explicit
 *  real photo; this exists so a future addition here can't silently ship
 *  with a broken image if someone forgets to add one. */
const img = (label: string) => `https://placehold.co/800x1000/EBE5DC/1C1B19/png?text=${encodeURIComponent(label)}`;

interface SeedVariant { color: string; size: string; stock: number }

interface SeedProduct {
  name: string;
  collection: string;
  category: string;
  gender: "MEN" | "WOMEN" | "UNISEX";
  material: string;
  fit: string;
  careInstructions: string;
  price: number;
  discount?: number;
  colors: string[];
  sizes: string[];
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  flashSale?: boolean;
  trending?: boolean;
}

const products: SeedProduct[] = [
  {
    name: "Oversized Cotton T-Shirt",
    collection: "the-everyday-edit",
    category: "t-shirts",
    gender: "UNISEX",
    material: "100% Cotton",
    fit: "Oversized Fit",
    careInstructions: "Machine wash cold with like colors. Do not bleach. Tumble dry low.",
    price: 890,
    discount: 10,
    colors: ["Black", "White", "Sand"],
    sizes: SIZES_TOP,
    featured: true,
    bestSeller: true,
  },
  {
    name: "Ribbed Basic Top",
    collection: "the-everyday-edit",
    category: "t-shirts",
    gender: "WOMEN",
    material: "95% Cotton, 5% Elastane",
    fit: "Slim Fit",
    careInstructions: "Hand wash cold. Lay flat to dry.",
    price: 750,
    colors: ["Black", "Ivory", "Olive"],
    sizes: SIZES_TOP,
    newArrival: true,
  },
  {
    name: "Classic Oxford Shirt",
    collection: "the-everyday-edit",
    category: "shirts",
    gender: "MEN",
    material: "100% Cotton Oxford",
    fit: "Regular Fit",
    careInstructions: "Machine wash cold. Iron on medium heat.",
    price: 1450,
    colors: ["White", "Light Blue"],
    sizes: SIZES_TOP,
    bestSeller: true,
  },
  {
    name: "Linen Shirt",
    collection: "summer-essentials",
    category: "shirts",
    gender: "MEN",
    material: "100% Linen",
    fit: "Relaxed Fit",
    careInstructions: "Machine wash cold, gentle cycle. Line dry.",
    price: 1650,
    discount: 15,
    colors: ["Beige", "White"],
    sizes: SIZES_TOP,
    newArrival: true,
    flashSale: true,
  },
  {
    name: "Premium Polo",
    collection: "summer-essentials",
    category: "polos",
    gender: "MEN",
    material: "100% Pima Cotton",
    fit: "Regular Fit",
    careInstructions: "Machine wash cold. Do not tumble dry.",
    price: 1250,
    colors: ["Navy", "Black", "Sand"],
    sizes: SIZES_TOP,
    trending: true,
  },
  {
    name: "Relaxed Fit Jeans",
    collection: "the-everyday-edit",
    category: "jeans",
    gender: "WOMEN",
    material: "99% Cotton, 1% Elastane",
    fit: "Relaxed Fit",
    careInstructions: "Machine wash cold, inside out. Do not bleach.",
    price: 2200,
    colors: ["Mid Blue", "Black"],
    sizes: SIZES_BOTTOM,
    bestSeller: true,
  },
  {
    name: "Straight Leg Denim",
    collection: "the-everyday-edit",
    category: "jeans",
    gender: "WOMEN",
    material: "98% Cotton, 2% Elastane",
    fit: "Straight Leg",
    careInstructions: "Machine wash cold, inside out.",
    price: 2100,
    discount: 12,
    colors: ["Dark Blue"],
    sizes: SIZES_BOTTOM,
    newArrival: true,
  },
  {
    name: "Wide Leg Trousers",
    collection: "the-everyday-edit",
    category: "trousers",
    gender: "WOMEN",
    material: "100% Cotton Twill",
    fit: "Wide Leg",
    careInstructions: "Machine wash cold. Iron on low heat.",
    price: 1950,
    colors: ["Black", "Stone"],
    sizes: SIZES_BOTTOM,
    featured: true,
  },
  {
    name: "Minimal Hoodie",
    collection: "weekend-layers",
    category: "hoodies-sweatshirts",
    gender: "UNISEX",
    material: "80% Cotton, 20% Polyester",
    fit: "Regular Fit",
    careInstructions: "Machine wash cold. Do not iron print.",
    price: 1850,
    colors: ["Charcoal", "Black", "Grey"],
    sizes: SIZES_TOP,
    bestSeller: true,
    trending: true,
  },
  {
    name: "Oversized Sweatshirt",
    collection: "weekend-layers",
    category: "hoodies-sweatshirts",
    gender: "UNISEX",
    material: "100% Cotton Fleece",
    fit: "Oversized Fit",
    careInstructions: "Machine wash cold. Tumble dry low.",
    price: 1650,
    colors: ["Beige", "Black"],
    sizes: SIZES_TOP,
    newArrival: true,
  },
  {
    name: "Utility Jacket",
    collection: "weekend-layers",
    category: "outerwear",
    gender: "UNISEX",
    material: "100% Cotton Canvas",
    fit: "Regular Fit",
    careInstructions: "Machine wash cold. Do not tumble dry.",
    price: 3200,
    colors: ["Olive", "Black"],
    sizes: SIZES_TOP,
    featured: true,
  },
  {
    name: "Canvas Tote Bag",
    collection: "summer-essentials",
    category: "accessories",
    gender: "UNISEX",
    material: "100% Cotton Canvas",
    fit: "One Size",
    careInstructions: "Spot clean only.",
    price: 550,
    colors: ["Natural", "Black"],
    sizes: ["One Size"],
    trending: true,
  },
  {
    name: "Graphic Print Tee",
    collection: "the-everyday-edit",
    category: "t-shirts",
    gender: "UNISEX",
    material: "100% Cotton",
    fit: "Regular Fit",
    careInstructions: "Machine wash cold inside out. Do not iron print.",
    price: 820,
    colors: ["Black", "White"],
    sizes: SIZES_TOP,
    newArrival: true,
  },
  {
    name: "Flannel Check Shirt",
    collection: "weekend-layers",
    category: "shirts",
    gender: "MEN",
    material: "100% Brushed Cotton",
    fit: "Regular Fit",
    careInstructions: "Machine wash cold. Tumble dry low.",
    price: 1550,
    colors: ["Red Check", "Green Check"],
    sizes: SIZES_TOP,
  },
  {
    name: "Pique Polo Shirt",
    collection: "summer-essentials",
    category: "polos",
    gender: "WOMEN",
    material: "100% Cotton Pique",
    fit: "Slim Fit",
    careInstructions: "Machine wash cold. Do not tumble dry.",
    price: 1150,
    discount: 10,
    colors: ["White", "Navy", "Pink"],
    sizes: SIZES_TOP,
  },
  {
    name: "Tailored Chino Trousers",
    collection: "the-everyday-edit",
    category: "trousers",
    gender: "MEN",
    material: "98% Cotton, 2% Elastane",
    fit: "Tailored Fit",
    careInstructions: "Machine wash cold. Iron on medium heat.",
    price: 1850,
    colors: ["Khaki", "Navy", "Black"],
    sizes: SIZES_BOTTOM,
    bestSeller: true,
  },
  {
    name: "Denim Jacket",
    collection: "weekend-layers",
    category: "outerwear",
    gender: "UNISEX",
    material: "100% Cotton Denim",
    fit: "Regular Fit",
    careInstructions: "Machine wash cold, inside out. Line dry.",
    price: 2650,
    colors: ["Mid Blue", "Black"],
    sizes: SIZES_TOP,
    trending: true,
  },
  {
    name: "Knit Beanie",
    collection: "summer-essentials",
    category: "accessories",
    gender: "UNISEX",
    material: "100% Acrylic Knit",
    fit: "One Size",
    careInstructions: "Hand wash cold. Lay flat to dry.",
    price: 450,
    colors: ["Black", "Grey", "Camel"],
    sizes: ["One Size"],
    newArrival: true,
  },
];

/**
 * This script is destructive — it clears orders, reviews and users before
 * inserting demo data. Against a live store that means deleting real customers'
 * order history, so production is refused outright. The escape hatch exists only
 * for a deliberate first-run bootstrap of an empty production database, and it
 * has to be asked for explicitly.
 */
/**
 * Resolves the admin credentials AND decides whether seeding may proceed.
 *
 * Every check here must happen before the first deleteMany() below. An earlier
 * version validated the admin credentials at the point of user creation, which
 * is after the deletes — so a production bootstrap with a missing
 * SEED_ADMIN_PASSWORD would wipe the database and only then fail. Validate
 * first, destroy second.
 */
function preflight(): { email: string; password: string; generated: boolean } {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    if (process.env.SEED_ALLOW_PRODUCTION !== "true") {
      throw new Error(
        "Refusing to seed: NODE_ENV=production.\n" +
          "This script deletes existing orders, reviews and users before inserting demo data.\n" +
          "If you really intend to bootstrap an empty production database, re-run with SEED_ALLOW_PRODUCTION=true."
      );
    }
    console.warn("⚠  SEED_ALLOW_PRODUCTION=true — seeding a PRODUCTION database. Existing orders will be deleted.");
  }

  const email = (process.env.SEED_ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();
  const supplied = process.env.SEED_ADMIN_PASSWORD;

  if (supplied) return { email, password: supplied, generated: false };

  if (isProduction) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set when seeding in production.");
  }

  // Development: generate rather than hardcode, so no known-password admin can
  // ever exist just because someone ran the seed.
  return { email, password: randomBytes(18).toString("base64url"), generated: true };
}

async function main() {
  const admin = preflight();
  console.log("Seeding database…");

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.address.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.user.deleteMany();

  const categoryMap: Record<string, string> = {};
  for (const c of categories) {
    const created = await prisma.category.create({
      data: { name: c.name, slug: c.slug, image: CATEGORY_IMAGES[c.slug] || img(c.name), sizeGuide: c.sizeGuide },
    });
    categoryMap[c.slug] = created.id;
  }

  const collectionMap: Record<string, string> = {};
  for (const c of collections) {
    const created = await prisma.collection.create({
      data: { name: c.name, slug: c.slug, story: c.story, banner: img(c.name) },
    });
    collectionMap[c.slug] = created.id;
  }

  for (const p of products) {
    const slug = slugify(p.name, { lower: true, strict: true });
    const skuPrefix = slug.split("-").map((w) => w.slice(0, 3)).join("").toUpperCase().slice(0, 9);

    // A handful of variants seeded at zero stock, so "Out of Stock" is
    // actually demonstrable in the demo data rather than every variant
    // conveniently having something available.
    const variants: SeedVariant[] = [];
    for (const color of p.colors) {
      for (const size of p.sizes) {
        const outOfStock = Math.random() < 0.15;
        variants.push({ color, size, stock: outOfStock ? 0 : Math.floor(5 + Math.random() * 40) });
      }
    }

    await prisma.product.create({
      data: {
        name: p.name,
        slug,
        collectionId: collectionMap[p.collection],
        categoryId: categoryMap[p.category],
        description: `${p.name} — ${p.fit.toLowerCase()}, made from ${p.material.toLowerCase()}. Designed for everyday wear.`,
        material: p.material,
        fit: p.fit,
        careInstructions: p.careInstructions,
        gender: p.gender,
        modelInfo: p.category === "accessories" ? null : `Model is 5'10" (178cm) wearing size M`,
        images: JSON.stringify(PRODUCT_IMAGES[p.name] || [img(p.name), img(`${p.name} 2`)]),
        images360: "[]",
        price: p.price,
        discountPercent: p.discount || 0,
        weightGrams: 300,
        isFeatured: !!p.featured,
        isBestSeller: !!p.bestSeller,
        isNewArrival: !!p.newArrival,
        isFlashSale: !!p.flashSale,
        isTrending: !!p.trending,
        variants: {
          create: variants.map((v, i) => ({
            color: v.color,
            size: v.size,
            sku: `${skuPrefix}-${v.color.slice(0, 3).toUpperCase()}-${v.size.replace(/\s/g, "")}`,
            stock: v.stock,
            position: i,
          })),
        },
      },
    });
  }

  // Give each collection its own banner instead of the one shared placeholder
  // image above — a real shot of one of that collection's own products, so a
  // "Weekend Layers" page doesn't look identical to "Summer Essentials".
  // Collections must exist before products, so this has to run as a pass
  // after both are seeded.
  for (const slug of Object.keys(collectionMap)) {
    const firstProduct = await prisma.product.findFirst({
      where: { collectionId: collectionMap[slug], images: { not: "[]" } },
      orderBy: [{ isBestSeller: "desc" }, { createdAt: "desc" }],
      select: { images: true },
    });
    if (firstProduct) {
      const [firstImage] = JSON.parse(firstProduct.images) as string[];
      if (firstImage) {
        await prisma.collection.update({ where: { id: collectionMap[slug] }, data: { banner: firstImage } });
      }
    }
  }

  // Credentials were resolved and validated in preflight(), before the deletes.
  if (admin.generated) generatedCredentials.push(["Admin", admin.email, admin.password]);

  await prisma.user.create({
    data: {
      name: "Store Admin",
      email: admin.email,
      password: await bcrypt.hash(admin.password, 10),
      role: "ADMIN",
      emailVerified: true,
      referralCode: "ADMIN001",
    },
  });

  const customerPlain = randomBytes(12).toString("base64url");
  generatedCredentials.push(["Customer", "customer@example.com", customerPlain]);
  const customerPassword = await bcrypt.hash(customerPlain, 10);
  const customer = await prisma.user.create({
    data: {
      name: "Test Customer",
      email: "customer@example.com",
      password: customerPassword,
      role: "CUSTOMER",
      emailVerified: true,
      referralCode: "TESTCUST1",
    },
  });

  // Sample address, notifications, and a support ticket so the account dashboard's new
  // sections (Saved Addresses, Notifications, Support Tickets) show real demo data
  // immediately rather than every reviewer landing on an empty state.
  await prisma.address.create({
    data: {
      userId: customer.id,
      label: "Home",
      fullName: "Test Customer",
      phone: "01700000000",
      district: "Dhaka",
      area: "Gulshan",
      street: "House 12, Road 5",
      isInsideDhaka: true,
      isDefault: true,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: customer.id,
        type: "WELCOME",
        title: "Welcome",
        message: "Thanks for creating an account — explore the full collection.",
        link: "/shop",
      },
      {
        userId: customer.id,
        type: "GENERAL",
        title: "New arrivals this week",
        message: "Fresh pieces from The Everyday Edit just landed.",
        link: "/shop?filter=new",
        read: true,
      },
    ],
  });

  await prisma.supportTicket.create({
    data: {
      userId: customer.id,
      subject: "Question about sizing",
      status: "RESOLVED",
      replies: {
        create: [
          {
            message: "Hi, I'm between M and L on the Oversized Cotton T-Shirt — any advice?",
            isFromStaff: false,
            authorName: customer.name,
          },
          {
            message: "Hi! That style runs true to size with a relaxed cut, so we'd recommend your usual size — size up only if you prefer an extra-roomy fit. Let us know if you need anything else!",
            isFromStaff: true,
            authorName: "Support Team",
          },
        ],
      },
    },
  });

  // Deliberately no seeded product reviews here — the homepage testimonials
  // section and product review lists only render real customer reviews
  // (TestimonialsSection returns null when empty), and fabricated reviewer
  // names/comments would show up as real content to actual site visitors.

  await prisma.coupon.create({
    data: {
      code: "WELCOME10",
      type: "PERCENT",
      value: 10,
      minSpend: 1000,
      active: true,
    },
  });

  console.log("Seed complete.");
  if (generatedCredentials.length > 0) {
    console.log("\nGenerated credentials — shown once, not stored anywhere. Save them now:");
    for (const [label, email, password] of generatedCredentials) {
      console.log(`  ${label.padEnd(9)} ${email}  ${password}`);
    }
    console.log("Set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD to choose these yourself.\n");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
