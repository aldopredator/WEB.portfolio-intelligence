import { PrismaClient } from '@prisma/client';
import { fetchCompanyProfile } from '../lib/finnhub-metrics';

const prisma = new PrismaClient();

async function updateNVDAProfile() {
  try {
    // Find NVDA stock
    const stock = await prisma.stock.findFirst({
      where: { ticker: 'NVDA' },
    });

    if (!stock) {
      console.log('❌ NVDA stock not found');
      return;
    }

    console.log('📊 NVDA Stock ID:', stock.id);

    // Fetch profile
    const profile = await fetchCompanyProfile('NVDA');
    console.log('\n✅ Profile fetched:');
    console.log('  - Industry:', profile.industry);
    console.log('  - Sector:', profile.sector);
    console.log('  - Country:', profile.country);
    console.log('  - Description:', profile.description?.substring(0, 100) + '...');
    console.log('  - Website:', profile.weburl);
    console.log('  - Employees:', profile.totalEmployees);
    console.log('  - Logo:', profile.logo);

    // Update stock record
    await prisma.stock.update({
      where: { id: stock.id },
      data: {
        sector: profile.sector || undefined,
        industry: profile.industry || undefined,
        country: profile.country || undefined,
        description: profile.description || undefined,
        website: profile.weburl || undefined,
        employees: profile.totalEmployees || undefined,
        logoUrl: profile.logo || undefined,
      },
    });

    console.log('\n✅ Stock record updated');

    // Verify update
    const updated = await prisma.stock.findFirst({
      where: { ticker: 'NVDA' },
    });

    console.log('\n🏢 Updated Profile in DB:');
    console.log('  - Industry:', updated?.industry);
    console.log('  - Sector:', updated?.sector);
    console.log('  - Country:', updated?.country);
    console.log('  - Description:', updated?.description?.substring(0, 100) + '...');
    console.log('  - Website:', updated?.website);
    console.log('  - Employees:', updated?.employees);
    console.log('  - Logo URL:', updated?.logoUrl);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateNVDAProfile();
