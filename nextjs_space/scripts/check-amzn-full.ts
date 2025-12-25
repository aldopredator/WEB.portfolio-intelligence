import { PrismaClient } from '@prisma/client';
import { getStockData } from '../lib/stock-data';

const prisma = new PrismaClient();

async function checkAMZNData() {
  console.log('=== Checking AMZN Data ===\n');
  
  // 1. Check Metrics table
  const metrics = await prisma.metrics.findFirst({
    where: { 
      stock: { ticker: 'AMZN' }
    },
    orderBy: { snapshotDate: 'desc' },
  });
  
  console.log('1. PRISMA.Metrics.marketCap:', metrics?.marketCap);
  
  // 2. Check getStockData
  const stockData = await getStockData();
  const amznData = stockData['AMZN'];
  
  console.log('\n2. getStockData result:');
  console.log('   company_profile.marketCapitalization:', amznData?.company_profile?.marketCapitalization);
  console.log('   stock_data.market_cap:', amznData?.stock_data?.market_cap);
  
  // 3. Full company_profile
  console.log('\n3. Full company_profile:');
  console.log(JSON.stringify(amznData?.company_profile, null, 2));
}

checkAMZNData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
