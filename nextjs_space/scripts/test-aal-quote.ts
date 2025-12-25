import { fetchYahooQuote } from '../lib/yahoo-finance';

async function testAAL() {
  console.log('Testing AAL quote fetch...\n');
  
  const quote = await fetchYahooQuote('AAL');
  
  console.log('Result:', JSON.stringify(quote, null, 2));
}

testAAL();
