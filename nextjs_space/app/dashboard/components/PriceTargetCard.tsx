'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface PriceTargetCardProps {
  ticker: string;
  currentPrice: number;
  targetHigh?: number;
  targetLow?: number;
  targetMean?: number;
  targetMedian?: number;
}

export default function PriceTargetCard({
  ticker,
  currentPrice,
  targetHigh,
  targetLow,
  targetMean,
  targetMedian,
}: PriceTargetCardProps) {
  const target = targetMean || targetMedian;
  const upside = target ? ((target - currentPrice) / currentPrice) * 100 : null;

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <GpsFixedIcon sx={{ color: 'primary.main' }} />
          <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
            Price Target
          </Typography>
        </Stack>

        {target ? (
          <Stack spacing={2}>
            {/* Main Target */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: 'action.hover',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                Analyst Target {targetMean ? '(Mean)' : '(Median)'}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                ${target.toFixed(2)}
              </Typography>
              {upside !== null && (
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                  {upside >= 0 ? (
                    <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1.2rem' }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: 'error.main', fontSize: '1.2rem' }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      color: upside >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 600,
                    }}
                  >
                    {upside >= 0 ? '+' : ''}{upside.toFixed(2)}% upside
                  </Typography>
                </Stack>
              )}
            </Box>

            {/* Range */}
            {targetLow !== undefined && targetHigh !== undefined && (
              <Stack direction="row" spacing={2}>
                <Box flex={1}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Low
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    ${targetLow.toFixed(2)}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    High
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    ${targetHigh.toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            )}

            {/* Current Price Reference */}
            <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Current Price
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ${currentPrice.toFixed(2)}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No price target data available
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
