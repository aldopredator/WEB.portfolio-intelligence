import { getStockData } from '../lib/stock-data';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGetStockData() {
  try {
    console.log('=== Testing getStockData() ===');
    const data = await getStockData();
    
    console.log('\n=== Result Keys ===');
    console.log(Object.keys(data));
    
    if (data.NVDA) {
      console.log('\n=== NVDA stock_data ===');
      const nvdaStockData = (data.NVDA as any).stock_data;
      console.log('floatShares:', nvdaStockData?.floatShares);
      console.log('sharesOutstanding:', nvdaStockData?.sharesOutstanding);
      console.log('averageVolume:', nvdaStockData?.averageVolume);
      console.log('roe:', nvdaStockData?.roe);
      console.log('roa:', nvdaStockData?.returnOnAssets);
    }
    
    if (data.AMZN) {
      console.log('\n=== AMZN stock_data ===');
      const amznStockData = (data.AMZN as any).stock_data;
      console.log('floatShares:', amznStockData?.floatShares);
      console.log('sharesOutstanding:', amznStockData?.sharesOutstanding);
      console.log('averageVolume:', amznStockData?.averageVolume);
      console.log('roe:', amznStockData?.roe);
      console.log('roa:', amznStockData?.returnOnAssets);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testGetStockData();
