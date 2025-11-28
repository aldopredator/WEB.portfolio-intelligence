'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

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
  averageVolume10Day?: number;
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
}: StockDetailsCardProps) {
  const valuationMetrics = [
    { label: 'P/E Ratio', value: peRatio?.toFixed(2) || 'N/A' },
    { label: 'P/B Ratio', value: pbRatio?.toFixed(2) || 'N/A' },
    { label: 'Beta', value: beta?.toFixed(2) || 'N/A' },
  ];

  const profitabilityMetrics = [
    { label: 'ROE', value: roe ? `${roe.toFixed(2)}%` : 'N/A%' },
    { label: 'Profit Margin', value: profitMargin ? `${profitMargin.toFixed(2)}%` : 'N/A%' },
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="h6" sx={{ mb: 3, fontSize: '1.25rem', fontWeight: 700 }}>
          Stock Fundamentals
        </Typography>

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
      </CardContent>
    </Card>
  );
}
