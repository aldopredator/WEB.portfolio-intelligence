'use client';

import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PriceHistoryChart from './PriceHistoryChart';
import StockDetailsCard from './StockDetailsCard';
import SocialSentimentCard from './SocialSentimentCard';
import CompanyInfoCard from './CompanyInfoCard';
import MarketNewsCard from './MarketNewsCard';
import RecommendationTrendsCard from './RecommendationTrendsCard';
import EarningsCalendarCard from './EarningsCalendarCard';
import EarningsSurprisesCard from './EarningsSurprisesCard';
import type { StockInsightsData } from '@/lib/types';

interface MainGridProps {
  stockData: StockInsightsData;
  selectedStock: string;
}

export default function MainGrid({ stockData, selectedStock }: MainGridProps) {
  const stockEntry = stockData[selectedStock];
  
  if (!stockEntry || typeof stockEntry === 'string') {
    return <Typography>No data available for {selectedStock}</Typography>;
  }

  const stock = stockEntry.stock_data;
  if (!stock) {
    return <Typography>Stock data not available</Typography>;
  }



  // Get company name from stock config
  const companyNameMap: Record<string, string> = {
    'GOOG': 'Alphabet',
    'TSLA': 'Tesla',
    'NVDA': 'Nvidia',
    'AMZN': 'Amazon',
    'BRK-B': 'Berkshire Hathaway',
    'ISRG': 'Intuitive Surgical',
    'NFLX': 'Netflix',
    'IDXX': 'IDEXX Laboratories',
    'III': '3i Group',
    'PLTR': 'Palantir',
    'QBTS': 'D-Wave Quantum',
    'RGTI': 'Rigetti Computing',
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      {/* Top row: Additional Information, Stock Fundamentals, and Earnings Calendar */}
      {(stockEntry.company_profile || (stockEntry.earnings_calendar && stockEntry.earnings_calendar.length > 0)) && (
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {stockEntry.company_profile && (
              <CompanyInfoCard
                ticker={selectedStock}
                companyName={stockEntry.company_profile.name}
                logo={stockEntry.company_profile.logo}
                industry={stockEntry.company_profile.industry}
                sector={stockEntry.company_profile.sector}
                subSector={stockEntry.company_profile.subSector}
                country={stockEntry.company_profile.country}
                marketCapitalization={stockEntry.company_profile.marketCapitalization}
                currency={stockEntry.company_profile.currency}
                weburl={stockEntry.company_profile.weburl}
                assets={stockEntry.company_profile.assets}
                liabilities={stockEntry.company_profile.liabilities}
                floatShares={stock.floatShares}
                averageVolume={stock.averageVolume}
                averageVolume10Day={stock.averageVolume10Day}
                sharesOutstanding={stock.sharesOutstanding}
              />
            )}
            <StockDetailsCard
              ticker={selectedStock}
              marketCap={stock.market_cap}
              peRatio={stock.pe_ratio}
              roe={stock.roe}
              profitMargin={stock.profit_margin}
              pbRatio={stock.pb_ratio}
              debtToEquity={stock.debt_to_equity}
              dividendYield={stock.dividend_yield}
              beta={stock.beta}
              averageVolume10Day={stock.averageVolume10Day}
            />
            {stockEntry.earnings_calendar && stockEntry.earnings_calendar.length > 0 && (
              <EarningsCalendarCard
                ticker={selectedStock}
                earnings={stockEntry.earnings_calendar}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Two Column Layout: Price Chart (larger) and Social Sentiment (smaller) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '2fr 1fr',
          },
          gap: 2,
        }}
      >
        {/* Block 1: Price Chart */}
        <Box>
          {/* Price History Chart with 52 Week Range */}
          {stock.price_movement_30_days && stock.price_movement_30_days.length > 0 && (
            <PriceHistoryChart
              data={stock.price_movement_30_days}
              ticker={selectedStock}
              currentPrice={stock.current_price || 0}
              priceChange={stock.change || 0}
              priceChangePercent={stock.change_percent || 0}
              weekLow52={stock['52_week_low']}
              weekHigh52={stock['52_week_high']}
              volume={stock.volume}
            />
          )}
        </Box>

        {/* Block 2: Social Sentiment */}
        <Box>
          <SocialSentimentCard
            ticker={selectedStock}
            sentiment={stockEntry.social_sentiment}
          />
        </Box>
      </Box>

      {/* Earnings Surprises, Recommendation Trends, and Market News Section */}
      {(stockEntry.earnings_surprises && stockEntry.earnings_surprises.length > 0) ||
        (stockEntry.recommendation_trends && stockEntry.recommendation_trends.length > 0) ||
        (stockEntry.latest_news && stockEntry.latest_news.length > 0) ? (
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {/* Earnings Surprises */}
            {stockEntry.earnings_surprises && stockEntry.earnings_surprises.length > 0 && (
              <EarningsSurprisesCard
                ticker={selectedStock}
                surprises={stockEntry.earnings_surprises}
              />
            )}

            {/* Recommendation Trends */}
            {stockEntry.recommendation_trends && stockEntry.recommendation_trends.length > 0 && (
              <RecommendationTrendsCard
                ticker={selectedStock}
                trends={stockEntry.recommendation_trends}
              />
            )}

            {/* Market News */}
            {stockEntry.latest_news && stockEntry.latest_news.length > 0 && (
              <MarketNewsCard
                ticker={selectedStock}
                articles={stockEntry.latest_news}
              />
            )}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
