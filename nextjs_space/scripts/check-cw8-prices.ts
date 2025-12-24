import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCW8Prices() {
  try {
    const history = await prisma.priceHistory.findMany({
      where: {
        stock: {
          ticker: 'CW8U.PA'
        }
      },
      orderBy: { date: 'asc' }
    });

    console.log('Total CW8U.PA records:', history.length);
    console.log('Date range:', history[0]?.date, 'to', history[history.length - 1]?.date);

    // Check Sept 24 - Nov 13 period
    const sept24ToNov13 = history.filter(h => {
      const d = new Date(h.date);
      return d >= new Date('2024-09-24') && d <= new Date('2024-11-13');
    });

    console.log('\n--- Sept 24 - Nov 13, 2024 Analysis ---');
    console.log('Records in this range:', sept24ToNov13.length);
    
    if (sept24ToNov13.length > 0) {
      console.log('\nFirst 5 records:');
      sept24ToNov13.slice(0, 5).forEach(h => {
        console.log(`  ${h.date.toISOString().split('T')[0]}: $${h.price}`);
      });
      
      console.log('\nLast 5 records:');
      sept24ToNov13.slice(-5).forEach(h => {
        console.log(`  ${h.date.toISOString().split('T')[0]}: $${h.price}`);
      });
      
      const uniquePrices = new Set(sept24ToNov13.map(h => h.price));
      console.log('\nUnique prices in this range:', uniquePrices.size);
      console.log('Price values:', Array.from(uniquePrices));
      
      if (uniquePrices.size === 1) {
        console.log('\n⚠️  WARNING: All prices are the same! This is likely incorrect data.');
      }
    }

    // Check recent data
    console.log('\n--- Recent 10 records ---');
    history.slice(-10).forEach(h => {
      console.log(`  ${h.date.toISOString().split('T')[0]}: $${h.price}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCW8Prices();
