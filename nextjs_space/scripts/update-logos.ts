import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateLogos() {
  try {
    console.log('🔄 Updating all logo URLs from Clearbit to logo.dev...');
    
    const stocks = await prisma.stock.findMany({
      where: {
        logoUrl: {
          contains: 'logo.clearbit.com'
        }
      },
      select: {
        ticker: true,
        logoUrl: true,
      }
    });

    console.log(`📋 Found ${stocks.length} stocks with Clearbit logos`);

    for (const stock of stocks) {
      if (stock.logoUrl) {
        // Replace clearbit with logo.dev
        const newLogoUrl = stock.logoUrl
          .replace('https://logo.clearbit.com/', 'https://img.logo.dev/')
          + '?token=pk_X-HmPromRmKT_U8csOxyPeQ';
        
        await prisma.stock.update({
          where: { ticker: stock.ticker },
          data: { logoUrl: newLogoUrl }
        });
        
        console.log(`✅ ${stock.ticker}: Updated logo URL`);
      }
    }

    console.log('🎉 All logos updated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateLogos();
