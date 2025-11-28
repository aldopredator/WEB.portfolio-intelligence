'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

interface StockDetailsCardProps {
  ticker: string;
  peRatio?: number;
  roe?: number;
  profitMargin?: number;
  debtToEquity?: number;
  dividendYield?: number;
  pbRatio?: number;
}

export default function StockDetailsCard({
  ticker,
  peRatio,
  roe,
  profitMargin,
  debtToEquity,
  dividendYield,
  pbRatio,
}: StockDetailsCardProps) {
  const details = [
    { label: 'P/E Ratio', value: peRatio?.toFixed(2) || 'N/A' },
    { label: 'ROE', value: roe ? `${roe.toFixed(2)}%` : 'N/A%' },
    { label: 'Profit Margin', value: profitMargin ? `${profitMargin.toFixed(2)}%` : 'N/A%' },
    { label: 'P/B Ratio', value: pbRatio?.toFixed(2) || 'N/A' },
    { label: 'D/E Ratio', value: debtToEquity?.toFixed(2) || 'N/A' },
    { label: 'Dividend Yield', value: dividendYield ? `${dividendYield.toFixed(2)}%` : 'N/A%' },
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="h6" sx={{ mb: 3, fontSize: '1.5rem', fontWeight: 700 }}>
          Stock Details
        </Typography>
        <Stack spacing={3}>
          {details.map((detail, index) => (
            <Stack
              key={index}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                pb: 2,
                borderBottom: index < details.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Typography variant="h6" sx={{ fontSize: '1.25rem', color: 'text.secondary' }}>
                {detail.label}
              </Typography>
              <Typography variant="h5" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {detail.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
