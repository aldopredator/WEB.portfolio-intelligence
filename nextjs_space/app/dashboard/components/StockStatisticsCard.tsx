'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface StockStatisticsCardProps {
  ticker: string;
  roe?: number;
  returnOnAssets?: number | null;
  profitMargin?: number;
  quarterlyRevenueGrowth?: number | null;
  quarterlyEarningsGrowth?: number | null;
}

export default function StockStatisticsCard({
  ticker,
  roe,
  returnOnAssets,
  profitMargin,
  quarterlyRevenueGrowth,
  quarterlyEarningsGrowth,
}: StockStatisticsCardProps) {
  const profitabilityMetrics = [
    { label: 'ROE', value: roe ? `${roe.toFixed(0)}%` : 'N/A' },
    { label: 'Return on Assets', value: returnOnAssets ? `${returnOnAssets.toFixed(0)}%` : 'N/A' },
    { label: 'Profit Margin', value: profitMargin ? `${profitMargin.toFixed(0)}%` : 'N/A' },
  ];

  const growthMetrics = [
    { label: 'Quarterly Revenue Growth (yoy)', value: quarterlyRevenueGrowth ? `${quarterlyRevenueGrowth.toFixed(0)}%` : 'N/A' },
    { label: 'Quarterly Earnings Growth (yoy)', value: quarterlyEarningsGrowth ? `${quarterlyEarningsGrowth.toFixed(0)}%` : 'N/A' },
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <TrendingUpIcon sx={{ color: 'primary.main' }} />
          <Typography component="h2" variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Stock Ratios
          </Typography>
        </Stack>

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
      </CardContent>
    </Card>
  );
}
