const prisma = require("../prisma/prisma");
const { Prisma } = require("@prisma/client");

const categories = [
  {
    name: "Electronics",
    slug: "electronics",
    description: "Gadgets and electronic devices",
  },
  {
    name: "Fashion",
    slug: "fashion",
    description: "Clothing and accessories",
  },
  {
    name: "Home",
    slug: "home",
    description: "Household essentials",
  },
];

const products = [
  {
    name: "Wireless Headphones",
    description: "Noise-cancelling over-ear headphones",
    price: "149.99",
    stock: 12,
    imageUrl: "https://example.com/headphones.jpg",
    categorySlug: "electronics",
  },
  {
    name: "Smart Watch",
    description: "Fitness and notification tracker",
    price: "89.50",
    stock: 20,
    imageUrl: "https://example.com/smartwatch.jpg",
    categorySlug: "electronics",
  },
  {
    name: "Cotton T-Shirt",
    description: "Comfortable everyday tee",
    price: "19.99",
    stock: 40,
    imageUrl: "https://example.com/tshirt.jpg",
    categorySlug: "fashion",
  },
  {
    name: "Ceramic Mug",
    description: "Handmade ceramic coffee mug",
    price: "12.50",
    stock: 30,
    imageUrl: "https://example.com/mug.jpg",
    categorySlug: "home",
  },
];

const seedProducts = async () => {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: category,
    });
  }

  for (const product of products) {
    const category = await prisma.category.findUnique({
      where: { slug: product.categorySlug },
    });

    if (!category) {
      throw new Error(`Category not found for slug: ${product.categorySlug}`);
    }

    const existingProduct = await prisma.product.findFirst({
      where: { name: product.name },
    });

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          description: product.description,
          price: new Prisma.Decimal(product.price),
          stock: product.stock,
          imageUrl: product.imageUrl,
          categoryId: category.id,
        },
      });
      console.log(`Updated product: ${product.name}`);
    } else {
      await prisma.product.create({
        data: {
          name: product.name,
          description: product.description,
          price: new Prisma.Decimal(product.price),
          stock: product.stock,
          imageUrl: product.imageUrl,
          categoryId: category.id,
        },
      });
      console.log(`Created product: ${product.name}`);
    }
  }
};

seedProducts()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
