import { PageHeader } from '@/components/page-header';
import { getStockData, STOCK_CONFIG } from '@/lib/stock-data';
import SectorMatrix from './SectorMatrix';

export const revalidate = 1800; // 30 minutes

export default async function SectorsPage() {
  // Fetch real stock data
  const stockData = await getStockData();
  
  // Group stocks by industry (from company_profile) with their data
  const sectorGroups: Record<string, Array<{
    ticker: string;
    name: string;
    sector: string;
    marketCap?: number;
    change?: number;
    changePercent?: number;
  }>> = {};

  STOCK_CONFIG.forEach((config) => {
    const data = stockData[config.ticker];
    const stockInfo = data && typeof data === 'object' && 'stock_data' in data ? data.stock_data : null;
    const companyProfile = data && typeof data === 'object' && 'company_profile' in data ? data.company_profile : null;
    
    // Use industry from company_profile, fallback to sector from config, then 'Other'
    const industry = (companyProfile && typeof companyProfile === 'object' && 'industry' in companyProfile 
      ? companyProfile.industry 
      : config.sector) || 'Other';
    
    if (!sectorGroups[industry]) {
      sectorGroups[industry] = [];
    }

    sectorGroups[industry].push({
      ticker: config.ticker,
      name: config.name,
      sector: industry,
      marketCap: stockInfo?.market_cap,
      change: stockInfo?.change,
      changePercent: stockInfo?.change_percent,
    });
  });

  return (
    <main className="min-h-screen">
      <PageHeader
        title="Sector Matrix"
        description="Visual grouping of stocks by industry sectors"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <SectorMatrix sectorGroups={sectorGroups} />
      </div>
    </main>
  );
}
