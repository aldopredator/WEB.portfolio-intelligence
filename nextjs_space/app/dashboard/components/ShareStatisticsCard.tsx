'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import ShowChartIcon from '@mui/icons-material/ShowChart';

interface ShareStatisticsCardProps {
  ticker: string;
  sharesOutstanding?: number | null;
  floatShares?: number | null;
  averageVolume10Day?: number | null;
  averageVolume?: number | null;
  heldPercentInsiders?: number | null;
  heldPercentInstitutions?: number | null;
}

export default function ShareStatisticsCard({
  ticker,
  sharesOutstanding,
  floatShares,
  averageVolume10Day,
  averageVolume,
  heldPercentInsiders,
  heldPercentInstitutions,
}: ShareStatisticsCardProps) {
  // Calculate averageVolume3Month from averageVolume
  const averageVolume3Month = averageVolume;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <ShowChartIcon sx={{ color: 'primary.main' }} />
          <Typography component="h2" variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Stock Statistics
          </Typography>
        </Stack>

        <Stack spacing={2}>
          {/* Shares Outstanding */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Shares Outstanding
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: sharesOutstanding ? 'text.primary' : 'text.disabled' }}>
              {sharesOutstanding
                ? sharesOutstanding >= 1e9
                  ? `${(sharesOutstanding / 1e9).toFixed(0)}B`
                  : sharesOutstanding >= 1e6
                  ? `${(sharesOutstanding / 1e6).toFixed(0)}M`
                  : sharesOutstanding.toLocaleString()
                : 'N/A'}
            </Typography>
          </Box>

          {/* Float Shares */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Float Shares
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: floatShares ? 'text.primary' : 'text.disabled' }}>
              {floatShares
                ? floatShares >= 1e9
                  ? `${(floatShares / 1e9).toFixed(0)}B`
                  : floatShares >= 1e6
                  ? `${(floatShares / 1e6).toFixed(0)}M`
                  : floatShares.toLocaleString()
                : 'N/A'}
            </Typography>
          </Box>

          {/* Float % */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Float %
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: (floatShares && sharesOutstanding) ? 'text.primary' : 'text.disabled' }}>
              {(floatShares && sharesOutstanding)
                ? `${((floatShares / sharesOutstanding) * 100).toFixed(0)}%`
                : 'N/A'}
            </Typography>
          </Box>

          {/* Avg Daily Volume (10D) */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Avg Daily Volume (10D)
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: averageVolume10Day ? 'text.primary' : 'text.disabled' }}>
              {averageVolume10Day
                ? averageVolume10Day >= 1e9
                  ? `${(averageVolume10Day / 1e9).toFixed(0)}B`
                  : averageVolume10Day >= 1e6
                  ? `${(averageVolume10Day / 1e6).toFixed(0)}M`
                  : averageVolume10Day.toLocaleString()
                : 'N/A'}
            </Typography>
          </Box>

          {/* Avg Annual Volume in % (10D) */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Avg Annual Volume in % (10D)
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: (averageVolume10Day && floatShares) ? 'text.primary' : 'text.disabled' }}>
              {(averageVolume10Day && floatShares)
                ? `${((averageVolume10Day * 250 / floatShares) * 100).toFixed(2)}%`
                : 'N/A'}
            </Typography>
          </Box>

          {/* Avg Daily Volume (3M) */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Avg Daily Volume (3M)
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: averageVolume3Month ? 'text.primary' : 'text.disabled' }}>
              {averageVolume3Month
                ? averageVolume3Month >= 1e9
                  ? `${(averageVolume3Month / 1e9).toFixed(0)}B`
                  : averageVolume3Month >= 1e6
                  ? `${(averageVolume3Month / 1e6).toFixed(0)}M`
                  : averageVolume3Month.toLocaleString()
                : 'N/A'}
            </Typography>
          </Box>

          {/* Avg Annual Volume in % (3M) */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Avg Annual Volume in % (3M)
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: (averageVolume3Month && floatShares) ? 'text.primary' : 'text.disabled' }}>
              {(averageVolume3Month && floatShares)
                ? `${((averageVolume3Month * 250 / floatShares) * 100).toFixed(2)}%`
                : 'N/A'}
            </Typography>
          </Box>

          {/* % Held by Insiders */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              % Held by Insiders
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: heldPercentInsiders ? 'text.primary' : 'text.disabled' }}>
              {heldPercentInsiders ? `${heldPercentInsiders.toFixed(0)}%` : 'N/A'}
            </Typography>
          </Box>

          {/* % Held by Institutions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              % Held by Institutions
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: heldPercentInstitutions ? 'text.primary' : 'text.disabled' }}>
              {heldPercentInstitutions ? `${heldPercentInstitutions.toFixed(0)}%` : 'N/A'}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
