'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { LineChart } from '@mui/x-charts/LineChart';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

export interface StatCardProps {
  title: string;
  value: string;
  interval: string;
  trend: 'up' | 'down' | 'neutral';
  data: number[];
  ticker?: string;
}

export default function StatCard({ title, value, interval, trend, data, ticker }: StatCardProps) {
  const theme = useTheme();
  const trendColor = trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'default';

  return (
    <Card variant="outlined" sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        <Stack
          direction="column"
          sx={{ justifyContent: 'space-between', flexGrow: '1', gap: 1 }}
        >
          <Stack sx={{ justifyContent: 'space-between' }}>
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Typography variant="h4" component="p">
                {value}
              </Typography>
              <Chip
                size="small"
                color={trendColor}
                label={ticker || interval}
                icon={trend === 'up' ? <ArrowUpward fontSize="small" /> : trend === 'down' ? <ArrowDownward fontSize="small" /> : undefined}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {interval}
            </Typography>
          </Stack>
          <LineChart
            colors={[theme.palette.primary.main]}
            xAxis={[
              {
                scaleType: 'point',
                data: data.map((_, i) => i),
                tickNumber: 2,
              },
            ]}
            series={[
              {
                id: 'trend',
                showMark: false,
                curve: 'linear',
                data,
              },
            ]}
            height={60}
            margin={{ left: 0, right: 0, top: 5, bottom: 20 }}
            sx={{
              '& .MuiAreaElement-series-trend': {
                fill: "url('#trend-gradient')",
              },
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
