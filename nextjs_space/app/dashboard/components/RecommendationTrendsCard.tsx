'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { BarChart } from '@mui/x-charts/BarChart';

interface RecommendationTrend {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

interface RecommendationTrendsCardProps {
  ticker: string;
  trends?: RecommendationTrend[];
}

export default function RecommendationTrendsCard({ ticker, trends = [] }: RecommendationTrendsCardProps) {
  // Show the 3 most recent periods, reversed to show oldest first (chronological)
  const recentTrends = trends.slice(0, 3).reverse();

  const periods = recentTrends.map(t => t.period);
  const strongBuyData = recentTrends.map(t => t.strongBuy);
  const buyData = recentTrends.map(t => t.buy);
  const holdData = recentTrends.map(t => t.hold);
  const sellData = recentTrends.map(t => t.sell);
  const strongSellData = recentTrends.map(t => t.strongSell);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <TrendingUpIcon sx={{ color: 'primary.main' }} />
          <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
            Recommendation Trends
          </Typography>
        </Stack>

        {recentTrends.length > 0 ? (
          <>
            <Box sx={{ width: '100%', height: 250 }}>
              <BarChart
                xAxis={[
                  {
                    scaleType: 'band',
                    data: periods,
                  },
                ]}
                series={[
                  { data: strongBuyData, label: 'Strong Buy', color: '#10b981', stack: 'recommendations' },
                  { data: buyData, label: 'Buy', color: '#34d399', stack: 'recommendations' },
                  { data: holdData, label: 'Hold', color: '#fbbf24', stack: 'recommendations' },
                  { data: sellData, label: 'Sell', color: '#fb923c', stack: 'recommendations' },
                  { data: strongSellData, label: 'Strong Sell', color: '#f87171', stack: 'recommendations' },
                ]}
                height={250}
                margin={{ left: 40, right: 10, top: 30, bottom: 30 }}
                slotProps={{
                  legend: {
                    direction: 'row',
                    position: { vertical: 'top', horizontal: 'middle' },
                    padding: 0,
                    itemMarkWidth: 10,
                    itemMarkHeight: 10,
                    markGap: 5,
                    itemGap: 10,
                  },
                }}
              />
            </Box>
          </>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No recommendation trend data available
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
