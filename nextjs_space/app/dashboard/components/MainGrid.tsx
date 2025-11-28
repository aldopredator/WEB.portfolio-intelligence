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
      {/* Header */}
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        {companyNameMap[selectedStock] || selectedStock} ({selectedStock})
      </Typography>

      {/* Additional Information Section - Company Info */}
      {stockEntry.company_profile && (
        <Box sx={{ mb: 3 }}>
          <Typography component="h3" variant="h6" sx={{ mb: 2 }}>
            Additional Information
          </Typography>
          <CompanyInfoCard
            ticker={selectedStock}
            companyName={stockEntry.company_profile.name}
            logo={stockEntry.company_profile.logo}
            industry={stockEntry.company_profile.industry}
            sector={stockEntry.company_profile.sector}
            subSector={stockEntry.company_profile.subSector}
          />
        </Box>
      )}

      {/* Three Column Layout: Equal widths */}
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
        {/* Block 1: Price Chart (full height) */}
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
            />
          )}
        </Box>

        {/* Block 2: Stock Details (middle column) */}
        <Box>
          <StockDetailsCard
            ticker={selectedStock}
            marketCap={stock.market_cap}
            peRatio={(stockEntry as any).pe_ratio}
            roe={(stockEntry as any).roe}
            profitMargin={(stockEntry as any).profit_margin}
            pbRatio={(stockEntry as any).pb_ratio}
            debtToEquity={(stockEntry as any).debt_to_equity}
            dividendYield={(stockEntry as any).dividend_yield}
          />
        </Box>

        {/* Block 3: Social Sentiment and Market News */}
        <Stack spacing={2}>
          {/* Social Sentiment */}
          <SocialSentimentCard
            ticker={selectedStock}
            sentiment={stockEntry.social_sentiment}
          />

          {/* Market News */}
          {stockEntry.latest_news && stockEntry.latest_news.length > 0 && (
            <MarketNewsCard
              ticker={selectedStock}
              articles={stockEntry.latest_news}
            />
          )}
        </Stack>
      </Box>

      {/* Earnings and Recommendation Trends Section */}
      {((stockEntry.earnings_calendar && stockEntry.earnings_calendar.length > 0) ||
        (stockEntry.recommendation_trends && stockEntry.recommendation_trends.length > 0)) && (
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: 'repeat(2, 1fr)',
              },
              gap: 2,
            }}
          >
            {/* Earnings Calendar */}
            {stockEntry.earnings_calendar && stockEntry.earnings_calendar.length > 0 && (
              <EarningsCalendarCard
                ticker={selectedStock}
                earnings={stockEntry.earnings_calendar}
              />
            )}

            {/* Recommendation Trends */}
            {stockEntry.recommendation_trends && stockEntry.recommendation_trends.length > 0 && (
              <RecommendationTrendsCard
                ticker={selectedStock}
                trends={stockEntry.recommendation_trends}
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
