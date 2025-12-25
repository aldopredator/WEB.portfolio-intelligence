import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStockData() {
  console.log('=== Checking StockData Issues ===\n');
  
  // Check AAL (broken)
  const aalStock = await prisma.stock.findUnique({
    where: { ticker: 'AAL' },
    include: { stockData: true }
  });
  
  console.log('AAL StockData:');
  console.log('  currentPrice:', aalStock?.stockData?.currentPrice);
  console.log('  changePercent:', aalStock?.stockData?.changePercent);
  console.log('  week52High:', aalStock?.stockData?.week52High);
  console.log('  week52Low:', aalStock?.stockData?.week52Low);
  console.log('  lastUpdated:', aalStock?.stockData?.lastUpdated);
  
  // Check AMZN (working)
  const amznStock = await prisma.stock.findUnique({
    where: { ticker: 'AMZN' },
    include: { stockData: true }
  });
  
  console.log('\nAMZN StockData:');
  console.log('  currentPrice:', amznStock?.stockData?.currentPrice);
  console.log('  changePercent:', amznStock?.stockData?.changePercent);
  console.log('  week52High:', amznStock?.stockData?.week52High);
  console.log('  week52Low:', amznStock?.stockData?.week52Low);
  console.log('  lastUpdated:', amznStock?.stockData?.lastUpdated);
  
  // Count how many stocks have zero/null currentPrice
  const allStocks = await prisma.stock.findMany({
    where: { isActive: true },
    include: { stockData: true }
  });
  
  const withZeroPrice = allStocks.filter(s => !s.stockData?.currentPrice || s.stockData.currentPrice === 0);
  const withValidPrice = allStocks.filter(s => s.stockData?.currentPrice && s.stockData.currentPrice > 0);
  
  console.log('\n=== Statistics ===');
  console.log('Total active stocks:', allStocks.length);
  console.log('Stocks with zero/null price:', withZeroPrice.length);
  console.log('Stocks with valid price:', withValidPrice.length);
  
  console.log('\n=== Stocks with Zero/Null Price ===');
  withZeroPrice.slice(0, 20).forEach(s => {
    console.log(`  ${s.ticker} - currentPrice: ${s.stockData?.currentPrice}, lastUpdated: ${s.stockData?.lastUpdated}`);
  });
  
  console.log('\n=== Stocks with Valid Price (sample) ===');
  withValidPrice.slice(0, 10).forEach(s => {
    console.log(`  ${s.ticker} - currentPrice: ${s.stockData?.currentPrice}, lastUpdated: ${s.stockData?.lastUpdated}`);
  });
}

checkStockData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
