import { getStockData } from '../lib/stock-data';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testWithPortfolio() {
  try {
    console.log('=== Testing getStockData() WITH portfolio filter ===');
    const data = await getStockData('cmirgdwtm00092gdpj701hwwy');
    
    if (data.NVDA) {
      console.log('\n=== NVDA stock_data ===');
      const nvdaStockData = (data.NVDA as any).stock_data;
      console.log('floatShares:', nvdaStockData?.floatShares);
      console.log('sharesOutstanding:', nvdaStockData?.sharesOutstanding);
      console.log('averageVolume:', nvdaStockData?.averageVolume);
      console.log('roe:', nvdaStockData?.roe);
      console.log('roa:', nvdaStockData?.returnOnAssets);
    } else {
      console.log('NVDA not in result');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testWithPortfolio();
