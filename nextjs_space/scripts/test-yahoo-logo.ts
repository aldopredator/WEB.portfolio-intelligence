import { fetchYahooCompanyProfile } from '../lib/yahoo-finance';

async function test() {
  const profile = await fetchYahooCompanyProfile('NVDA');
  console.log('NVDA Yahoo Profile:');
  console.log('Logo URL:', profile?.logo);
  console.log('Full profile:', JSON.stringify(profile, null, 2));
}

test().catch(console.error);
