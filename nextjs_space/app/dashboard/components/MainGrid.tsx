'use client';

import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatCard, { StatCardProps } from './StatCard';
import PriceHistoryChart from './PriceHistoryChart';
import MetricsBarChart from './MetricsBarChart';
import StockDetailsCard from './StockDetailsCard';
import ProsConsCard from './ProsConsCard';
import SocialSentimentCard from './SocialSentimentCard';
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

  // Generate stat cards data
  const statCards: StatCardProps[] = [
    {
      title: 'Current Price',
      value: `$${stock.current_price?.toFixed(2) || '0.00'}`,
      interval: 'Live',
      trend: (stock.change_percent || 0) >= 0 ? 'up' : 'down',
      data: stock.price_movement_30_days?.slice(-15).map(d => d.Close) || [],
      ticker: selectedStock,
    },
    {
      title: 'Market Cap',
      value: `$${((stock.market_cap || 0) / 1e9).toFixed(2)}B`,
      interval: 'Total',
      trend: 'neutral',
      data: Array.from({ length: 15 }, (_, i) => (stock.market_cap || 0) / 1e9 + Math.random() * 10),
    },
    {
      title: 'Volume',
      value: `${((stock.volume || 0) / 1e6).toFixed(2)}M`,
      interval: 'Today',
      trend: 'up',
      data: Array.from({ length: 15 }, (_, i) => (stock.volume || 0) / 1e6 + Math.random() * 5),
    },
    {
      title: '52 Week Range',
      value: `$${stock['52_week_low']?.toFixed(0) || '0'} - $${stock['52_week_high']?.toFixed(0) || '0'}`,
      interval: 'Range',
      trend: 'neutral',
      data: stock.price_movement_30_days?.slice(-15).map(d => d.Close) || [],
    },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      {/* Stat Cards */}
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        {selectedStock} Overview
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2,
          mb: 2,
        }}
      >
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </Box>

      {/* Two Column Layout: Charts on Left, Details on Right */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '1fr 500px',
          },
          gap: 2,
        }}
      >
        {/* Left Column: Charts */}
        <Stack spacing={2}>
          {/* Price History Chart */}
          {stock.price_movement_30_days && stock.price_movement_30_days.length > 0 && (
            <PriceHistoryChart
              data={stock.price_movement_30_days}
              ticker={selectedStock}
              currentPrice={stock.current_price || 0}
              priceChange={stock.change || 0}
              priceChangePercent={stock.change_percent || 0}
            />
          )}

          {/* Financial Metrics Bar Chart */}
          <MetricsBarChart
            ticker={selectedStock}
            metrics={{
              pe_ratio: (stockEntry as any).pe_ratio,
              pb_ratio: (stockEntry as any).pb_ratio,
              roe: (stockEntry as any).roe,
              profit_margin: (stockEntry as any).profit_margin,
              debt_to_equity: (stockEntry as any).debt_to_equity,
              dividend_yield: (stockEntry as any).dividend_yield,
            }}
          />
        </Stack>

        {/* Right Column: Stock Details, Pros & Cons, Sentiment */}
        <Stack spacing={2}>
          {/* Stock Details */}
          <StockDetailsCard
            ticker={selectedStock}
            peRatio={(stockEntry as any).pe_ratio}
            roe={(stockEntry as any).roe}
            profitMargin={(stockEntry as any).profit_margin}
            pbRatio={(stockEntry as any).pb_ratio}
            debtToEquity={(stockEntry as any).debt_to_equity}
            dividendYield={(stockEntry as any).dividend_yield}
          />

          {/* Pros & Cons */}
          <ProsConsCard
            ticker={selectedStock}
            pros={stockEntry.pros}
            cons={stockEntry.cons}
          />

          {/* Social Sentiment */}
          <SocialSentimentCard
            ticker={selectedStock}
            sentiment={stockEntry.social_sentiment}
          />
        </Stack>
      </Box>
    </Box>
  );
}
