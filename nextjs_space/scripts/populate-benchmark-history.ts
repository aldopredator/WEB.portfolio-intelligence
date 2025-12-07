import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateBenchmarkHistory() {
  const benchmarkTicker = 'CW8';
  
  console.log(`[Benchmark] Fetching 30-day history for ${benchmarkTicker}...`);
  
  try {
    // Fetch CW8 data from your stock API
    const response = await fetch(`http://localhost:3000/api/stock?ticker=${benchmarkTicker}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${benchmarkTicker} data`);
    }
    
    const stockData = await response.json();
    const priceHistory = stockData.price_history || [];
    
    console.log(`[Benchmark] Received ${priceHistory.length} data points`);
    
    if (priceHistory.length === 0) {
      console.log(`[Benchmark] No price history data available for ${benchmarkTicker}`);
      return;
    }
    
    // Delete existing benchmark data
    await prisma.priceHistory.deleteMany({
      where: { ticker: benchmarkTicker },
    });
    
    console.log(`[Benchmark] Cleared existing ${benchmarkTicker} data`);
    
    // Insert new benchmark data
    const records = priceHistory.map((entry: any) => ({
      ticker: benchmarkTicker,
      date: new Date(entry.date || entry.Date),
      price: parseFloat(entry.price || entry.Close),
      volume: entry.volume || entry.Volume ? parseFloat(entry.volume || entry.Volume) : null,
    }));
    
    await prisma.priceHistory.createMany({
      data: records,
      skipDuplicates: true,
    });
    
    console.log(`[Benchmark] Successfully populated ${records.length} price points for ${benchmarkTicker}`);
    
  } catch (error) {
    console.error(`[Benchmark] Error populating ${benchmarkTicker} history:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

populateBenchmarkHistory()
  .then(() => {
    console.log('[Benchmark] Population complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Benchmark] Population failed:', error);
    process.exit(1);
  });
