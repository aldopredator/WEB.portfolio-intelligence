import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if test user already exists
  const existingTestUser = await prisma.user.findUnique({
    where: { email: 'john@doe.com' },
  });

  if (existingTestUser) {
    console.log('✓ Test user already exists');
    return;
  }

  // Create test user
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  
  const testUser = await prisma.user.create({
    data: {
      email: 'john@doe.com',
      password: hashedPassword,
      name: 'Test User',
    },
  });

  console.log('✓ Created test user:', testUser.email);

  // Create default portfolio for test user
  const defaultPortfolio = await prisma.portfolio.create({
    data: {
      name: 'My Portfolio',
      description: 'Default portfolio',
      userId: testUser.id,
    },
  });

  console.log('✓ Created default portfolio:', defaultPortfolio.name);

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
