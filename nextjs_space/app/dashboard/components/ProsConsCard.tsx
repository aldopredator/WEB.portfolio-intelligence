'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SettingsIcon from '@mui/icons-material/Settings';

interface ProsConsCardProps {
  ticker: string;
  pros?: string[];
  cons?: string[];
}

export default function ProsConsCard({ ticker, pros = [], cons = [] }: ProsConsCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography component="h2" variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Pros & Cons
          </Typography>
          <SettingsIcon sx={{ color: 'primary.main', cursor: 'pointer' }} />
        </Stack>
        
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Key factors for {ticker}
        </Typography>

        {/* Pros Section */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <CheckCircleIcon sx={{ color: 'success.main', fontSize: '1.25rem' }} />
            <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 600 }}>
              Pros
            </Typography>
          </Stack>
          <Stack spacing={1}>
            {pros.length > 0 ? (
              pros.map((pro, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    pl: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: 'success.main',
                      mt: 1,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {pro}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" sx={{ color: 'text.disabled', pl: 1 }}>
                Cloud Growth
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Cons Section */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <CancelIcon sx={{ color: 'error.main', fontSize: '1.25rem' }} />
            <Typography variant="subtitle2" sx={{ color: 'error.main', fontWeight: 600 }}>
              Cons
            </Typography>
          </Stack>
          <Stack spacing={1}>
            {cons.length > 0 ? (
              cons.map((con, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    pl: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: 'error.main',
                      mt: 1,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {con}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" sx={{ color: 'text.disabled', pl: 1 }}>
                No specific concerns identified
              </Typography>
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
