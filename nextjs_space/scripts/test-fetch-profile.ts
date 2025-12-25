import { PrismaClient } from '@prisma/client';
import { fetchCompanyProfile } from '../lib/finnhub-metrics';

const prisma = new PrismaClient();

async function testFetchProfile() {
  try {
    const profile = await fetchCompanyProfile('NVDA');
    console.log('✅ Profile fetched for NVDA:');
    console.log('  - Full Profile Object:', JSON.stringify(profile, null, 2));
    console.log('  - Industry:', profile.industry);
    console.log('  - Sector:', profile.sector);
    console.log('  - Country:', profile.country);
    console.log('  - Description:', profile.description?.substring(0, 100) + '...');
    console.log('  - Website:', profile.weburl);
    console.log('  - Employees:', profile.totalEmployees);
    console.log('  - Logo:', profile.logo);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFetchProfile();
