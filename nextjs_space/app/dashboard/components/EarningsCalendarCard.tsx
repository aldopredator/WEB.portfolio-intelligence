'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import Chip from '@mui/material/Chip';

interface EarningsEvent {
  date: string;
  epsEstimate?: number;
  epsActual?: number;
  revenueEstimate?: number;
  revenueActual?: number;
  quarter?: number;
  year?: number;
}

interface EarningsCalendarCardProps {
  ticker: string;
  earnings?: EarningsEvent[];
}

export default function EarningsCalendarCard({ ticker, earnings = [] }: EarningsCalendarCardProps) {
  // Sort by date and get the next upcoming or most recent earnings
  const sortedEarnings = [...earnings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const nextEarnings = sortedEarnings[0];

  const isUpcoming = nextEarnings && new Date(nextEarnings.date) > new Date();

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <CalendarTodayIcon sx={{ color: 'primary.main' }} />
          <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
            Earnings Calendar
          </Typography>
        </Stack>

        {nextEarnings ? (
          <Stack spacing={2}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: isUpcoming ? 'primary.dark' : 'action.hover',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ color: isUpcoming ? 'primary.light' : 'text.secondary' }}>
                  {isUpcoming ? 'Next Earnings' : 'Last Earnings'}
                </Typography>
                {nextEarnings.quarter && nextEarnings.year && (
                  <Chip
                    label={`Q${nextEarnings.quarter} ${nextEarnings.year}`}
                    size="small"
                    sx={{
                      height: '20px',
                      fontSize: '0.7rem',
                      backgroundColor: isUpcoming ? 'primary.main' : 'action.selected',
                    }}
                  />
                )}
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {new Date(nextEarnings.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Typography>
            </Box>

            {/* EPS Information */}
            {(nextEarnings.epsEstimate !== undefined || nextEarnings.epsActual !== undefined) && (
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  Earnings Per Share (EPS)
                </Typography>
                <Stack direction="row" spacing={2}>
                  {nextEarnings.epsActual !== undefined && (
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Actual
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color:
                            nextEarnings.epsEstimate && nextEarnings.epsActual >= nextEarnings.epsEstimate
                              ? 'success.main'
                              : nextEarnings.epsEstimate && nextEarnings.epsActual < nextEarnings.epsEstimate
                              ? 'error.main'
                              : 'text.primary',
                        }}
                      >
                        ${nextEarnings.epsActual.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  {nextEarnings.epsEstimate !== undefined && (
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Estimate
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        ${nextEarnings.epsEstimate.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}

            {/* Revenue Information */}
            {(nextEarnings.revenueEstimate !== undefined || nextEarnings.revenueActual !== undefined) && (
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  Revenue
                </Typography>
                <Stack direction="row" spacing={2}>
                  {nextEarnings.revenueActual !== undefined && (
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Actual
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color:
                            nextEarnings.revenueEstimate && nextEarnings.revenueActual >= nextEarnings.revenueEstimate
                              ? 'success.main'
                              : nextEarnings.revenueEstimate && nextEarnings.revenueActual < nextEarnings.revenueEstimate
                              ? 'error.main'
                              : 'text.primary',
                        }}
                      >
                        ${(nextEarnings.revenueActual / 1e9).toFixed(1)}B
                      </Typography>
                    </Box>
                  )}
                  {nextEarnings.revenueEstimate !== undefined && (
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Estimate
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        ${(nextEarnings.revenueEstimate / 1e9).toFixed(1)}B
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No earnings calendar data available
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
