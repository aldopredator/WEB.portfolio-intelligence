/**
 * Migration script to move existing stocks to a default "My Barclays" portfolio
 * Run with: yarn tsx scripts/migrate-to-portfolios.ts
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function migrateToPortfolios() {
  console.log('🔄 Starting portfolio migration...');
  
  try {
    // Check if "My Barclays" portfolio already exists
    let myBarclays = await prisma.portfolio.findUnique({
      where: { name: 'My Barclays' }
    });

    // Create "My Barclays" portfolio if it doesn't exist
    if (!myBarclays) {
      myBarclays = await prisma.portfolio.create({
        data: {
          name: 'My Barclays',
          description: 'Default portfolio with existing stocks'
        }
      });
      console.log('✅ Created "My Barclays" portfolio');
    } else {
      console.log('✅ "My Barclays" portfolio already exists');
    }

    // Find all stocks without a portfolio
    const stocksWithoutPortfolio = await prisma.stock.findMany({
      where: {
        portfolioId: null
      }
    });

    console.log(`📊 Found ${stocksWithoutPortfolio.length} stocks without a portfolio`);

    if (stocksWithoutPortfolio.length > 0) {
      // Update all stocks to belong to "My Barclays" portfolio
      const result = await prisma.stock.updateMany({
        where: {
          portfolioId: null
        },
        data: {
          portfolioId: myBarclays.id
        }
      });

      console.log(`✅ Migrated ${result.count} stocks to "My Barclays" portfolio`);
    }

    // Display final portfolio status
    const portfolios = await prisma.portfolio.findMany({
      include: {
        _count: {
          select: { stocks: true }
        }
      }
    });

    console.log('\n📈 Portfolio Summary:');
    portfolios.forEach((portfolio: any) => {
      console.log(`  • ${portfolio.name}: ${portfolio._count.stocks} stocks`);
    });

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateToPortfolios()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
