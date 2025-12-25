// Shared stock data fetching logic
import { promises as fs } from 'fs';
import path from 'path';
import type { StockInsightsData } from '@/lib/types';
import { fetchAndScoreSentiment } from '@/lib/sentiment';
import { fetchFinnhubMetrics, fetchBalanceSheet, fetchCompanyProfile, fetchEarningsSurprises, fetchRecommendationTrends, fetchCompanyNews } from '@/lib/finnhub-metrics';
import { fetchPolygonStockStats } from '@/lib/polygon';
import { getPolygonCached, setPolygonCached, getNextTickerToFetch } from '@/lib/polygon-cache';
import { isRecord } from '@/lib/utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dynamic STOCK_CONFIG - will be loaded from database
export let STOCK_CONFIG: Array<{ ticker: string; name: string; sector: string }> = [];

/**
 * Fetch and enrich stock data from database
 * This is the single source of truth for stock data across the application
 * @param portfolioId - Optional portfolio ID to filter stocks
 */
export async function getStockData(portfolioId?: string | null): Promise<StockInsightsData> {
  try {
    console.log('[STOCK-DATA] 📊 Fetching stock data from database...');
    if (portfolioId) {
      console.log(`[STOCK-DATA] 🎯 Filtering by portfolio ID: ${portfolioId}`);
    } else {
      console.log('[STOCK-DATA] 📋 Fetching ALL active stocks (no portfolio filter)');
    }
    
    // Fetch all active stocks with their related data AND latest metrics
    const stocks = await prisma.stock.findMany({
      where: { 
        isActive: true,
        ...(portfolioId ? { portfolioId } : {}),
      },
      include: {
        stockData: true,
        priceHistory: {
          orderBy: { date: 'asc' },
          take: 30, // Reduced from 90 to stay under 5MB limit
        },
        analystRecommendations: true,
        socialSentiments: true,
        news: {
          orderBy: { publishedAt: 'desc' },
          take: 2, // Reduced from 5 to stay under 5MB limit
        },
        metrics: {
          orderBy: { snapshotDate: 'desc' },
          take: 1, // Get the latest snapshot
        },
      },
    });

    console.log(`[STOCK-DATA] ✅ Found ${stocks.length} active stocks in database`);
    if (stocks.length > 0) {
      console.log(`[STOCK-DATA] 📋 Tickers: ${stocks.map((s: any) => s.ticker).join(', ')}`);
    }

    // Update STOCK_CONFIG dynamically
    STOCK_CONFIG = stocks.map((stock: any) => ({
      ticker: stock.ticker,
      name: stock.company,
      sector: 'Technology', // TODO: Add sector to database schema
    }));

    // Convert database format to StockInsightsData format
    const mergedData: StockInsightsData = {
      timestamp: new Date().toISOString(),
    };

    for (const stock of stocks) {
      const stockData = stock.stockData;
      const analystRec = stock.analystRecommendations?.[0]; // Get first element since it's an array
      const socialSent = stock.socialSentiments?.[0]; // Get first element since it's an array
      const latestMetrics = stock.metrics?.[0]; // Get the latest snapshot
      
      // DEBUG: Log metrics loading
      console.log(`[STOCK-DATA-DEBUG] ${stock.ticker}: metrics loaded = ${stock.metrics?.length || 0}, latest = ${latestMetrics ? 'YES' : 'NO'}`);

      // Build stock_data object with cached metrics from database
      const stockDataObj: any = {
        ticker: stock.ticker,
        company: stock.company,
        current_price: stockData?.currentPrice || 0,
        change: stockData?.change || 0,
        change_percent: stockData?.changePercent || 0,
        '52_week_high': stockData?.week52High || 0,
        '52_week_low': stockData?.week52Low || 0,
        price_movement_90_days: stock.priceHistory.map((ph: any) => ({
          Date: ph.date.toISOString().split('T')[0],
          Close: ph.price,
        })),
        totalEmployees: stock.employees || null, // Add employee count from cached data
      };

      // Merge cached metrics from database if available
      if (latestMetrics) {
        // Check if metrics are fresh (< 2 days old)
        const metricsAge = Date.now() - latestMetrics.snapshotDate.getTime();
        const isMetricsFresh = metricsAge < 2 * 24 * 60 * 60 * 1000; // 2 days
        
        if (isMetricsFresh) {
          console.log(`[STOCK-DATA] 💾 Using cached metrics for ${stock.ticker} (${Math.round(metricsAge / (1000 * 60 * 60))}h old)`);
          
          // Valuation metrics
          if (latestMetrics.peRatio !== null) {
            stockDataObj.pe_ratio = latestMetrics.peRatio;
            stockDataObj.trailingPE = latestMetrics.peRatio; // UI expects this name
          }
          if (latestMetrics.forwardPE !== null) stockDataObj.forwardPE = latestMetrics.forwardPE;
          if (latestMetrics.pbRatio !== null) stockDataObj.pb_ratio = latestMetrics.pbRatio;
          if (latestMetrics.psRatio !== null) {
            stockDataObj.ps_ratio = latestMetrics.psRatio;
            stockDataObj.priceToSales = latestMetrics.psRatio; // UI expects this name
          }
          if (latestMetrics.priceToBook !== null) stockDataObj.priceToBook = latestMetrics.priceToBook;
          if (latestMetrics.evToRevenue !== null) {
            stockDataObj.evToRevenue = latestMetrics.evToRevenue;
            stockDataObj.enterpriseToRevenue = latestMetrics.evToRevenue; // UI expects this name
          }
          if (latestMetrics.evToEbitda !== null) {
            stockDataObj.evToEbitda = latestMetrics.evToEbitda;
            stockDataObj.enterpriseToEbitda = latestMetrics.evToEbitda; // UI expects this name
          }
          if (latestMetrics.pegRatio !== null) stockDataObj.pegRatio = latestMetrics.pegRatio;
          
          // Performance metrics
          if (latestMetrics.beta !== null) stockDataObj.beta = latestMetrics.beta;
          
          // Financial health
          if (latestMetrics.debtToEquity !== null) stockDataObj.debtToEquity = latestMetrics.debtToEquity;
          if (latestMetrics.roe !== null) stockDataObj.roe = latestMetrics.roe;
          if (latestMetrics.roa !== null) stockDataObj.returnOnAssets = latestMetrics.roa;
          if (latestMetrics.operatingMargin !== null) stockDataObj.operatingMargin = latestMetrics.operatingMargin;
          if (latestMetrics.profitMargin !== null) stockDataObj.profit_margin = latestMetrics.profitMargin;
          if (latestMetrics.profitMargin !== null) stockDataObj.profitMargins = latestMetrics.profitMargin; // Yahoo format
          if (latestMetrics.grossMargin !== null) stockDataObj.grossMargin = latestMetrics.grossMargin;
          if (latestMetrics.currentRatio !== null) stockDataObj.currentRatio = latestMetrics.currentRatio;
          if (latestMetrics.quickRatio !== null) stockDataObj.quickRatio = latestMetrics.quickRatio;
          
          // Growth metrics
          if (latestMetrics.revenueGrowthQoQ !== null) stockDataObj.quarterlyRevenueGrowth = latestMetrics.revenueGrowthQoQ;
          if (latestMetrics.earningsGrowthQoQ !== null) stockDataObj.quarterlyEarningsGrowth = latestMetrics.earningsGrowthQoQ;
          
          // Market data
          if (latestMetrics.marketCap !== null) stockDataObj.market_cap = latestMetrics.marketCap;
          if (latestMetrics.volume !== null) stockDataObj.volume = latestMetrics.volume;
          if (latestMetrics.averageVolume !== null) stockDataObj.averageVolume = latestMetrics.averageVolume;
          if (latestMetrics.averageVolume10Day !== null) stockDataObj.averageVolume10Day = latestMetrics.averageVolume10Day;
          if (latestMetrics.sharesOutstanding !== null) stockDataObj.sharesOutstanding = latestMetrics.sharesOutstanding;
          if (latestMetrics.floatShares !== null) stockDataObj.floatShares = latestMetrics.floatShares;
          
          // Ownership - Add both field name variants for compatibility
          if (latestMetrics.heldByInsiders !== null) {
            stockDataObj.heldByInsiders = latestMetrics.heldByInsiders;
            stockDataObj.heldPercentInsiders = latestMetrics.heldByInsiders; // UI expects this name
          }
          if (latestMetrics.heldByInstitutions !== null) {
            stockDataObj.heldByInstitutions = latestMetrics.heldByInstitutions;
            stockDataObj.heldPercentInstitutions = latestMetrics.heldByInstitutions; // UI expects this name
          }
          
          // Dividend metrics
          if (latestMetrics.dividendYield !== null) stockDataObj.dividendYield = latestMetrics.dividendYield;
          if (latestMetrics.payoutRatio !== null) stockDataObj.payoutRatio = latestMetrics.payoutRatio;
          
          // Per share metrics
          if (latestMetrics.eps !== null) stockDataObj.eps = latestMetrics.eps;
          if (latestMetrics.bookValuePerShare !== null) stockDataObj.bookValuePerShare = latestMetrics.bookValuePerShare;
        } else {
          console.log(`[STOCK-DATA] ⏰ Metrics for ${stock.ticker} are stale (${Math.round(metricsAge / (1000 * 60 * 60 * 24))}d old), will enrich with APIs`);
        }
      } else {
        console.log(`[STOCK-DATA] 📭 No cached metrics for ${stock.ticker}, will enrich with APIs`);
      }

      (mergedData as any)[stock.ticker] = {
        stock_data: stockDataObj,
        company_profile: {
          // Use cached company profile data from Stock table
          name: stock.company || null,
          industry: stock.industry || null,
          sector: stock.sector || null,
          country: stock.country || null,
          longBusinessSummary: stock.description || null,
          website: stock.website || null,
          fullTimeEmployees: stock.employees || null,
          logo: stock.logoUrl || null,
          // Market cap from cached metrics (if available)
          marketCapitalization: latestMetrics?.marketCap || null,
          // Balance sheet fields will be enriched from API calls below
          assets: null,
          liabilities: null,
          currency: null,
          weburl: stock.website || null,
          ipoDate: null,
        },
        analyst_recommendations: {
          buy: analystRec?.buy || 0,
          hold: analystRec?.hold || 0,
          sell: analystRec?.sell || 0,
          strongBuy: analystRec?.strongBuy || 0,
          strongSell: analystRec?.strongSell || 0,
        },
        social_sentiment: {
          positive: socialSent?.positive || 0,
          neutral: socialSent?.neutral || 0,
          negative: socialSent?.negative || 0,
        },
        latest_news: stock.news.map((article: any) => ({
          headline: article.title,
          datetime: article.publishedAt?.getTime() || 0,
          image: '',
          source: article.source || '',
          summary: article.summary || '',
          url: article.url || '',
        })),
        emerging_trends: ['📊 Real-time data from database'],
      };
    }

    // Enrich with real-time APIs only for stocks with stale/missing metrics
    const tickersNeedingEnrichment = stocks
      .filter((s: any) => {
        const latestMetrics = s.metrics?.[0];
        if (!latestMetrics) return true;
        const metricsAge = Date.now() - latestMetrics.snapshotDate.getTime();
        return metricsAge >= 2 * 24 * 60 * 60 * 1000; // > 2 days old
      })
      .map((s: any) => s.ticker);
    
    if (tickersNeedingEnrichment.length > 0) {
      console.log(`[STOCK-DATA] 🔄 Enriching ${tickersNeedingEnrichment.length} stocks with stale/missing metrics...`);
      
      // Process other APIs in parallel (Finnhub, sentiment, Polygon) - only for stocks needing enrichment
      await Promise.allSettled(tickersNeedingEnrichment.map(async (ticker: string) => {
        try {
          const stockEntry = mergedData[ticker];

          // Company profile is now cached in Stock table - no need to fetch
          // Profile data was already added from stock.industry, stock.sector, stock.country above

          // Fetch financial metrics (only if not already cached)
          const metrics = await fetchFinnhubMetrics(ticker);
          if (metrics && isRecord(stockEntry) && stockEntry.stock_data) {
            Object.assign(stockEntry.stock_data, metrics);
          }

          // Fetch balance sheet (if company profile exists)
          const balanceSheet = await fetchBalanceSheet(ticker);
          if (balanceSheet && isRecord(stockEntry) && stockEntry.company_profile) {
            Object.assign(stockEntry.company_profile, balanceSheet);
          }

          // Fetch Polygon data (only if not already cached)
          const polygonStats = await fetchPolygonStockStats(ticker);
          if (polygonStats && isRecord(stockEntry) && stockEntry.stock_data) {
            Object.assign(stockEntry.stock_data, polygonStats);
          }

          // Fetch earnings surprises
          const earningsSurprises = await fetchEarningsSurprises(ticker);
          if (earningsSurprises && isRecord(stockEntry)) {
            stockEntry.earnings_surprises = earningsSurprises as any;
          }

          // Fetch recommendation trends
          const recommendationTrends = await fetchRecommendationTrends(ticker);
          if (recommendationTrends && isRecord(stockEntry)) {
            stockEntry.recommendation_trends = recommendationTrends as any;
          }

          // Fetch company news
          const news = await fetchCompanyNews(ticker, 10);
          if (news && news.length > 0 && isRecord(stockEntry)) {
            stockEntry.latest_news = news as any;
          }
        } catch (error) {
          console.error(`Error enriching ${ticker}:`, error);
        }
      }));
      
      console.log('[STOCK-DATA] ✅ Completed API enrichment for stale stocks');
    } else {
      console.log('[STOCK-DATA] ✅ All stocks have fresh cached metrics, skipping API enrichment');
    }
    
    // Always enrich company profiles and news for all stocks (these change frequently)
    const validTickers = stocks.map((s: any) => s.ticker);
    console.log('[STOCK-DATA] 📰 Fetching news for all stocks...');
    
    await Promise.allSettled(validTickers.map(async (ticker: string) => {
      try {
        const stockEntry = mergedData[ticker];

        // Company profile is now cached in Stock table - no need to fetch
        // Profile data was already added from stock.industry, stock.sector, stock.country above

        // Fetch balance sheet (always fresh) - skip if we already fetched during enrichment
        if (!tickersNeedingEnrichment.includes(ticker)) {
          const balanceSheet = await fetchBalanceSheet(ticker);
          if (balanceSheet && isRecord(stockEntry) && stockEntry.company_profile) {
            Object.assign(stockEntry.company_profile, balanceSheet);
          }
        }

        // Fetch recommendation trends (always fresh) - skip if we already fetched during enrichment
        if (!tickersNeedingEnrichment.includes(ticker)) {
          const recommendationTrends = await fetchRecommendationTrends(ticker);
          if (recommendationTrends && isRecord(stockEntry)) {
            stockEntry.recommendation_trends = recommendationTrends as any;
          }
        }

        // Fetch company news (always fresh) - skip if we already fetched during enrichment
        if (!tickersNeedingEnrichment.includes(ticker)) {
          const news = await fetchCompanyNews(ticker, 10);
          if (news && news.length > 0 && isRecord(stockEntry)) {
            stockEntry.latest_news = news as any;
          }
        }
      } catch (error) {
        console.error(`Error fetching profile/news for ${ticker}:`, error);
      }
    }));
    
    console.log('[STOCK-DATA] ✅ Completed profile and news enrichment');

    return mergedData;
  } catch (error) {
    console.error('Error loading stock data from database:', error);
    
    // Fallback to JSON file if database fails
    try {
      console.log('[STOCK-DATA] ⚠️ Falling back to JSON file...');
      const filePath = path.join(process.cwd(), 'public', 'stock_insights_data.json');
      const fileContents = await fs.readFile(filePath, 'utf8');
      return JSON.parse(fileContents);
    } catch (fallbackError) {
      console.error('Error loading fallback JSON data:', fallbackError);
      return {};
    }
  } finally {
    await prisma.$disconnect();
  }
}
