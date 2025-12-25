import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAAL() {
  try {
    const stock = await prisma.stock.findUnique({
      where: { ticker: 'AAL' },
      select: {
        ticker: true,
        company: true,
        employees: true,
        logoUrl: true,
        industry: true,
        sector: true,
        country: true,
      },
    });

    if (stock) {
      console.log('AAL Stock Data:');
      console.log(JSON.stringify(stock, null, 2));
    } else {
      console.log('AAL not found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAAL();
