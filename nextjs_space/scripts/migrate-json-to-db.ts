/**
 * Script to migrate stock data from JSON file to PostgreSQL database
 * Run with: yarn tsx scripts/migrate-json-to-db.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface StockDataJSON {
  stock_data: {
    ticker: string;
    company: string;
    current_price: number;
    change: number;
    change_percent: number;
    '52_week_high': number;
    '52_week_low': number;
    price_movement_30_days: Array<{ date: string; price: number }>;
  };
  analyst_recommendations: {
    strong_buy: number;
    buy: number;
    hold: number;
    sell: number;
    strong_sell: number;
    consensus: string;
    price_target: number;
  };
  social_sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    overall: string;
  };
  latest_news: Array<{
    title: string;
    url?: string;
    source?: string;
    summary?: string;
    published_at?: string;
  }>;
}

interface StockInsightsData {
  [ticker: string]: StockDataJSON | string | undefined;
}

async function migrateData() {
  try {
    console.log('🚀 Starting JSON to Database migration...');

    // Read the JSON file
    const jsonPath = path.join(process.cwd(), 'public', 'stock_insights_data.json');
    const fileContent = await fs.readFile(jsonPath, 'utf-8');
    const stockData: StockInsightsData = JSON.parse(fileContent);

    console.log('📖 Loaded JSON data');

    // Get all tickers (exclude 'timestamp' key)
    const tickers = Object.keys(stockData).filter(key => key !== 'timestamp');
    console.log(`📊 Found ${tickers.length} stocks to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const ticker of tickers) {
      try {
        const data = stockData[ticker];
        if (typeof data === 'string' || typeof data === 'undefined') continue; // Skip string/undefined values
        
        const stockInfo = data.stock_data;
        const analystRecs = data.analyst_recommendations;
        const socialSent = data.social_sentiment;
        const news = data.latest_news || [];

        console.log(`\n🔄 Migrating ${ticker} (${stockInfo.company})...`);

        // Create or update stock
        const stock = await prisma.stock.upsert({
          where: { ticker },
          update: {
            company: stockInfo.company,
            isActive: true,
            updatedAt: new Date(),
          },
          create: {
            ticker,
            company: stockInfo.company,
            type: 'Equity', // Default type
            isActive: true,
          },
        });

        // Create or update stock data
        if (stockInfo.current_price > 0) {
          await prisma.stockData.upsert({
            where: { stockId: stock.id },
            update: {
              currentPrice: stockInfo.current_price,
              change: stockInfo.change,
              changePercent: stockInfo.change_percent,
              week52High: stockInfo['52_week_high'],
              week52Low: stockInfo['52_week_low'],
              lastUpdated: new Date(),
            },
            create: {
              stockId: stock.id,
              currentPrice: stockInfo.current_price,
              change: stockInfo.change,
              changePercent: stockInfo.change_percent,
              week52High: stockInfo['52_week_high'],
              week52Low: stockInfo['52_week_low'],
            },
          });
        }

        // Create or update price history
        if (stockInfo.price_movement_30_days && stockInfo.price_movement_30_days.length > 0) {
          console.log(`  📈 Adding ${stockInfo.price_movement_30_days.length} price history entries`);
          
          for (const pricePoint of stockInfo.price_movement_30_days) {
            if (pricePoint.price > 0) {
              await prisma.priceHistory.upsert({
                where: {
                  stockId_date: {
                    stockId: stock.id,
                    date: new Date(pricePoint.date),
                  },
                },
                update: {
                  price: pricePoint.price,
                },
                create: {
                  stockId: stock.id,
                  date: new Date(pricePoint.date),
                  price: pricePoint.price,
                },
              });
            }
          }
        }

        // Create or update analyst recommendations
        if (analystRecs) {
          await prisma.analystRecommendation.upsert({
            where: { stockId: stock.id },
            update: {
              strongBuy: analystRecs.strong_buy || 0,
              buy: analystRecs.buy || 0,
              hold: analystRecs.hold || 0,
              sell: analystRecs.sell || 0,
              strongSell: analystRecs.strong_sell || 0,
              consensus: analystRecs.consensus,
              priceTarget: analystRecs.price_target,
              lastUpdated: new Date(),
            },
            create: {
              stockId: stock.id,
              strongBuy: analystRecs.strong_buy || 0,
              buy: analystRecs.buy || 0,
              hold: analystRecs.hold || 0,
              sell: analystRecs.sell || 0,
              strongSell: analystRecs.strong_sell || 0,
              consensus: analystRecs.consensus,
              priceTarget: analystRecs.price_target,
            },
          });
        }

        // Create or update social sentiment
        if (socialSent) {
          await prisma.socialSentiment.upsert({
            where: { stockId: stock.id },
            update: {
              positive: socialSent.positive || 0,
              neutral: socialSent.neutral || 0,
              negative: socialSent.negative || 0,
              overall: socialSent.overall,
              lastUpdated: new Date(),
            },
            create: {
              stockId: stock.id,
              positive: socialSent.positive || 0,
              neutral: socialSent.neutral || 0,
              negative: socialSent.negative || 0,
              overall: socialSent.overall,
            },
          });
        }

        // Create news articles
        if (news && news.length > 0) {
          console.log(`  📰 Adding ${news.length} news articles`);
          
          // Delete old news first
          await prisma.news.deleteMany({
            where: { stockId: stock.id },
          });

          // Create new news entries
          for (const article of news) {
            await prisma.news.create({
              data: {
                stockId: stock.id,
                title: article.title,
                url: article.url,
                source: article.source,
                summary: article.summary,
                publishedAt: article.published_at ? new Date(article.published_at) : null,
              },
            });
          }
        }

        console.log(`  ✅ Successfully migrated ${ticker}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Error migrating ${ticker}:`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Migration completed!');
    console.log(`✅ Success: ${successCount} stocks`);
    console.log(`❌ Errors: ${errorCount} stocks`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateData();
