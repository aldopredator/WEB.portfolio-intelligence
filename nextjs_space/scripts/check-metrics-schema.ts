/**
 * Check what columns exist in the Metrics table
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMetricsSchema() {
  console.log('🔍 Checking Metrics table schema...\n');
  
  try {
    // Get a sample record to see what fields exist
    const sample = await prisma.metrics.findFirst({
      orderBy: { snapshotDate: 'desc' },
    });
    
    if (sample) {
      console.log('✅ Found sample metrics record:\n');
      const fields = Object.keys(sample);
      fields.forEach(field => {
        const value = (sample as any)[field];
        const isEmpty = value === null || value === undefined;
        const status = isEmpty ? '❌' : '✅';
        console.log(`${status} ${field}: ${value}`);
      });
      
      console.log(`\n📊 Total fields: ${fields.length}`);
      const emptyFields = fields.filter(f => (sample as any)[f] === null || (sample as any)[f] === undefined);
      console.log(`❌ Empty fields: ${emptyFields.length}`);
      console.log(`Empty field names: ${emptyFields.join(', ')}`);
    } else {
      console.log('⚠️  No metrics records found in database');
    }
    
    // Count total metrics records
    const count = await prisma.metrics.count();
    console.log(`\n📈 Total metrics records: ${count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMetricsSchema();
