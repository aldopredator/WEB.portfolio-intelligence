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
      {/* Stat Cards */}
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        {companyNameMap[selectedStock] || selectedStock} ({selectedStock})
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(1, 1fr)',
            lg: 'repeat(1, 1fr)',
          },
          gap: 2,
          mb: 2,
          maxWidth: '300px',
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
        </Stack>

        {/* Right Column: Social Sentiment, Stock Details, Pros & Cons */}
        <Stack spacing={2}>
          {/* Social Sentiment - moved higher */}
          <SocialSentimentCard
            ticker={selectedStock}
            sentiment={stockEntry.social_sentiment}
          />

          {/* Stock Details with Market Cap */}
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

          {/* Pros & Cons */}
          <ProsConsCard
            ticker={selectedStock}
            pros={stockEntry.pros}
            cons={stockEntry.cons}
          />
        </Stack>
      </Box>
    </Box>
  );
}
