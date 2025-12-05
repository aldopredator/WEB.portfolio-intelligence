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
  priceToSales?: number | null;
  enterpriseToRevenue?: number | null;
  enterpriseToEbitda?: number | null;
  trailingPE?: number | null;
  forwardPE?: number | null;
  priceToBook?: number | null;
  debtToEquity?: number;
}

export default function StockDetailsCard({
  ticker,
  priceToSales,
  enterpriseToRevenue,
  enterpriseToEbitda,
  trailingPE,
  forwardPE,
  priceToBook,
  debtToEquity,
}: StockDetailsCardProps) {
  const valuationMetrics = [
    { label: 'Price/Sales', value: priceToSales ? priceToSales.toFixed(0) : 'N/A', rawValue: priceToSales },
    { label: 'Trailing P/E', value: trailingPE ? trailingPE.toFixed(0) : 'N/A', rawValue: trailingPE },
    { label: 'Price/Book', value: priceToBook ? priceToBook.toFixed(0) : 'N/A', rawValue: priceToBook },
    { label: 'Forward P/E', value: forwardPE ? forwardPE.toFixed(0) : 'N/A', rawValue: forwardPE },
    { label: 'Total Debt/Equity', value: debtToEquity ? debtToEquity.toFixed(0) : 'N/A', rawValue: debtToEquity },
    { label: 'Enterprise Value/Revenue', value: enterpriseToRevenue ? enterpriseToRevenue.toFixed(0) : 'N/A', rawValue: enterpriseToRevenue },
    { label: 'Enterprise Value/EBITDA', value: enterpriseToEbitda ? enterpriseToEbitda.toFixed(0) : 'N/A', rawValue: enterpriseToEbitda },
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <BarChartIcon sx={{ color: 'primary.main' }} />
          <Typography component="h2" variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Stock Multipliers
          </Typography>
        </Stack>

        {/* Multipliers Section */}
        <Box>
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
            STOCK MULTIPLIERS
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
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      color: detail.rawValue && detail.rawValue < 0 ? 'error.main' : 'inherit'
                    }}
                  >
                    {detail.value}
                  </Typography>
                  {detail.rawValue && detail.rawValue < 0 && (
                    <Box sx={{ color: 'error.main', fontSize: '1.2rem' }}>⚠️</Box>
                  )}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
