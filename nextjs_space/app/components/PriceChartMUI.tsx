'use client';

import {
  Card,
  CardContent,
  CardHeader,
  Typography,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';

interface PriceChartProps {
  data: Array<{ Date: string; Close: number }>;
  ticker: string;
}

export function PriceChartMUI({ data, ticker }: PriceChartProps) {
  // Transform data for MUI X Charts
  const dates = data.map((d) => new Date(d.Date));
  const prices = data.map((d) => d.Close);

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min;
  const yMin = min - range * 0.1;
  const yMax = max + range * 0.1;

  return (
    <Card elevation={0} sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Typography variant="h6" fontWeight={700}>
            30-Day Price Movement
          </Typography>
        }
        subheader={`${ticker} price trend`}
      />
      <CardContent>
        <LineChart
          xAxis={[{
            data: dates,
            scaleType: 'time',
            valueFormatter: (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          }]}
          yAxis={[{
            min: yMin,
            max: yMax,
          }]}
          series={[
            {
              data: prices,
              area: true,
              showMark: false,
              color: '#3b82f6',
            },
          ]}
          height={300}
          margin={{ top: 10, right: 20, bottom: 30, left: 60 }}
          sx={{
            '.MuiLineElement-root': {
              strokeWidth: 2,
            },
            '.MuiAreaElement-root': {
              fillOpacity: 0.1,
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
