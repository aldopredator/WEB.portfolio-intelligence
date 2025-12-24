import { CheckCircle2, Filter, Info, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { getStockData } from '@/lib/stock-data';
import { parseCriteriaFromParams } from '@/lib/screening-criteria';
import ScreeningClient from './ScreeningClient';
import ScreeningTable from './ScreeningTable';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const revalidate = 0; // Revalidate on every request to show latest portfolio names

// Country code to name mapping (matches Finnhub API format)
const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States',
  'CN': 'China',
  'JP': 'Japan',
  'DE': 'Germany',
  'GB': 'United Kingdom',
  'FR': 'France',
  'IN': 'India',
  'CA': 'Canada',
  'KR': 'South Korea',
  'AU': 'Australia',
  'RU': 'Russia',
  'BR': 'Brazil',
  'MX': 'Mexico',
  'ES': 'Spain',
  'IT': 'Italy',
  'NL': 'Netherlands',
  'CH': 'Switzerland',
  'SA': 'Saudi Arabia',
  'TR': 'Turkey',
  'ID': 'Indonesia',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
};

const getCountryName = (code: string): string => COUNTRY_NAMES[code] || code;

// Helper function to calculate 30-day return from price history
function calculate30DayReturn(priceHistory: Array<{date: string; price: number} | {Date: string; Close: number}>): number | null {
  if (!priceHistory || priceHistory.length < 30) return null;
  
  const sortedData = [...priceHistory].sort((a, b) => {
    const dateA = 'date' in a ? a.date : a.Date;
    const dateB = 'date' in b ? b.date : b.Date;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });
  
  const lastEntry = sortedData[sortedData.length - 1];
  const thirtyDaysAgoEntry = sortedData[sortedData.length - 30];
  
  const todayPrice = 'price' in lastEntry ? lastEntry.price : lastEntry.Close;
  const thirtyDaysAgoPrice = 'price' in thirtyDaysAgoEntry ? thirtyDaysAgoEntry.price : thirtyDaysAgoEntry.Close;
  
  if (!todayPrice || !thirtyDaysAgoPrice) return null;
  
  return ((todayPrice / thirtyDaysAgoPrice) - 1) * 100;
}

