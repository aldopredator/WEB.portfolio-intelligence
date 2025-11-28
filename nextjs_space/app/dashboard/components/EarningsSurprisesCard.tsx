'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface EarningsSurprise {
  actual?: number;
  estimate?: number;
  period: string;
  quarter?: number;
  year?: number;
  surprise?: number;
  surprisePercent?: number;
}

interface EarningsSurprisesCardProps {
  ticker: string;
  surprises: EarningsSurprise[];
}

export default function EarningsSurprisesCard({
  ticker,
  surprises,
}: EarningsSurprisesCardProps) {
  // Take the most recent 4 quarters
  const recentSurprises = surprises.slice(0, 4);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
          Earnings Surprises
        </Typography>

        {recentSurprises.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No earnings surprise data available
          </Typography>
        ) : (
          <Stack spacing={2}>
            {recentSurprises.map((surprise, index) => {
              const isBeat = (surprise.surprisePercent || 0) > 0;
              const isMiss = (surprise.surprisePercent || 0) < 0;
              
              return (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {surprise.period}
                    </Typography>
                    {surprise.surprisePercent !== undefined && (
                      <Chip
                        icon={isBeat ? <TrendingUpIcon /> : isMiss ? <TrendingDownIcon /> : undefined}
                        label={`${surprise.surprisePercent > 0 ? '+' : ''}${surprise.surprisePercent.toFixed(2)}%`}
                        size="small"
                        sx={{
                          bgcolor: isBeat ? 'success.main' : isMiss ? 'error.main' : 'text.secondary',
                          color: 'white',
                          fontWeight: 700,
                        }}
                      />
                    )}
                  </Stack>

                  <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Actual
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${surprise.actual?.toFixed(2) || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Estimate
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${surprise.estimate?.toFixed(2) || 'N/A'}
                      </Typography>
                    </Box>
                    {surprise.surprise !== undefined && (
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          Surprise
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: surprise.surprise > 0 ? 'success.main' : surprise.surprise < 0 ? 'error.main' : 'text.primary',
                          }}
                        >
                          ${surprise.surprise > 0 ? '+' : ''}{surprise.surprise.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
