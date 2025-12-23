import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function updateBRKAlternatives() {
  console.log('Updating BRK.B alternative tickers...');
  
  try {
    const result = await prisma.stock.update({
      where: { ticker: 'BRK.B' },
      data: { 
        alternativeTickers: ['BRK/B', 'BRK-B']
      }
    });
    
    console.log('✅ Updated BRK.B successfully:', {
      ticker: result.ticker,
      company: result.company,
      alternativeTickers: result.alternativeTickers
    });
  } catch (error) {
    console.error('❌ Error updating BRK.B:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBRKAlternatives();
