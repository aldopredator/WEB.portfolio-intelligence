'use client';

import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { LineChart } from '@mui/x-charts/LineChart';

function AreaGradient({ color, id }: { color: string; id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

interface PriceHistoryChartProps {
  data: Array<{ Date: string; Close: number }>;
  ticker: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  weekLow52?: number;
  weekHigh52?: number;
}

export default function PriceHistoryChart({
  data,
  ticker,
  currentPrice,
  priceChange,
  priceChangePercent,
  weekLow52,
  weekHigh52,
}: PriceHistoryChartProps) {
  const theme = useTheme();

  // Format dates as "Day Month" (e.g., "1 Nov", "15 Nov")
  const dates = data.map((d) => {
    const date = new Date(d.Date);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${day} ${month}`;
  });
  const prices = data.map((d) => d.Close);

  // Calculate dynamic Y-axis range to emphasize price movements
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1; // 10% padding
  const yMin = Math.floor(minPrice - padding);
  const yMax = Math.ceil(maxPrice + padding);

  const colorPalette = [
    theme.palette.primary.light,
    theme.palette.primary.main,
    theme.palette.primary.dark,
  ];

  const isPositive = priceChange >= 0;

  // Determine currency symbol ($ for USD, £ for GBP, € for EUR)
  const currencySymbol = '$'; // Default to USD, can be made dynamic based on ticker

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack
            direction="row"
            sx={{
              alignContent: { xs: 'center', sm: 'flex-start' },
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="h4" component="p">
              ${currentPrice.toFixed(2)}
            </Typography>
            <Chip
              size="small"
              color={isPositive ? 'success' : 'error'}
              label={`${isPositive ? '+' : ''}${priceChangePercent.toFixed(2)}%`}
            />
          </Stack>
        </Stack>

        {/* 52 Week Range Section */}
        {weekLow52 !== undefined && weekHigh52 !== undefined && (
          <Stack
            direction="row"
            spacing={2}
            sx={{
              mt: 2,
              mb: 2,
              p: 2,
              backgroundColor: 'action.hover',
              borderRadius: 1,
              justifyContent: 'center',
            }}
          >
            <Stack alignItems="center">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                52 Week Range
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                ${weekLow52.toFixed(0)} - ${weekHigh52.toFixed(0)}
              </Typography>
            </Stack>
          </Stack>
        )}

        <LineChart
          colors={colorPalette}
          xAxis={[
            {
              scaleType: 'point',
              data: dates,
              tickInterval: (index, i) => (i + 1) % 5 === 0,
            },
          ]}
          yAxis={[
            {
              min: yMin,
              max: yMax,
              valueFormatter: (value) => `${currencySymbol}${value.toFixed(0)}`,
            },
          ]}
          series={[
            {
              id: 'price',
              label: 'Price',
              showMark: false,
              curve: 'linear',
              area: true,
              data: prices,
            },
          ]}
          height={300}
          margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
          slotProps={{
            legend: { hidden: true },
          }}
          sx={{
            '& .MuiAreaElement-series-price': {
              fill: "url('#price-gradient')",
            },
          }}
        >
          <AreaGradient color={theme.palette.primary.main} id="price-gradient" />
        </LineChart>
      </CardContent>
    </Card>
  );
}
