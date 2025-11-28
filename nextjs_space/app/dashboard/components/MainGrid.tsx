'use client';

import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatCard, { StatCardProps } from './StatCard';
import PriceHistoryChart from './PriceHistoryChart';
import StockDetailsCard from './StockDetailsCard';
import ProsConsCard from './ProsConsCard';
import SocialSentimentCard from './SocialSentimentCard';
import CompanyInfoCard from './CompanyInfoCard';
import MarketNewsCard from './MarketNewsCard';
import RecommendationTrendsCard from './RecommendationTrendsCard';
import PriceTargetCard from './PriceTargetCard';
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

  // Generate stat cards data - only Volume now
  const statCards: StatCardProps[] = [
    {
      title: 'Volume',
      value: `${((stock.volume || 0) / 1e6).toFixed(2)}M`,
      interval: 'Today',
      trend: 'up',
      data: Array.from({ length: 15 }, (_, i) => (stock.volume || 0) / 1e6 + Math.random() * 5),
    },
  ];

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
        {/* Block 1: Price Chart and Volume */}
        <Stack spacing={2}>
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

          {/* Volume Card */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 2,
            }}
          >
            {statCards.map((card, index) => (
              <StatCard key={index} {...card} />
            ))}
          </Box>
        </Stack>

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

        {/* Block 3: Social Sentiment and Pros & Cons */}
        <Stack spacing={2}>
          {/* Social Sentiment */}
          <SocialSentimentCard
            ticker={selectedStock}
            sentiment={stockEntry.social_sentiment}
          />

          {/* Pros & Cons */}
          <ProsConsCard
            ticker={selectedStock}
            pros={stockEntry.pros}
            cons={stockEntry.cons}
          />
        </Stack>
      </Box>

      {/* Additional Information Section */}
      <Box sx={{ mt: 3 }}>
        <Typography component="h3" variant="h6" sx={{ mb: 2 }}>
          Additional Information
        </Typography>

        {/* Two Column Layout for Additional Info */}
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
          {/* Company Info */}
          {stockEntry.company_profile && (
            <CompanyInfoCard
              ticker={selectedStock}
              companyName={stockEntry.company_profile.name}
              logo={stockEntry.company_profile.logo}
              industry={stockEntry.company_profile.industry}
              sector={stockEntry.company_profile.sector}
              subSector={stockEntry.company_profile.subSector}
            />
          )}

          {/* Price Target */}
          {stockEntry.price_target && (
            <PriceTargetCard
              ticker={selectedStock}
              currentPrice={stock.current_price || 0}
              targetHigh={stockEntry.price_target.targetHigh}
              targetLow={stockEntry.price_target.targetLow}
              targetMean={stockEntry.price_target.targetMean}
              targetMedian={stockEntry.price_target.targetMedian}
            />
          )}

          {/* Market News */}
          {stockEntry.latest_news && stockEntry.latest_news.length > 0 && (
            <MarketNewsCard
              ticker={selectedStock}
              articles={stockEntry.latest_news}
            />
          )}

          {/* Earnings Calendar */}
          {stockEntry.earnings_calendar && stockEntry.earnings_calendar.length > 0 && (
            <EarningsCalendarCard
              ticker={selectedStock}
              earnings={stockEntry.earnings_calendar}
            />
          )}
        </Box>

        {/* Full Width for Recommendation Trends */}
        {stockEntry.recommendation_trends && stockEntry.recommendation_trends.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <RecommendationTrendsCard
              ticker={selectedStock}
              trends={stockEntry.recommendation_trends}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
