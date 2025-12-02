'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import BarChartIcon from '@mui/icons-material/BarChart';

interface StockDetailsCardProps {
  ticker: string;
  marketCap?: number;
  peRatio?: number;
  roe?: number;
  profitMargin?: number;
  debtToEquity?: number;
  dividendYield?: number;
  pbRatio?: number;
  beta?: number;
  averageVolume10Day?: number | null;
  returnOnAssets?: number | null;
  quarterlyRevenueGrowth?: number | null;
  quarterlyEarningsGrowth?: number | null;
  priceToSales?: number | null;
}

export default function StockDetailsCard({
  ticker,
  marketCap,
  peRatio,
  roe,
  profitMargin,
  debtToEquity,
  dividendYield,
  pbRatio,
  beta,
  averageVolume10Day,
  returnOnAssets,
  quarterlyRevenueGrowth,
  quarterlyEarningsGrowth,
  priceToSales,
}: StockDetailsCardProps) {
  const valuationMetrics = [
    { label: 'P/E Ratio', value: peRatio ? peRatio.toFixed(0) : 'N/A' },
    { label: 'P/B Ratio', value: pbRatio ? pbRatio.toFixed(0) : 'N/A' },
    { label: 'Price/Sales (ttm)', value: priceToSales ? priceToSales.toFixed(0) : 'N/A' },
    { label: 'Beta', value: beta ? beta.toFixed(0) : 'N/A' },
  ];

  const profitabilityMetrics = [
    { label: 'ROE', value: roe ? `${roe.toFixed(0)}%` : 'N/A' },
    { label: 'Return on Assets (ttm)', value: returnOnAssets ? `${returnOnAssets.toFixed(0)}%` : 'N/A' },
    { label: 'Profit Margin', value: profitMargin ? `${profitMargin.toFixed(0)}%` : 'N/A' },
  ];

  const growthMetrics = [
    { label: 'Quarterly Revenue Growth (yoy)', value: quarterlyRevenueGrowth ? `${quarterlyRevenueGrowth.toFixed(0)}%` : 'N/A' },
    { label: 'Quarterly Earnings Growth (yoy)', value: quarterlyEarningsGrowth ? `${quarterlyEarningsGrowth.toFixed(0)}%` : 'N/A' },
  ];

  const financialHealthMetrics = [
    { label: 'Total Debt/Equity (mrq)', value: debtToEquity ? debtToEquity.toFixed(0) : 'N/A' },
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <BarChartIcon sx={{ color: 'primary.main' }} />
          <Typography component="h2" variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Stock Fundamentals
          </Typography>
        </Stack>

        {/* Valuation Pillar */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            sx={{
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: 1,
              mb: 2,
              display: 'block',
            }}
          >
            VALUATION
          </Typography>
          <Stack spacing={2}>
            {valuationMetrics.map((detail, index) => (
              <Stack
                key={index}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  pb: index < valuationMetrics.length - 1 ? 1.5 : 0,
                  borderBottom: index < valuationMetrics.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {detail.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {detail.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Profitability Pillar */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            sx={{
              color: 'success.main',
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: 1,
              mb: 2,
              display: 'block',
            }}
          >
            PROFITABILITY
          </Typography>
          <Stack spacing={2}>
            {profitabilityMetrics.map((detail, index) => (
              <Stack
                key={index}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  pb: index < profitabilityMetrics.length - 1 ? 1.5 : 0,
                  borderBottom: index < profitabilityMetrics.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {detail.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {detail.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Growth Pillar */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            sx={{
              color: 'info.main',
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: 1,
              mb: 2,
              display: 'block',
            }}
          >
            GROWTH
          </Typography>
          <Stack spacing={2}>
            {growthMetrics.map((detail, index) => (
              <Stack
                key={index}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  pb: index < growthMetrics.length - 1 ? 1.5 : 0,
                  borderBottom: index < growthMetrics.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {detail.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {detail.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Financial Health Pillar */}
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: 'warning.main',
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: 1,
              mb: 2,
              display: 'block',
            }}
          >
            FINANCIAL HEALTH
          </Typography>
          <Stack spacing={2}>
            {financialHealthMetrics.map((detail, index) => (
              <Stack
                key={index}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {detail.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {detail.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
