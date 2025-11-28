'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

interface StockOverviewCardProps {
  ticker: string;
  company: string;
  current_price?: number;
  change?: number;
  change_percent?: number;
  volume?: number;
  market_cap?: number;
  high_52_week?: number;
  low_52_week?: number;
}

export function StockOverviewCard({
  ticker,
  company,
  current_price = 0,
  change = 0,
  change_percent = 0,
  volume = 0,
  market_cap = 0,
  high_52_week = 0,
  low_52_week = 0,
}: StockOverviewCardProps) {
  const isPositive = change_percent >= 0;
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <Card elevation={0} sx={{ height: '100%' }}>
      <CardContent>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {ticker}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {company}
            </Typography>
          </Box>
          <Chip
            label={`${isPositive ? '+' : ''}${change_percent.toFixed(2)}%`}
            icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
            color={isPositive ? 'success' : 'error'}
            sx={{ fontWeight: 600, fontSize: '0.875rem' }}
          />
        </Stack>

        {/* Current Price */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            {formatPrice(current_price)}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              variant="body1"
              color={isPositive ? 'success.main' : 'error.main'}
              fontWeight={600}
            >
              {isPositive ? '+' : ''}{formatPrice(change)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              today
            </Typography>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Key Metrics */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Market Cap
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatNumber(market_cap)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Volume
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {volume.toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              52W High
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatPrice(high_52_week)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              52W Low
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatPrice(low_52_week)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
