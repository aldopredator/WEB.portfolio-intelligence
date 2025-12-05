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
    
    // Fetch all active stocks with their related data
    const stocks = await prisma.stock.findMany({
      where: { 
        isActive: true,
        ...(portfolioId ? { portfolioId } : {}),
      },
      include: {
        stockData: true,
        priceHistory: {
          orderBy: { date: 'asc' },
          take: 30, // Last 30 days
        },
        analystRecommendations: true,
        socialSentiments: true,
        news: {
          orderBy: { publishedAt: 'desc' },
          take: 5,
        },
        metrics: true,
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

      (mergedData as any)[stock.ticker] = {
        stock_data: {
          ticker: stock.ticker,
          company: stock.company,
          current_price: stockData?.currentPrice || 0,
          change: stockData?.change || 0,
          change_percent: stockData?.changePercent || 0,
          '52_week_high': stockData?.week52High || 0,
          '52_week_low': stockData?.week52Low || 0,
          price_movement_30_days: stock.priceHistory.map((ph: any) => ({
            Date: ph.date.toISOString().split('T')[0],
            Close: ph.price,
          })),
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

    // Enrich with real-time APIs (optional - can be disabled for faster loading)
    const validTickers = stocks.map((s: any) => s.ticker);
    
    console.log('[STOCK-DATA] 🔄 Enriching with real-time data...');
    
    // Process other APIs in parallel (Finnhub, sentiment, Polygon)
    await Promise.allSettled(validTickers.map(async (ticker: string) => {
      try {
        const stockEntry = mergedData[ticker];

        // Fetch company profile
        const profile = await fetchCompanyProfile(ticker);
        if (profile && isRecord(stockEntry)) {
          stockEntry.company_profile = profile as any;
        }

        // Fetch financial metrics
        const metrics = await fetchFinnhubMetrics(ticker);
        if (metrics && isRecord(stockEntry) && stockEntry.stock_data) {
          Object.assign(stockEntry.stock_data, metrics);
        }

        // Fetch balance sheet
        const balanceSheet = await fetchBalanceSheet(ticker);
        if (balanceSheet && isRecord(stockEntry) && stockEntry.company_profile) {
          Object.assign(stockEntry.company_profile, balanceSheet);
        }

        // Fetch Polygon data
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
    
    console.log('[STOCK-DATA] ✅ Completed data enrichment');

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