// Helper function to calculate 30-day annualized volatility
function calculate30DayVolatility(priceHistory: Array<{date: string; price: number} | {Date: string; Close: number}>): number | null {
  if (!priceHistory || priceHistory.length < 31) return null;
  
  const sortedData = [...priceHistory].sort((a, b) => {
    const dateA = 'date' in a ? a.date : a.Date;
    const dateB = 'date' in b ? b.date : b.Date;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });
  
  const last31Days = sortedData.slice(-31);
  
  const dailyReturns: number[] = [];
  for (let i = 1; i < last31Days.length; i++) {
    const todayEntry = last31Days[i];
    const yesterdayEntry = last31Days[i-1];
    
    const priceToday = 'price' in todayEntry ? todayEntry.price : todayEntry.Close;
    const priceYesterday = 'price' in yesterdayEntry ? yesterdayEntry.price : yesterdayEntry.Close;
    
    if (priceToday && priceYesterday) {
      const dailyReturn = (priceToday / priceYesterday) - 1;
      dailyReturns.push(dailyReturn);
    }
  }
  
  if (dailyReturns.length < 30) return null;
  
  const mean = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
  const squaredDiffs = dailyReturns.map(ret => Math.pow(ret - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev * Math.sqrt(252) * 100;
}

export default async function ScreeningPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Parse criteria from URL parameters (or use defaults)
  const CRITERIA = parseCriteriaFromParams(new URLSearchParams(searchParams as Record<string, string>));
  
  // Fetch stocks from database with portfolio information
  const dbStocks = await prisma.stock.findMany({
    where: { isActive: true },
    select: {
      ticker: true,
      company: true,
      type: true,
      rating: true,
      updatedAt: true,
      portfolio: {
        select: { 
          name: true,
          id: true
        }
      }
    }
  });
  
  // Fetch real stock data
  const allStockData = await getStockData();
  
  // Build screening results from real data with actual filtering
  const recommendedStocks = dbStocks.map((stock) => {
    const data: any = allStockData[stock.ticker];
    const stockInfo = data && typeof data === 'object' && 'stock_data' in data ? data.stock_data : null;
    const companyProfile = data && typeof data === 'object' && 'company_profile' in data ? data.company_profile : null;
    
    if (!stockInfo) {
      return null;
    }

    // Apply screening criteria (only check enabled criteria)
    const passes: Record<string, boolean> = {};
    const hardFilters: Record<string, boolean> = {}; // Filters that must pass 100%
    
    if (CRITERIA.peEnabled) {
      // Prioritize Yahoo Finance trailingPE over Finnhub pe_ratio
      const peValue = (stockInfo as any).trailingPE || stockInfo.pe_ratio;
      passes.pe = !peValue || peValue < CRITERIA.maxPE;
    }
    
    if (CRITERIA.pbEnabled) {
      // Prioritize Yahoo Finance priceToBook over Finnhub pb_ratio
      const pbValue = (stockInfo as any).priceToBook || stockInfo.pb_ratio;
      passes.pb = !pbValue || pbValue < CRITERIA.maxPB;
    }
    
    if (CRITERIA.marketCapEnabled && stockInfo.market_cap) {
      const marketCapB = stockInfo.market_cap / 1e9; // Convert to billions
      passes.marketCap = marketCapB >= CRITERIA.minMarketCap && marketCapB <= CRITERIA.maxMarketCap;
    }
    
    if (CRITERIA.betaEnabled && stockInfo.beta !== undefined) {
      passes.beta = stockInfo.beta >= CRITERIA.minBeta && stockInfo.beta <= CRITERIA.maxBeta;
    }
    
    if (CRITERIA.roeEnabled) {
      // Prioritize Yahoo Finance returnOnEquity over Finnhub roe
      const roeValue = (stockInfo as any).returnOnEquity || stockInfo.roe;
      if (roeValue !== undefined) {
        passes.roe = roeValue >= CRITERIA.minROE;
      }
    }
    
    if (CRITERIA.profitMarginEnabled) {
      // Prioritize Yahoo Finance profitMargins over Finnhub profit_margin
      const profitMarginValue = (stockInfo as any).profitMargins || stockInfo.profit_margin;
      if (profitMarginValue !== undefined) {
        passes.profitMargin = profitMarginValue >= CRITERIA.minProfitMargin;
      }
    }
    
    if (CRITERIA.priceToSalesEnabled) {
      // Prioritize Yahoo Finance priceToSales over Finnhub ps_ratio
      const psValue = stockInfo.priceToSales || stockInfo.ps_ratio;
      if (psValue !== undefined) {
        passes.priceToSales = psValue >= CRITERIA.minPriceToSales && psValue <= CRITERIA.maxPriceToSales;
      }
    }
    
    if (CRITERIA.avgDailyVolumeEnabled && stockInfo.averageVolume !== undefined) {
      const avgVolumeM = stockInfo.averageVolume / 1e6; // Convert to millions
      passes.avgVolume = avgVolumeM >= CRITERIA.minAvgDailyVolume && avgVolumeM <= CRITERIA.maxAvgDailyVolume;
    }
    
    if (CRITERIA.avgAnnualVolume10DEnabled && stockInfo.averageVolume10Day !== undefined && stockInfo.floatShares !== undefined && stockInfo.floatShares > 0) {
      const annualVolume10D = (stockInfo.averageVolume10Day * 250 / stockInfo.floatShares) * 100;
      passes.avgAnnualVolume10D = annualVolume10D >= CRITERIA.minAvgAnnualVolume10D && annualVolume10D <= CRITERIA.maxAvgAnnualVolume10D;
    }
    
    if (CRITERIA.avgAnnualVolume3MEnabled && stockInfo.averageVolume !== undefined && stockInfo.floatShares !== undefined && stockInfo.floatShares > 0) {
      const annualVolume3M = (stockInfo.averageVolume * 250 / stockInfo.floatShares) * 100;
      passes.avgAnnualVolume3M = annualVolume3M >= CRITERIA.minAvgAnnualVolume3M && annualVolume3M <= CRITERIA.maxAvgAnnualVolume3M;
    }
    
    if (CRITERIA.debtToEquityEnabled && stockInfo.debtToEquity !== undefined) {
      passes.debtToEquity = stockInfo.debtToEquity <= CRITERIA.maxDebtToEquity;
    }
    
    if (CRITERIA.sentimentEnabled && CRITERIA.sentimentFilter !== 'all') {
      const sentiment = data && typeof data === 'object' && 'social_sentiment' in data ? data.social_sentiment : null;
      if (sentiment && typeof sentiment === 'object' && 'positive' in sentiment && 'neutral' in sentiment && 'negative' in sentiment) {
        // Determine overall sentiment based on which percentage is highest
        const positive = sentiment.positive || 0;
        const neutral = sentiment.neutral || 0;
        const negative = sentiment.negative || 0;
        
        let overallSentiment: string;
        if (positive > neutral && positive > negative) {
          overallSentiment = 'positive';
        } else if (negative > neutral && negative > positive) {
          overallSentiment = 'negative';
        } else {
          overallSentiment = 'neutral';
        }
        
        passes.sentiment = overallSentiment === CRITERIA.sentimentFilter;
      } else {
        passes.sentiment = false; // Fail if no sentiment data
      }
    }
    
    if (CRITERIA.ratingEnabled) {
      const stockRating = stock.rating || 0;
      if (CRITERIA.minRating === -1) {
        // Filter for "Not Rated" - rating must be 0
        hardFilters.rating = stockRating === 0;
      } else {
        // Filter for rated stocks - rating must be >= minRating
        hardFilters.rating = stockRating >= CRITERIA.minRating;
      }
    }
    
    if (CRITERIA.portfolioFilterEnabled && CRITERIA.portfolioFilter.length > 0) {
      const portfolioName = stock.portfolio?.name || '';
      hardFilters.portfolio = CRITERIA.portfolioFilter.includes(portfolioName);
    }
    
    if (CRITERIA.sectorFilterMode !== 'disabled') {
      if (companyProfile?.sector) {
        if (CRITERIA.sectorFilterMode === 'exclude') {
          hardFilters.sector = !CRITERIA.sectorFilter.includes(companyProfile.sector);
        } else if (CRITERIA.sectorFilterMode === 'include' && CRITERIA.sectorFilter.length > 0) {
          hardFilters.sector = CRITERIA.sectorFilter.includes(companyProfile.sector);
        }
      } else if (CRITERIA.sectorFilterMode === 'include' && CRITERIA.sectorFilter.length > 0) {
        // In include mode, reject stocks without a sector
        hardFilters.sector = false;
      }
    }
    
    if (CRITERIA.industryFilterMode !== 'disabled') {
      if (companyProfile?.industry) {
        if (CRITERIA.industryFilterMode === 'exclude') {
          hardFilters.industry = !CRITERIA.industryFilter.includes(companyProfile.industry);
        } else if (CRITERIA.industryFilterMode === 'include' && CRITERIA.industryFilter.length > 0) {
          hardFilters.industry = CRITERIA.industryFilter.includes(companyProfile.industry);
        }
      } else if (CRITERIA.industryFilterMode === 'include' && CRITERIA.industryFilter.length > 0) {
        // In include mode, reject stocks without an industry
        hardFilters.industry = false;
      }
    }
    
    if (CRITERIA.countryFilterMode !== 'disabled' && companyProfile?.country) {
      if (CRITERIA.countryFilterMode === 'exclude') {
        hardFilters.country = !CRITERIA.countryFilter.includes(companyProfile.country);
      } else if (CRITERIA.countryFilterMode === 'include' && CRITERIA.countryFilter.length > 0) {
        hardFilters.country = CRITERIA.countryFilter.includes(companyProfile.country);
      }
    }

    // Hard filters must ALL pass (100% required)
    const hardFiltersPassed = Object.values(hardFilters).every(v => v === true);
    if (!hardFiltersPassed) {
      return null;
    }

    // Calculate match score only from flexible criteria (not hard filters)
    const totalCriteria = Object.keys(passes).length;
    const passCount = Object.values(passes).filter(Boolean).length;
    const matchScore = totalCriteria > 0 ? Math.round((passCount / totalCriteria) * 100) : 100;

    // Apply match score filter if enabled
    // If no flexible criteria are enabled, match score filter cannot be applied
    if (CRITERIA.matchScoreEnabled && totalCriteria > 0) {
      if (matchScore < CRITERIA.minMatchScore) {
        return null;
      }
    } else if (!CRITERIA.matchScoreEnabled && totalCriteria > 0) {
      // If match score is disabled but we have flexible criteria, require 100% match
      if (matchScore < 100) {
        return null;
      }
    }

    // Filter out stocks with missing portfolio assignment
    if (!stock.portfolio?.name) {
      return null;
    }

    // Build the initial stock data object
    const industry = companyProfile?.industry || stock.type;
    const sector = companyProfile?.sector || 'N/A';
    // Prioritize Yahoo Finance fields over Finnhub fields
    const pe = (stockInfo as any).trailingPE?.toFixed(0) || stockInfo.pe_ratio?.toFixed(0);
    const pb = (stockInfo as any).priceToBook?.toFixed(0) || stockInfo.pb_ratio?.toFixed(0);
    const priceToSales = stockInfo.priceToSales?.toFixed(0) || stockInfo.ps_ratio?.toFixed(0);
    const marketCap = stockInfo.market_cap ? `$${(stockInfo.market_cap / 1e9).toFixed(0)}B` : null;
    const avgVolume = stockInfo.averageVolume ? `${(stockInfo.averageVolume / 1e6).toFixed(0)}M` : null;
    const avgAnnualVolume10D = (stockInfo.averageVolume10Day && stockInfo.floatShares && stockInfo.floatShares > 0)
      ? `${((stockInfo.averageVolume10Day * 250 / stockInfo.floatShares) * 100).toFixed(0)}%`
      : null;
    const avgAnnualVolume3M = (stockInfo.averageVolume && stockInfo.floatShares && stockInfo.floatShares > 0)
      ? `${((stockInfo.averageVolume * 250 / stockInfo.floatShares) * 100).toFixed(0)}%`
      : null;
    const beta = stockInfo.beta?.toFixed(2);
    // Prioritize Yahoo Finance ROE and Profit Margin over Finnhub
    const roe = (stockInfo as any).returnOnEquity ? `${(stockInfo as any).returnOnEquity.toFixed(0)}%` : (stockInfo.roe ? `${stockInfo.roe.toFixed(0)}%` : null);
    const profitMargin = (stockInfo as any).profitMargins ? `${(stockInfo as any).profitMargins.toFixed(0)}%` : (stockInfo.profit_margin ? `${stockInfo.profit_margin.toFixed(0)}%` : null);
    const debtToEquity = stockInfo.debtToEquity?.toFixed(0);
    const sentiment = data && typeof data === 'object' && 'sentiment_data' in data
      ? (data.sentiment_data as any)?.overall_sentiment
      : null;

    // Calculate data completeness score for key fields
    const keyFields = [industry, pe, pb, priceToSales, marketCap, avgVolume];
    const availableFields = keyFields.filter(field => field !== null && field !== undefined).length;
    const totalKeyFields = keyFields.length;
    const dataCompletenessScore = Math.round((availableFields / totalKeyFields) * 100);
    
    // Adjust match score based on data completeness
    // If stock passes criteria filters but has missing data, reduce match score proportionally
    const adjustedMatchScore = Math.round((matchScore * dataCompletenessScore) / 100);

    // Extract additional fields for export
    const country = companyProfile?.country || 'N/A';
    const trailingPE = (stockInfo as any).trailingPE?.toFixed(2) || 'N/A';
    const forwardPE = (stockInfo as any).forwardPE?.toFixed(2) || 'N/A';
    const enterpriseToRevenue = (stockInfo as any).enterpriseToRevenue?.toFixed(2) || 'N/A';
    const enterpriseToEbitda = (stockInfo as any).enterpriseToEbitda?.toFixed(2) || 'N/A';
    const roa = (stockInfo as any).returnOnAssets ? `${((stockInfo as any).returnOnAssets * 100).toFixed(2)}%` : 'N/A';
    const quarterlyRevenueGrowth = (stockInfo as any).quarterlyRevenueGrowth ? `${((stockInfo as any).quarterlyRevenueGrowth * 100).toFixed(2)}%` : 'N/A';
    const quarterlyEarningsGrowth = (stockInfo as any).quarterlyEarningsGrowth ? `${((stockInfo as any).quarterlyEarningsGrowth * 100).toFixed(2)}%` : 'N/A';

    // Calculate 30-day metrics from price history
    const priceHistory = data && typeof data === 'object' && 'price_movement_90_days' in data ? data.price_movement_90_days : null;
    const return30Day = priceHistory ? calculate30DayReturn(priceHistory as any) : null;
    const volatility30Day = priceHistory ? calculate30DayVolatility(priceHistory as any) : null;

    return {
      ticker: stock.ticker,
      name: stock.company,
      sector: sector || 'N/A',
      industry: industry || 'N/A',
      portfolio: stock.portfolio.name,
      portfolioId: stock.portfolio.id,
      rating: stock.rating || 0,
      updatedAt: stock.updatedAt,
      pe: pe || 'N/A',
      pb: pb || 'N/A',
      priceToSales: priceToSales || 'N/A',
      marketCap: marketCap || 'N/A',
      avgVolume: avgVolume || 'N/A',
      avgAnnualVolume10D: avgAnnualVolume10D || 'N/A',
      avgAnnualVolume3M: avgAnnualVolume3M || 'N/A',
      beta: beta || 'N/A',
      roe: roe || 'N/A',
      profitMargin: profitMargin || 'N/A',
      debtToEquity: debtToEquity || 'N/A',
      sentiment: sentiment || 'N/A',
      matchScore: adjustedMatchScore,
      country,
      trailingPE,
      forwardPE,
      enterpriseToRevenue,
      enterpriseToEbitda,
      roa,
      quarterlyRevenueGrowth,
      quarterlyEarningsGrowth,
      return30Day: return30Day !== null ? `${return30Day >= 0 ? '+' : ''}${return30Day.toFixed(2)}%` : 'N/A',
      volatility30Day: volatility30Day !== null ? `${volatility30Day.toFixed(1)}%` : 'N/A',
    };
  }).filter((stock): stock is NonNullable<typeof stock> => stock !== null);

  await prisma.$disconnect();

  return (
    <ScreeningClient>
      <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Active Criteria Display */}
        <div className="mb-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-lg px-4 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                <Info className="w-3 h-3 text-blue-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-400 mb-1">Active Screening Criteria</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {CRITERIA.peEnabled && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-emerald-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">P/E Ratio</span>
                    <span className="text-white font-mono font-semibold">&lt; {CRITERIA.maxPE}</span>
                  </div>
                )}
                {CRITERIA.pbEnabled && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-emerald-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">P/B Ratio</span>
                    <span className="text-white font-mono font-semibold">&lt; {CRITERIA.maxPB}</span>
                  </div>
                )}
                
                {CRITERIA.priceToSalesEnabled && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-purple-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">P/S Range</span>
                    <span className="text-white font-mono font-semibold">{CRITERIA.minPriceToSales} - {CRITERIA.maxPriceToSales}</span>
                  </div>
                )}
                
                {CRITERIA.avgDailyVolumeEnabled && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-purple-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Avg Volume Range</span>
                    <span className="text-white font-mono font-semibold">{CRITERIA.minAvgDailyVolume}M - {CRITERIA.maxAvgDailyVolume}M</span>
                  </div>
                )}
                
                {CRITERIA.avgAnnualVolume10DEnabled && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-purple-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Avg Annual Volume % (10D)</span>
                    <span className="text-white font-mono font-semibold">{CRITERIA.minAvgAnnualVolume10D}% - {CRITERIA.maxAvgAnnualVolume10D}%</span>
                  </div>
                )}
                
                {CRITERIA.avgAnnualVolume3MEnabled && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-purple-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Avg Annual Volume % (3M)</span>
                    <span className="text-white font-mono font-semibold">{CRITERIA.minAvgAnnualVolume3M}% - {CRITERIA.maxAvgAnnualVolume3M}%</span>
                  </div>
                )}
                
                {CRITERIA.debtToEquityEnabled && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-purple-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Max Debt/Equity</span>
                    <span className="text-white font-mono font-semibold">&lt; {CRITERIA.maxDebtToEquity}</span>
                  </div>
                )}
                
                {CRITERIA.marketCapEnabled && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-purple-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Market Cap Range</span>
                    <span className="text-white font-mono font-semibold">${CRITERIA.minMarketCap}B - ${CRITERIA.maxMarketCap}B</span>
                  </div>
                )}
                
                {CRITERIA.betaEnabled && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-purple-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Beta Range</span>
                    <span className="text-white font-mono font-semibold">{CRITERIA.minBeta.toFixed(2)} - {CRITERIA.maxBeta.toFixed(2)}</span>
                  </div>
                )}
                
                {CRITERIA.roeEnabled && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-purple-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Min ROE</span>
                    <span className="text-white font-mono font-semibold">&gt; {CRITERIA.minROE}%</span>
                  </div>
                )}
                
                {CRITERIA.profitMarginEnabled && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-purple-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Min Profit Margin</span>
                    <span className="text-white font-mono font-semibold">&gt; {CRITERIA.minProfitMargin}%</span>
                  </div>
                )}
                
                {CRITERIA.sentimentEnabled && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-purple-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Sentiment Filter</span>
                    <span className="text-white font-mono font-semibold capitalize">{CRITERIA.sentimentFilter}</span>
                  </div>
                )}
                
                {CRITERIA.sectorFilterMode === 'exclude' && CRITERIA.sectorFilter.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-red-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Excluded Sectors</span>
                    <span className="text-white font-mono font-semibold">
                      {CRITERIA.sectorFilter.join(', ')}
                    </span>
                  </div>
                )}
                
                {CRITERIA.sectorFilterMode === 'include' && CRITERIA.sectorFilter.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-green-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Include Only Sectors</span>
                    <span className="text-white font-mono font-semibold">
                      {CRITERIA.sectorFilter.join(', ')}
                    </span>
                  </div>
                )}
                
                {CRITERIA.matchScoreEnabled && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-blue-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Min Match Score</span>
                    <span className="text-white font-mono font-semibold">&gt; {CRITERIA.minMatchScore}%</span>
                  </div>
                )}
                
                {CRITERIA.countryFilterMode === 'exclude' && CRITERIA.countryFilter.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-orange-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Excluded Countries</span>
                    <span className="text-white font-mono font-semibold">
                      {CRITERIA.countryFilter.map(getCountryName).join(', ')}
                    </span>
                  </div>
                )}
                
                {CRITERIA.countryFilterMode === 'include' && CRITERIA.countryFilter.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 border border-green-500/30 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Include Only Countries</span>
                    <span className="text-white font-mono font-semibold">
                      {CRITERIA.countryFilter.map(getCountryName).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stock Cards Grid (Mobile-friendly alternative to table) */}
        <div className="lg:hidden mb-6">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-slate-300 text-sm font-medium">
                {recommendedStocks.length} {recommendedStocks.length === 1 ? 'stock' : 'stocks'} match your criteria
              </span>
            </div>
          </div>
          <div className="space-y-4">
          {recommendedStocks.map((stock) => (
            <div
              key={stock.ticker}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6 hover:border-slate-700/50 transition-all hover:shadow-lg hover:shadow-blue-500/5"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{stock.ticker}</h3>
                  <p className="text-slate-400 text-sm">{stock.name}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">
                    {stock.sector}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">{stock.matchScore}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {CRITERIA.peEnabled && (
                  <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                    <p className="text-slate-400 text-xs mb-1">P/E Ratio</p>
                    <p className="text-emerald-400 font-mono font-bold text-lg">{stock.pe}</p>
                  </div>
                )}
                {CRITERIA.pbEnabled && (
                  <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                    <p className="text-slate-400 text-xs mb-1">P/B Ratio</p>
                    <p className="text-emerald-400 font-mono font-bold text-lg">{stock.pb}</p>
                  </div>
                )}
                {CRITERIA.marketCapEnabled && (
                  <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                    <p className="text-slate-400 text-xs mb-1">Market Cap</p>
                    <p className="text-purple-400 font-mono font-bold text-lg">{stock.marketCap}</p>
                  </div>
                )}
                {CRITERIA.betaEnabled && (
                  <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                    <p className="text-slate-400 text-xs mb-1">Beta</p>
                    <p className="text-purple-400 font-mono font-bold text-lg">{stock.beta}</p>
                  </div>
                )}
                {CRITERIA.roeEnabled && (
                  <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                    <p className="text-slate-400 text-xs mb-1">ROE</p>
                    <p className="text-purple-400 font-mono font-bold text-lg">{stock.roe}</p>
                  </div>
                )}
                {CRITERIA.profitMarginEnabled && (
                  <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                    <p className="text-slate-400 text-xs mb-1">Profit Margin</p>
                    <p className="text-purple-400 font-mono font-bold text-lg">{stock.profitMargin}</p>
                  </div>
                )}
                {CRITERIA.sentimentEnabled && (
                  <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                    <p className="text-slate-400 text-xs mb-1">Sentiment</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      stock.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      stock.sentiment === 'negative' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      stock.sentiment === 'neutral' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                      'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {stock.sentiment}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Stock Table (Desktop) */}
        <div className="hidden lg:block mb-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-slate-300 text-sm font-medium">
                {recommendedStocks.length} {recommendedStocks.length === 1 ? 'stock' : 'stocks'} match your criteria
              </span>
            </div>
          </div>
          <ScreeningTable 
            stocks={recommendedStocks} 
            criteria={{
              peEnabled: CRITERIA.peEnabled,
              pbEnabled: CRITERIA.pbEnabled,
              marketCapEnabled: CRITERIA.marketCapEnabled,
              betaEnabled: CRITERIA.betaEnabled,
              roeEnabled: CRITERIA.roeEnabled,
              profitMarginEnabled: CRITERIA.profitMarginEnabled,
              debtToEquityEnabled: CRITERIA.debtToEquityEnabled,
              sentimentEnabled: CRITERIA.sentimentEnabled,
              ratingEnabled: CRITERIA.ratingEnabled,
              avgAnnualVolume10DEnabled: CRITERIA.avgAnnualVolume10DEnabled,
              avgAnnualVolume3MEnabled: CRITERIA.avgAnnualVolume3MEnabled,
            }}
          />
        </div>

        {/* Methodology Card */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-lg px-4 py-2 backdrop-blur-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                <Info className="w-3 h-3 text-blue-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-blue-400 mb-1">Screening Methodology</h3>
              <p className="text-slate-300 text-xs leading-relaxed mb-2">
                Your customized screening criteria filter stocks based on the following parameters:
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {CRITERIA.peEnabled && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/50 rounded border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-400">P/E Ratio Threshold:</span>
                    <span className="text-white font-semibold">Filters stocks with P/E ratio less than {CRITERIA.maxPE}</span>
                  </div>
                )}
                {CRITERIA.pbEnabled && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/50 rounded border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-400">P/B Ratio Threshold:</span>
                    <span className="text-white font-semibold">Filters stocks with P/B ratio less than {CRITERIA.maxPB}</span>
                  </div>
                )}
                {CRITERIA.marketCapEnabled && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/50 rounded border border-purple-500/30">
                    <CheckCircle2 className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    <span className="text-slate-400">Market Cap Range:</span>
                    <span className="text-white font-semibold">Filters stocks with market cap between ${CRITERIA.minMarketCap}B and ${CRITERIA.maxMarketCap}B</span>
                  </div>
                )}
                {CRITERIA.betaEnabled && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/50 rounded border border-purple-500/30">
                    <CheckCircle2 className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    <span className="text-slate-400">Beta Range:</span>
                    <span className="text-white font-semibold">Filters stocks with beta between {CRITERIA.minBeta.toFixed(2)} and {CRITERIA.maxBeta.toFixed(2)}</span>
                  </div>
                )}
                {CRITERIA.roeEnabled && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/50 rounded border border-purple-500/30">
                    <CheckCircle2 className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    <span className="text-slate-400">ROE Minimum:</span>
                    <span className="text-white font-semibold">Filters stocks with ROE greater than {CRITERIA.minROE}%</span>
                  </div>
                )}
                {CRITERIA.profitMarginEnabled && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/50 rounded border border-purple-500/30">
                    <CheckCircle2 className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    <span className="text-slate-400">Profit Margin Minimum:</span>
                    <span className="text-white font-semibold">Filters stocks with profit margin greater than {CRITERIA.minProfitMargin}%</span>
                  </div>
                )}
                {CRITERIA.sentimentEnabled && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/50 rounded border border-purple-500/30">
                    <CheckCircle2 className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    <span className="text-slate-400">Sentiment Filter:</span>
                    <span className="text-white font-semibold capitalize">Filters stocks with {CRITERIA.sentimentFilter} social sentiment</span>
                  </div>
                )}
                {CRITERIA.sectorFilterMode === 'exclude' && CRITERIA.sectorFilter.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/50 rounded border border-red-500/30">
                    <CheckCircle2 className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span className="text-slate-400">Sector Exclusions:</span>
                    <span className="text-white font-semibold">Excludes stocks in the following sectors: {CRITERIA.sectorFilter.join(', ')}</span>
                  </div>
                )}
                
                {CRITERIA.sectorFilterMode === 'include' && CRITERIA.sectorFilter.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/50 rounded border border-green-500/30">
                    <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                    <span className="text-slate-400">Sector Inclusion:</span>
                    <span className="text-white font-semibold">Shows only stocks in: {CRITERIA.sectorFilter.join(', ')}</span>
                  </div>
                )}
                
                {CRITERIA.matchScoreEnabled && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/50 rounded border border-blue-500/30">
                    <CheckCircle2 className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    <span className="text-slate-400">Match Score Filter:</span>
                    <span className="text-white font-semibold">Shows only stocks with match score above {CRITERIA.minMatchScore}%</span>
                  </div>
                )}
                
                {CRITERIA.countryFilterMode === 'exclude' && CRITERIA.countryFilter.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/50 rounded border border-orange-500/30">
                    <CheckCircle2 className="w-3 h-3 text-orange-400 flex-shrink-0" />
                    <span className="text-slate-400">Country Exclusions:</span>
                    <span className="text-white font-semibold">Excludes stocks from the following countries: {CRITERIA.countryFilter.map(getCountryName).join(', ')}</span>
                  </div>
                )}
                
                {CRITERIA.countryFilterMode === 'include' && CRITERIA.countryFilter.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/50 rounded border border-green-500/30">
                    <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                    <span className="text-slate-400">Country Inclusion:</span>
                    <span className="text-white font-semibold">Shows only stocks from: {CRITERIA.countryFilter.map(getCountryName).join(', ')}</span>
                  </div>
                )}
              </div>
              {!CRITERIA.peEnabled && !CRITERIA.pbEnabled && !CRITERIA.marketCapEnabled && !CRITERIA.betaEnabled && 
               !CRITERIA.roeEnabled && !CRITERIA.profitMarginEnabled && !CRITERIA.sentimentEnabled && 
               CRITERIA.sectorFilterMode === 'disabled' && CRITERIA.countryFilterMode === 'disabled' && (
                <p className="text-slate-400 text-xs italic">No criteria currently enabled. All stocks will be shown.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
    </ScreeningClient>
  );
}
