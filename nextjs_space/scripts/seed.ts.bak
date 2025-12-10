import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create or check demo user
  let demoUser = await prisma.user.findUnique({
    where: { email: 'demo@portfolio-intelligence.co.uk' },
  });

  if (!demoUser) {
    const hashedPassword = await bcrypt.hash('demo123456', 10);
    demoUser = await prisma.user.create({
      data: {
        email: 'demo@portfolio-intelligence.co.uk',
        password: hashedPassword,
        name: 'Demo User',
      },
    });
    console.log('✓ Created demo user:', demoUser.email);

    // Create default portfolio for demo user
    await prisma.portfolio.create({
      data: {
        name: 'Demo Portfolio',
        description: 'Demo portfolio',
        userId: demoUser.id,
      },
    });
    console.log('✓ Created demo portfolio');
  } else {
    console.log('✓ Demo user already exists');
  }

  // Create or check test user
  let testUser = await prisma.user.findUnique({
    where: { email: 'john@doe.com' },
  });

  if (!testUser) {
    const hashedPassword = await bcrypt.hash('johndoe123', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'john@doe.com',
        password: hashedPassword,
        name: 'Test User',
      },
    });
    console.log('✓ Created test user:', testUser.email);

    // Create default portfolio for test user
    await prisma.portfolio.create({
      data: {
        name: 'My Portfolio',
        description: 'Default portfolio',
        userId: testUser.id,
      },
    });
    console.log('✓ Created test portfolio');
  } else {
    console.log('✓ Test user already exists');
  }

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
