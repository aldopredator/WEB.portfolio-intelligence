import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkChubb() {
  const stocks = await prisma.stock.findMany({
    where: {
      OR: [
        { ticker: { contains: 'CB' } },
        { company: { contains: 'Chubb', mode: 'insensitive' } }
      ]
    },
    select: {
      ticker: true,
      company: true,
      costPrice: true,
      alternativeTickers: true
    }
  });

  console.log('Stocks matching Chubb or CB:');
  console.log(JSON.stringify(stocks, null, 2));

  await prisma.$disconnect();
}

checkChubb().catch(console.error);
