import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmptyMetricsFields() {
  console.log('=== Checking which Metrics fields are empty ===\n');
  
  // Get all metrics
  const allMetrics = await prisma.metrics.findMany({
    orderBy: { snapshotDate: 'desc' },
    take: 100, // Sample the latest 100
  });
  
  const fieldsToCheck = [
    'bookValuePerShare',
    'currentRatio',
    'dividendYield',
    'earningsGrowthYoY',
    'eps',
    'grossMargin',
    'operatingMargin',
    'payoutRatio',
    'pegRatio',
    'quickRatio',
    'revenueGrowthYoY',
    'volume',
    'week52Return',
    'ytdReturn',
  ];
  
  const fieldStats: Record<string, { populated: number; empty: number; sample: any }> = {};
  
  fieldsToCheck.forEach(field => {
    fieldStats[field] = { populated: 0, empty: 0, sample: null };
  });
  
  allMetrics.forEach((metric: any) => {
    fieldsToCheck.forEach(field => {
      const value = metric[field];
      if (value !== null && value !== undefined) {
        fieldStats[field].populated++;
        if (!fieldStats[field].sample) {
          fieldStats[field].sample = value;
        }
      } else {
        fieldStats[field].empty++;
      }
    });
  });
  
  console.log(`Analyzed ${allMetrics.length} metric records\n`);
  console.log('Field Statistics:');
  console.log('================\n');
  
  fieldsToCheck.forEach(field => {
    const stats = fieldStats[field];
    const percentPopulated = ((stats.populated / allMetrics.length) * 100).toFixed(1);
    const status = stats.populated === 0 ? '❌ EMPTY' : stats.populated < allMetrics.length * 0.1 ? '⚠️  SPARSE' : '✅ OK';
    
    console.log(`${status} ${field}:`);
    console.log(`     Populated: ${stats.populated}/${allMetrics.length} (${percentPopulated}%)`);
    if (stats.sample !== null) {
      console.log(`     Sample value: ${stats.sample}`);
    }
    console.log();
  });
  
  // Show fields that are completely empty
  const completelyEmpty = fieldsToCheck.filter(f => fieldStats[f].populated === 0);
  const sparseFields = fieldsToCheck.filter(f => fieldStats[f].populated > 0 && fieldStats[f].populated < allMetrics.length * 0.1);
  
  console.log('\n=== Summary ===');
  console.log(`Completely empty fields (${completelyEmpty.length}): ${completelyEmpty.join(', ')}`);
  console.log(`Sparse fields (<10% populated, ${sparseFields.length}): ${sparseFields.join(', ')}`);
}

checkEmptyMetricsFields()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
