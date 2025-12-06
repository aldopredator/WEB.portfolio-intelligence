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
  totalEmployees?: number | null;
  heldPercentInsiders?: number | null;
  heldPercentInstitutions?: number | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
  fiftyDayAverage?: number | null;
  twoHundredDayAverage?: number | null;
  enterpriseValue?: number | null;
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
  totalEmployees,
  heldPercentInsiders,
  heldPercentInstitutions,
  fiftyTwoWeekHigh,
  fiftyTwoWeekLow,
  fiftyDayAverage,
  twoHundredDayAverage,
  enterpriseValue,
}: CompanyInfoCardProps) {
  // Debug logging
  React.useEffect(() => {
    console.log('[CompanyInfoCard] Polygon data received:', {
      floatShares,
      averageVolume,
      averageVolume10Day,
      sharesOutstanding,
      totalEmployees
    });
  }, [floatShares, averageVolume, averageVolume10Day, sharesOutstanding, totalEmployees]);

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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Industry
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {industry}
                </Typography>
              </Box>
            )}
            {weburl && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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
            {country && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Country
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {country}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Employees
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: totalEmployees ? 'text.primary' : 'text.disabled' }}>
                {totalEmployees ? totalEmployees.toLocaleString() : 'Loading...'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Market Cap (Enterprise Value)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: enterpriseValue ? 'text.primary' : 'text.disabled' }}>
                {enterpriseValue
                  ? enterpriseValue >= 1e12
                    ? `$${(enterpriseValue / 1e12).toFixed(1)}T`
                    : `$${(enterpriseValue / 1e9).toFixed(0)}B`
                  : 'Loading...'}
              </Typography>
            </Box>
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
                  : 'Loading...'}
              </Typography>
            </Box>
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
                  : 'Loading...'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Float %
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: (floatShares && sharesOutstanding) ? 'text.primary' : 'text.disabled' }}>
                {(floatShares && sharesOutstanding)
                  ? `${((floatShares / sharesOutstanding) * 100).toFixed(0)}%`
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
                    ? `${(averageVolume10Day / 1e9).toFixed(0)}B`
                    : averageVolume10Day >= 1e6
                    ? `${(averageVolume10Day / 1e6).toFixed(0)}M`
                    : averageVolume10Day.toLocaleString()
                  : 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Avg Annual Volume in %
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: (averageVolume10Day && enterpriseValue && floatShares && sharesOutstanding) ? 'text.primary' : 'text.disabled' }}>
                {(averageVolume10Day && enterpriseValue && floatShares && sharesOutstanding)
                  ? `${(((averageVolume10Day * 365) / (enterpriseValue * (floatShares / sharesOutstanding))) * 100).toFixed(2)}%`
                  : 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                % Held by Insiders
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: heldPercentInsiders ? 'text.primary' : 'text.disabled' }}>
                {heldPercentInsiders ? `${heldPercentInsiders.toFixed(0)}%` : 'Loading...'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                % Held by Institutions
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: heldPercentInstitutions ? 'text.primary' : 'text.disabled' }}>
                {heldPercentInstitutions ? `${heldPercentInstitutions.toFixed(0)}%` : 'Loading...'}
              </Typography>
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
