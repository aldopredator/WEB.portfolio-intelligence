'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Stack, Chip, Card, CardContent, Skeleton } from '@mui/material';
import { DashboardLayoutCRUD } from '@/app/components/DashboardLayoutCRUD';
import { StockOverviewCard } from '@/app/components/StockOverviewCard';
import { FinancialMetricsGrid } from '@/app/components/FinancialMetricsGrid';
import { PriceChartMUI } from '@/app/components/PriceChartMUI';

interface StockData {
  ticker: string;
  company: string;
  current_price?: number;
  change?: number;
  change_percent?: number;
  volume?: number;
  market_cap?: number;
  high_52_week?: number;
  low_52_week?: number;
  price_movement_30_days?: Array<{ Date: string; Close: number }>;
  [key: string]: any;
}

export default function CRUDDashboard() {
  const [selectedStock, setSelectedStock] = useState('GOOG');
  const [stocksData, setStocksData] = useState<Record<string, StockData>>({});
  const [loading, setLoading] = useState(true);

  // Fetch stock data on mount
  useEffect(() => {
    fetch('/api/stocks')
      .then((res) => res.json())
      .then((data) => {
        setStocksData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching stock data:', error);
        setLoading(false);
      });
  }, []);

  // Prepare stocks list for sidebar
  const stocks = Object.entries(stocksData).map(([ticker, data]) => {
    const stockData = data.stock_data || data;
    return {
      ticker,
      company: stockData.company || data.company || ticker,
      change_percent: stockData.change_percent,
    };
  });

  // Get current stock data
  const stockEntry = stocksData[selectedStock] || {};
  const currentStockData = stockEntry.stock_data || stockEntry;
  const stockInfo = stocks.find((s) => s.ticker === selectedStock) || {
    ticker: selectedStock,
    company: selectedStock,
  };

  // Extract metrics for FinancialMetricsGrid
  const metrics = {
    pe_ratio: stockEntry.pe_ratio || currentStockData.pe_ratio,
    pb_ratio: stockEntry.pb_ratio || currentStockData.pb_ratio,
    ps_ratio: stockEntry.ps_ratio || currentStockData.ps_ratio,
    pcf_ratio: stockEntry.pcf_ratio || currentStockData.pcf_ratio,
    roe: stockEntry.roe || currentStockData.roe,
    roa: stockEntry.roa || currentStockData.roa,
    roi: stockEntry.roi || currentStockData.roi,
    gross_margin: stockEntry.gross_margin || currentStockData.gross_margin,
    operating_margin: stockEntry.operating_margin || currentStockData.operating_margin,
    profit_margin: stockEntry.profit_margin || currentStockData.profit_margin,
    debt_to_equity: stockEntry.debt_to_equity || currentStockData.debt_to_equity,
    current_ratio: stockEntry.current_ratio || currentStockData.current_ratio,
    quick_ratio: stockEntry.quick_ratio || currentStockData.quick_ratio,
    revenue_growth: stockEntry.revenue_growth || currentStockData.revenue_growth,
    earnings_growth: stockEntry.earnings_growth || currentStockData.earnings_growth,
    dividend_yield: stockEntry.dividend_yield || currentStockData.dividend_yield,
    payout_ratio: stockEntry.payout_ratio || currentStockData.payout_ratio,
    beta: stockEntry.beta || currentStockData.beta,
    eps: stockEntry.eps || currentStockData.eps,
    book_value: stockEntry.book_value || currentStockData.book_value,
  };

  const priceHistory = stockEntry.price_movement_30_days || [];

  if (loading) {
    return (
      <DashboardLayoutCRUD
        selectedStock={selectedStock}
        onStockSelect={setSelectedStock}
        stocks={[]}
        title={selectedStock}
      >
        <Box>
          <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
            <Skeleton variant="rectangular" height={300} />
            <Skeleton variant="rectangular" height={300} />
          </Box>
        </Box>
      </DashboardLayoutCRUD>
    );
  }

  return (
    <DashboardLayoutCRUD
      selectedStock={selectedStock}
      onStockSelect={setSelectedStock}
      stocks={stocks}
      title={selectedStock}
    >
      <Box>
        {/* Header Section */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {stockInfo.company}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time market data and financial analysis
            </Typography>
          </Box>
          <Chip label="Live Data" color="success" variant="outlined" size="small" />
        </Stack>

        {/* Overview and Chart Row */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' },
            gap: 3,
            mb: 3,
          }}
        >
          <StockOverviewCard
            ticker={selectedStock}
            company={stockInfo.company}
            current_price={currentStockData.current_price}
            change={currentStockData.change}
            change_percent={currentStockData.change_percent}
            volume={currentStockData.volume}
            market_cap={currentStockData.market_cap}
            high_52_week={currentStockData.high_52_week || currentStockData['52_week_high']}
            low_52_week={currentStockData.low_52_week || currentStockData['52_week_low']}
          />
          
          {priceHistory && priceHistory.length > 0 ? (
            <PriceChartMUI data={priceHistory} ticker={selectedStock} />
          ) : (
            <Card elevation={0} sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="text.secondary">
                  Price chart data not available
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Financial Metrics */}
        <Box>
          <FinancialMetricsGrid metrics={metrics} />
        </Box>
      </Box>
    </DashboardLayoutCRUD>
  );
}
