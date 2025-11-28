'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import { PieChart } from '@mui/x-charts/PieChart';

interface SocialSentimentCardProps {
  ticker: string;
  sentiment?: {
    positive: number;
    neutral: number;
    negative: number;
    isStale?: boolean;
    lastUpdated?: string;
  };
}

export default function SocialSentimentCard({ ticker, sentiment }: SocialSentimentCardProps) {
  const positiveRatio = sentiment?.positive || 45;
  const neutralRatio = sentiment?.neutral || 50;
  const negativeRatio = sentiment?.negative || 5;

  const overallSentiment = 
    positiveRatio > 50 ? 'Positive' : 
    negativeRatio > 50 ? 'Negative' : 
    'Neutral';

  const data = [
    { id: 0, value: positiveRatio, label: 'Positive', color: '#4ade80' },
    { id: 1, value: neutralRatio, label: 'Neutral', color: '#fbbf24' },
    { id: 2, value: negativeRatio, label: 'Negative', color: '#f87171' },
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <SentimentSatisfiedAltIcon sx={{ color: 'warning.main' }} />
          <Typography component="h2" variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Social Sentiment
          </Typography>
        </Stack>

        {/* Pie Chart */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
          <PieChart
            series={[
              {
                data,
                innerRadius: 80,
                outerRadius: 140,
                paddingAngle: 2,
                cornerRadius: 4,
                cx: 190,
              },
            ]}
            width={380}
            height={300}
            slotProps={{
              legend: { 
                hidden: true,
              },
            }}
          />
        </Box>

        {/* Sentiment Breakdown */}
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Box
            sx={{
              flex: 1,
              textAlign: 'center',
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(74, 222, 128, 0.1)',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4ade80' }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#4ade80' }}>
                {positiveRatio.toFixed(0)}%
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Positive
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              textAlign: 'center',
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fbbf24' }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#fbbf24' }}>
                {neutralRatio.toFixed(0)}%
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Neutral
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              textAlign: 'center',
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(248, 113, 113, 0.1)',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f87171' }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#f87171' }}>
                {negativeRatio.toFixed(0)}%
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Negative
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
