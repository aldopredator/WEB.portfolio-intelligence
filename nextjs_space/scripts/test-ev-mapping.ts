import { getStockData } from '../lib/stock-data';
import dotenv from 'dotenv';

dotenv.config();

async function testEVMapping() {
  try {
    console.log('=== Testing Enterprise Value mapping ===');
    const data = await getStockData('cmirgdwtm00092gdpj701hwwy');
    
    if (data.AMZN) {
      const amznStockData = (data.AMZN as any).stock_data;
      console.log('\n=== AMZN Valuation Metrics ===');
      console.log('priceToSales:', amznStockData?.priceToSales);
      console.log('trailingPE:', amznStockData?.trailingPE);
      console.log('enterpriseToRevenue:', amznStockData?.enterpriseToRevenue);
      console.log('enterpriseToEbitda:', amznStockData?.enterpriseToEbitda);
      console.log('forwardPE:', amznStockData?.forwardPE);
      console.log('priceToBook:', amznStockData?.priceToBook);
    } else {
      console.log('AMZN not in result');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testEVMapping();
