import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

const products = [
  {
    name: "KKFI Official Karate Gi (Uniform)",
    description:
      "Premium 100% cotton karate uniform with reinforced stitching. Approved by KKFI for training and competitions. Features the KKFI embroidered logo on the left chest. Lightweight yet durable, designed for full-contact training.",
    price: 1200,
    comparePrice: 1800,
    category: "APPAREL",
    images: [
      "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600",
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    inStock: true,
    stockCount: 50,
    featured: true,
  },
  {
    name: "White Belt (Beginner)",
    description:
      "Official KKFI white belt for beginners. Made of premium cotton with reinforced core. 4.5cm width, perfect for starting your Kyokushin journey.",
    price: 250,
    comparePrice: 400,
    category: "EQUIPMENT",
    images: [
      "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=600",
    ],
    sizes: ["S", "M", "L"],
    inStock: true,
    stockCount: 100,
    featured: false,
  },
  {
    name: "Orange Belt",
    description:
      "Official KKFI orange belt (10th Kyu). Hand-dyed for lasting color. Reinforced stitching for durability during training.",
    price: 300,
    category: "EQUIPMENT",
    images: [],
    sizes: ["S", "M", "L"],
    inStock: true,
    stockCount: 80,
    featured: false,
  },
  {
    name: "Blue Belt",
    description:
      "Official KKFI blue belt (8th Kyu). Premium quality cotton with reinforced stitching. Competition approved.",
    price: 350,
    category: "EQUIPMENT",
    images: [],
    sizes: ["S", "M", "L"],
    inStock: true,
    stockCount: 60,
    featured: false,
  },
  {
    name: "Yellow Belt",
    description:
      "Official KKFI yellow belt (6th Kyu). Hand-dyed for lasting color. Suitable for training and gradings.",
    price: 350,
    category: "EQUIPMENT",
    images: [],
    sizes: ["S", "M", "L"],
    inStock: true,
    stockCount: 60,
    featured: false,
  },
  {
    name: "Green Belt",
    description:
      "Official KKFI green belt (4th Kyu). Premium hand-dyed cotton. A milestone in your Kyokushin journey.",
    price: 400,
    category: "EQUIPMENT",
    images: [],
    sizes: ["S", "M", "L"],
    inStock: true,
    stockCount: 40,
    featured: false,
  },
  {
    name: "Brown Belt",
    description:
      "Official KKFI brown belt (1st-3rd Kyu). Thick premium cotton build. For advanced students approaching black belt.",
    price: 450,
    category: "EQUIPMENT",
    images: [],
    sizes: ["S", "M", "L"],
    inStock: true,
    stockCount: 30,
    featured: false,
  },
  {
    name: "Black Belt (Shodan)",
    description:
      "Official KKFI black belt for Dan-graded members. Satin finish with embroidered name available. Thick and rigid premium construction. Only available for verified Dan holders.",
    price: 800,
    comparePrice: 1200,
    category: "EQUIPMENT",
    images: [],
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    stockCount: 20,
    featured: true,
  },
  {
    name: "Shin Guards (Pair)",
    description:
      "Competition-grade padded shin guards for full-contact sparring. Lightweight EVA foam padding with elastic straps. KKFI approved for all tournaments.",
    price: 900,
    comparePrice: 1400,
    category: "EQUIPMENT",
    images: [],
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    stockCount: 35,
    featured: true,
  },
  {
    name: "Groin Guard",
    description:
      "Essential protective equipment for kumite. Hard cup with comfortable elastic waistband. Required for all KKFI tournament participants.",
    price: 500,
    category: "EQUIPMENT",
    images: [],
    sizes: ["S", "M", "L"],
    inStock: true,
    stockCount: 40,
    featured: false,
  },
  {
    name: "KKFI Training T-Shirt",
    description:
      'Breathable polyester training t-shirt with KKFI logo. "Kyokushin Spirit" printed on back. Perfect for warm-ups and casual training.',
    price: 599,
    comparePrice: 799,
    category: "APPAREL",
    images: [],
    sizes: ["S", "M", "L", "XL", "XXL"],
    inStock: true,
    stockCount: 75,
    featured: true,
  },
  {
    name: "KKFI Track Pants",
    description:
      "Comfortable track pants with KKFI branding. Elastic waist with drawstring. Side pockets. Great for warm-ups and dojo wear.",
    price: 699,
    category: "APPAREL",
    images: [],
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    stockCount: 50,
    featured: false,
  },
  {
    name: "Hand Wraps (Pair)",
    description:
      "4.5m elastic cotton hand wraps for knuckle and wrist protection. Essential for heavy bag training and makiwara. Thumb loop and velcro closure.",
    price: 199,
    category: "ACCESSORIES",
    images: [],
    sizes: [],
    inStock: true,
    stockCount: 120,
    featured: false,
  },
  {
    name: "Focus Mitts (Pair)",
    description:
      "Curved design focus mitts with shock-absorbing padding. Adjustable wrist strap. Perfect for partner drills and combination training.",
    price: 850,
    category: "EQUIPMENT",
    images: [],
    sizes: [],
    inStock: true,
    stockCount: 25,
    featured: false,
  },
  {
    name: "KKFI Duffle Bag",
    description:
      "Spacious 40L duffle bag with KKFI embroidered logo. Separate shoe compartment, water bottle pocket, and adjustable shoulder strap. Built tough for daily dojo use.",
    price: 999,
    comparePrice: 1499,
    category: "ACCESSORIES",
    images: [],
    sizes: [],
    inStock: true,
    stockCount: 30,
    featured: true,
  },
  {
    name: "Mouth Guard",
    description:
      "Boil-and-bite custom-fit mouth guard with carry case. Essential protection for sparring. BPA-free material. KKFI tournament approved.",
    price: 299,
    category: "ACCESSORIES",
    images: [],
    sizes: [],
    inStock: true,
    stockCount: 90,
    featured: false,
  },
];

async function main() {
  console.log("🛍️  Seeding products...");

  const existingCount = await prisma.product.count();
  if (existingCount > 0) {
    console.log(`  ⚠️  ${existingCount} products already exist. Deleting and re-seeding...`);
    await prisma.product.deleteMany({});
  }

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  const finalCount = await prisma.product.count();
  console.log(`  ✅ ${finalCount} products seeded successfully!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
