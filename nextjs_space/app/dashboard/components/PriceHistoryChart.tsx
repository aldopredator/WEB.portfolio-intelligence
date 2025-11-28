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
}

export default function PriceHistoryChart({
  data,
  ticker,
  currentPrice,
  priceChange,
  priceChangePercent,
}: PriceHistoryChartProps) {
  const theme = useTheme();

  const dates = data.map((d) => new Date(d.Date).getDate().toString());
  const prices = data.map((d) => d.Close);

  const colorPalette = [
    theme.palette.primary.light,
    theme.palette.primary.main,
    theme.palette.primary.dark,
  ];

  const isPositive = priceChange >= 0;

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          {ticker} Price - 30 Days
        </Typography>
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
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Last 30 days price movement
          </Typography>
        </Stack>
        <LineChart
          colors={colorPalette}
          xAxis={[
            {
              scaleType: 'point',
              data: dates,
              tickInterval: (index, i) => (i + 1) % 5 === 0,
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
          height={250}
          margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
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
