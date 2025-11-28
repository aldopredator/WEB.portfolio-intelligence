'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import BusinessIcon from '@mui/icons-material/Business';

interface CompanyInfoCardProps {
  ticker: string;
  companyName?: string;
  logo?: string;
  industry?: string;
  sector?: string;
  subSector?: string;
  country?: string;
  marketCapitalization?: number;
  currency?: string;
  weburl?: string;
}

export default function CompanyInfoCard({
  ticker,
  companyName,
  logo,
  industry,
  sector,
  subSector,
  country,
  marketCapitalization,
  currency,
  weburl,
}: CompanyInfoCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          {logo ? (
            <Avatar
              src={logo}
              alt={companyName || ticker}
              sx={{ width: 56, height: 56 }}
              variant="rounded"
            />
          ) : (
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }} variant="rounded">
              <BusinessIcon />
            </Avatar>
          )}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {companyName || ticker}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {ticker}
            </Typography>
          </Box>
        </Stack>

        {(industry || sector || subSector || country || marketCapitalization || weburl) && (
          <Stack spacing={1.5}>
            {industry && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Industry
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {industry}
                </Typography>
              </Box>
            )}
            {sector && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Sector
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {sector}
                </Typography>
              </Box>
            )}
            {subSector && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Sub-Sector
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {subSector}
                </Typography>
              </Box>
            )}
            {country && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Country
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {country}
                </Typography>
              </Box>
            )}
            {marketCapitalization && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Market Cap
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {currency || '$'}{(marketCapitalization / 1e9).toFixed(2)}B
                </Typography>
              </Box>
            )}
            {weburl && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Website
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                  component="a"
                  href={weburl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {weburl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
