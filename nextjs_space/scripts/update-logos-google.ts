import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateLogos() {
  try {
    console.log('🔄 Updating all logo URLs to Google favicon service...');
    
    const stocks = await prisma.stock.findMany({
      where: {
        logoUrl: {
          not: null
        }
      },
      select: {
        ticker: true,
        logoUrl: true,
        website: true,
      }
    });

    console.log(`📋 Found ${stocks.length} stocks with logo URLs`);

    let updated = 0;
    for (const stock of stocks) {
      if (stock.website) {
        const domain = stock.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        const newLogoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        
        await prisma.stock.update({
          where: { ticker: stock.ticker },
          data: { logoUrl: newLogoUrl }
        });
        
        updated++;
        if (updated <= 10) {
          console.log(`✅ ${stock.ticker}: ${newLogoUrl}`);
        }
      }
    }

    console.log(`🎉 Updated ${updated} logo URLs successfully!`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateLogos();
