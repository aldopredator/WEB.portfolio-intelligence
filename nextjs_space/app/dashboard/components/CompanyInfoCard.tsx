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
  assets?: number;
  liabilities?: number;
  floatShares?: number | null;
  averageVolume?: number | null;
  averageVolume10Day?: number | null;
  sharesOutstanding?: number | null;
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
  assets,
  liabilities,
  floatShares,
  averageVolume,
  averageVolume10Day,
  sharesOutstanding,
}: CompanyInfoCardProps) {
  // Debug logging
  React.useEffect(() => {
    console.log('[CompanyInfoCard] Polygon data received:', {
      floatShares,
      averageVolume,
      averageVolume10Day,
      sharesOutstanding
    });
  }, [floatShares, averageVolume, averageVolume10Day, sharesOutstanding]);

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
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
              {companyName || ticker}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {ticker}
            </Typography>
          </Box>
        </Stack>

        {(industry || sector || subSector || country || marketCapitalization || floatShares || averageVolume || averageVolume10Day || sharesOutstanding || assets || liabilities || weburl) && (
          <Stack spacing={2}>
            {industry && (
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block' }}>
                  Industry
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {industry}
                </Typography>
              </Box>
            )}
            {sector && (
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block' }}>
                  Sector
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {sector}
                </Typography>
              </Box>
            )}
            {subSector && (
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block' }}>
                  Sub-Sector
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {subSector}
                </Typography>
              </Box>
            )}
            {country && (
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block' }}>
                  Country
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {country}
                </Typography>
              </Box>
            )}
            {marketCapitalization && (
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block' }}>
                  Market Cap
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {marketCapitalization >= 1000e9
                    ? `${currency || '$'} ${(marketCapitalization / 1e12).toFixed(1)}T`
                    : `${currency || '$'} ${(marketCapitalization / 1e9).toFixed(1)}B`}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Float Shares
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: floatShares ? 'text.primary' : 'text.disabled' }}>
                {floatShares
                  ? floatShares >= 1e9
                    ? `${(floatShares / 1e9).toFixed(2)}B`
                    : floatShares >= 1e6
                    ? `${(floatShares / 1e6).toFixed(2)}M`
                    : floatShares.toLocaleString()
                  : 'Loading...'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Avg Daily Volume (10D)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: averageVolume10Day ? 'text.primary' : 'text.disabled' }}>
                {averageVolume10Day
                  ? averageVolume10Day >= 1e9
                    ? `${(averageVolume10Day / 1e9).toFixed(2)}B`
                    : averageVolume10Day >= 1e6
                    ? `${(averageVolume10Day / 1e6).toFixed(2)}M`
                    : averageVolume10Day.toLocaleString()
                  : 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Shares Outstanding
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: sharesOutstanding ? 'text.primary' : 'text.disabled' }}>
                {sharesOutstanding
                  ? sharesOutstanding >= 1e9
                    ? `${(sharesOutstanding / 1e9).toFixed(2)}B`
                    : sharesOutstanding >= 1e6
                    ? `${(sharesOutstanding / 1e6).toFixed(2)}M`
                    : sharesOutstanding.toLocaleString()
                  : 'Loading...'}
              </Typography>
            </Box>
            {assets && (
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block' }}>
                  Assets
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {assets >= 1000e9
                    ? `${currency || '$'} ${(assets / 1e12).toFixed(1)}T`
                    : `${currency || '$'} ${(assets / 1e9).toFixed(1)}B`}
                </Typography>
              </Box>
            )}
            {liabilities && (
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block' }}>
                  Liabilities
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {liabilities >= 1000e9
                    ? `${currency || '$'} ${(liabilities / 1e12).toFixed(1)}T`
                    : `${currency || '$'} ${(liabilities / 1e9).toFixed(1)}B`}
                </Typography>
              </Box>
            )}
            {weburl && (
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block' }}>
                  Website
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
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
