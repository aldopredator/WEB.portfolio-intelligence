import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function testEmployees() {
  try {
    console.log('🔍 Fetching NVDA asset profile to check fullTimeEmployees field...\n');
    
    const modules = await yahooFinance.quoteSummary('NVDA', {
      modules: ['assetProfile']
    });

    const assetProfile = modules.assetProfile as any;
    
    console.log('Asset Profile Data:');
    console.log('  - fullTimeEmployees:', assetProfile?.fullTimeEmployees);
    console.log('  - industry:', assetProfile?.industry);
    console.log('  - sector:', assetProfile?.sector);
    console.log('  - country:', assetProfile?.country);
    console.log('  - website:', assetProfile?.website);
    console.log('\n✅ Full employee count:', assetProfile?.fullTimeEmployees?.toLocaleString());
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEmployees();
