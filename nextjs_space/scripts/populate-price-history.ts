// Script to populate historical price data in the JSON file
import { promises as fs } from 'fs';
import path from 'path';
import { fetchYahooPriceHistory } from '../lib/yahoo-finance';

const STOCK_TICKERS = ['GOOG', 'TSLA', 'NVDA', 'AMZN', 'BRK-B', 'ISRG', 'NFLX', 'GOOGL', 'META', 'IDXX', 'III', 'PLTR', 'QBTS', 'RGTI'];

async function populatePriceHistory() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'stock_insights_data.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);

    console.log('Fetching price history for all stocks...\n');

    for (const ticker of STOCK_TICKERS) {
      if (!data[ticker] || typeof data[ticker] === 'string') {
        console.log(`⏭️  Skipping ${ticker} - no stock data`);
        continue;
      }

      console.log(`📊 Fetching ${ticker}...`);
      
      try {
        const priceHistory = await fetchYahooPriceHistory(ticker);
        
        if (priceHistory && priceHistory.length > 0) {
          // Convert to our JSON format: {date, price}
          const formattedData = priceHistory.map((item: any) => ({
            date: item.Date,
            price: item.Close
          }));
          
          if (data[ticker].stock_data) {
            data[ticker].stock_data.price_movement_30_days = formattedData;
            console.log(`   ✅ Added ${formattedData.length} data points`);
          }
        } else {
          console.log(`   ⚠️  No data returned`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Save updated data
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log('\n✅ Successfully updated stock_insights_data.json');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

populatePriceHistory();
