import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBarclays() {
  try {
    // Find Barclays portfolio
    const barclays = await prisma.portfolio.findFirst({
      where: { 
        name: {
          contains: 'barclays',
          mode: 'insensitive',
        }
      },
      include: {
        stocks: {
          where: { isActive: true },
          select: {
            ticker: true,
            company: true,
          },
        },
      },
    });

    if (!barclays) {
      console.log('❌ Barclays portfolio not found');
      return;
    }

    console.log(`\n📊 Portfolio: ${barclays.name}`);
    console.log(`📈 Total active stocks: ${barclays.stocks.length}\n`);
    
    barclays.stocks.forEach((stock, index) => {
      console.log(`${index + 1}. ${stock.ticker} - ${stock.company}`);
    });

    // Check all portfolios
    console.log('\n\n📋 All Portfolios:');
    const allPortfolios = await prisma.portfolio.findMany({
      include: {
        _count: {
          select: { stocks: true },
        },
      },
    });

    allPortfolios.forEach(p => {
      console.log(`  ${p.name}: ${p._count.stocks} stocks`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBarclays();
