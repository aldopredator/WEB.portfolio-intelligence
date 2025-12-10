import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSignup() {
  try {
    const email = 'demo@portfolio-intelligence.co.uk';
    const password = 'demo123456';
    const name = 'Demo User';

    console.log('Testing signup for:', email);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('❌ User already exists:', existingUser);
      console.log('Deleting existing user...');
      await prisma.user.delete({
        where: { email },
      });
      console.log('✅ Existing user deleted');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    console.log('✅ User created:', { id: user.id, email: user.email, name: user.name });

    // Create default portfolio
    const portfolio = await prisma.portfolio.create({
      data: {
        name: 'My Portfolio',
        description: 'My default stock portfolio',
        userId: user.id,
      },
    });

    console.log('✅ Default portfolio created:', { id: portfolio.id, name: portfolio.name });

    // Test login
    const testUser = await prisma.user.findUnique({
      where: { email },
    });

    if (testUser && testUser.password) {
      const isValid = await bcrypt.compare(password, testUser.password);
      console.log('✅ Password verification:', isValid ? 'SUCCESS' : 'FAILED');
    }

    console.log('\n🎉 Signup test completed successfully!');
  } catch (error) {
    console.error('❌ Signup test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSignup();
