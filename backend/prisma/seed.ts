import { PrismaClient, PeriodType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data (in correct order for foreign keys)
  await prisma.winnerCertificate.deleteMany();
  await prisma.engagementScore.deleteMany();
  await prisma.revenueDistribution.deleteMany();
  await prisma.commentLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.ranking.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.categorySubscription.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@rankapp.com',
      username: 'admin',
      passwordHash: adminHash,
      ranksBalance: 1000,
      isAdmin: true,
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // Create demo user
  const demoHash = await bcrypt.hash('demo123', 10);
  const demo = await prisma.user.create({
    data: {
      email: 'demo@rankapp.com',
      username: 'demo',
      passwordHash: demoHash,
      ranksBalance: 500,
      isAdmin: false,
    },
  });
  console.log(`Created demo user: ${demo.email}`);

  // Create categories and subcategories
  const categoriesData = [
    {
      name: 'Sports',
      slug: 'sports',
      subcategories: [
        { name: 'Football', slug: 'football' },
        { name: 'Basketball', slug: 'basketball' },
        { name: 'Tennis', slug: 'tennis' },
        { name: 'MMA', slug: 'mma' },
      ],
    },
    {
      name: 'Cars',
      slug: 'cars',
      subcategories: [
        { name: 'Sports Cars', slug: 'sports-cars' },
        { name: 'SUVs', slug: 'suvs' },
        { name: 'Electric Vehicles', slug: 'electric-vehicles' },
        { name: 'Classic Cars', slug: 'classic-cars' },
      ],
    },
    {
      name: 'Music',
      slug: 'music',
      subcategories: [
        { name: 'Hip Hop', slug: 'hip-hop' },
        { name: 'Rock', slug: 'rock' },
        { name: 'Electronic', slug: 'electronic' },
        { name: 'Pop', slug: 'pop' },
      ],
    },
    {
      name: 'Countries',
      slug: 'countries',
      subcategories: [
        { name: 'Travel Destinations', slug: 'travel-destinations' },
        { name: 'Cuisine', slug: 'cuisine' },
        { name: 'Culture', slug: 'culture' },
      ],
    },
    {
      name: 'Phones',
      slug: 'phones',
      subcategories: [
        { name: 'Smartphones', slug: 'smartphones' },
        { name: 'Camera Quality', slug: 'camera-quality' },
        { name: 'Battery Life', slug: 'battery-life' },
        { name: 'Budget Phones', slug: 'budget-phones' },
      ],
    },
    {
      name: 'Movies',
      slug: 'movies',
      subcategories: [
        { name: 'Action', slug: 'action' },
        { name: 'Comedy', slug: 'comedy' },
        { name: 'Drama', slug: 'drama' },
        { name: 'Science Fiction', slug: 'science-fiction' },
      ],
    },
    {
      name: 'Food',
      slug: 'food',
      subcategories: [
        { name: 'Pizza', slug: 'pizza' },
        { name: 'Burgers', slug: 'burgers' },
        { name: 'Desserts', slug: 'desserts' },
        { name: 'Street Food', slug: 'street-food' },
      ],
    },
    {
      name: 'Tech',
      slug: 'tech',
      subcategories: [
        { name: 'AI & Machine Learning', slug: 'ai-machine-learning' },
        { name: 'Gadgets', slug: 'gadgets' },
        { name: 'Software', slug: 'software' },
      ],
    },
  ];

  const createdCategories: any[] = [];

  for (const catData of categoriesData) {
    const category = await prisma.category.create({
      data: {
        name: catData.name,
        slug: catData.slug,
        subcategories: {
          create: catData.subcategories,
        },
      },
      include: {
        subcategories: true,
      },
    });
    createdCategories.push(category);
    console.log(`Created category: ${category.name} with ${category.subcategories.length} subcategories`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
