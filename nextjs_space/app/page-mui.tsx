'use client';

import { useState } from 'react';
import { Box, Grid, Container, Typography, Stack, Chip } from '@mui/material';
import { MUIThemeProvider } from '@/theme/MUIThemeProvider';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StockOverviewCard } from '@/components/StockOverviewCard';
import { FinancialMetricsGrid } from '@/components/FinancialMetricsGrid';
import { PriceChartMUI } from '@/components/PriceChartMUI';

// Mock data for demonstration (replace with real data fetch)
const MOCK_STOCKS = [
  { ticker: 'GOOG', company: 'Alphabet Inc.', change_percent: 1.45 },
  { ticker: 'TSLA', company: 'Tesla, Inc.', change_percent: -2.31 },
  { ticker: 'NVDA', company: 'Nvidia Corporation', change_percent: 3.24 },
  { ticker: 'AMZN', company: 'Amazon.com Inc.', change_percent: 0.87 },
  { ticker: 'BRK-B', company: 'Berkshire Hathaway Inc.', change_percent: 0.15 },
  { ticker: 'ISRG', company: 'Intuitive Surgical Inc.', change_percent: -1.02 },
  { ticker: 'NFLX', company: 'Netflix Inc.', change_percent: 2.14 },
  { ticker: 'IDXX', company: 'IDEXX Laboratories Inc.', change_percent: -0.45 },
  { ticker: 'III', company: '3i Group plc', change_percent: 1.33 },
  { ticker: 'PLTR', company: 'Palantir Technologies Inc.', change_percent: 5.67 },
  { ticker: 'QBTS', company: 'D-Wave Quantum Inc.', change_percent: -3.21 },
  { ticker: 'RGTI', company: 'Rigetti Computing Inc.', change_percent: 4.89 },
];

const MOCK_STOCK_DATA = {
  GOOG: {
    current_price: 142.65,
    change: 2.05,
    change_percent: 1.45,
    volume: 24589000,
    market_cap: 1780000000000,
    high_52_week: 151.24,
    low_52_week: 121.46,
  },
};

const MOCK_METRICS = {
  pe_ratio: 28.5,
  pb_ratio: 6.2,
  ps_ratio: 5.8,
  pcf_ratio: 22.3,
  roe: 29.4,
  roa: 15.2,
  roi: 18.7,
  gross_margin: 56.9,
  operating_margin: 28.3,
  profit_margin: 23.1,
  debt_to_equity: 0.12,
  current_ratio: 2.8,
  quick_ratio: 2.5,
  revenue_growth: 13.6,
  earnings_growth: 17.2,
  dividend_yield: 0,
  payout_ratio: 0,
  beta: 1.05,
  eps: 5.02,
  book_value: 23.15,
};

const MOCK_PRICE_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  Date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
  Close: 140 + Math.random() * 10,
}));

export default function DashboardPage() {
  const [selectedStock, setSelectedStock] = useState('GOOG');

  const currentStock = MOCK_STOCK_DATA[selectedStock as keyof typeof MOCK_STOCK_DATA] || MOCK_STOCK_DATA.GOOG;
  const stockInfo = MOCK_STOCKS.find(s => s.ticker === selectedStock) || MOCK_STOCKS[0];

  return (
    <MUIThemeProvider>
      <DashboardLayout
        selectedStock={selectedStock}
        onStockSelect={setSelectedStock}
        stocks={MOCK_STOCKS}
      >
        <Container maxWidth={false} disableGutters>
          {/* Header Section */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {stockInfo.company}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time market data and financial analysis
              </Typography>
            </Box>
            <Chip
              label="Live Data"
              color="success"
              variant="outlined"
              size="small"
            />
          </Stack>

          {/* Top Row: Price Overview & Chart */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={4}>
              <StockOverviewCard
                ticker={selectedStock}
                company={stockInfo.company}
                {...currentStock}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <PriceChartMUI
                data={MOCK_PRICE_HISTORY}
                ticker={selectedStock}
              />
            </Grid>
          </Grid>

          {/* Financial Metrics Grid */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FinancialMetricsGrid metrics={MOCK_METRICS} />
            </Grid>
          </Grid>
        </Container>
      </DashboardLayout>
    </MUIThemeProvider>
  );
}
