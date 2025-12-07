'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import BusinessIcon from '@mui/icons-material/Business';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import toast from 'react-hot-toast';

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
  initialRating?: number;
  portfolios?: Array<{ id: string; name: string; description?: string | null }>;
  currentPortfolioId?: string | null;
  onRatingUpdate?: (ticker: string, rating: number) => void;
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
  initialRating = 0,
  portfolios = [],
  currentPortfolioId,
  onRatingUpdate,
}: CompanyInfoCardProps) {
  const [rating, setRating] = React.useState(initialRating);
  const [hoveredRating, setHoveredRating] = React.useState(0);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const moveMenuOpen = Boolean(anchorEl);
  const router = useRouter();

  // Update rating when initialRating changes
  React.useEffect(() => {
    console.log('[CompanyInfoCard] initialRating changed:', { ticker, from: rating, to: initialRating });
    setRating(initialRating);
  }, [initialRating, ticker, rating]);

  const handleMoveClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMoveClose = () => {
    setAnchorEl(null);
  };

  const handleMoveToPortfolio = async (targetPortfolioId: string) => {
    try {
      const response = await fetch('/api/stock/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, targetPortfolioId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Stock moved successfully');
        // Navigate to the new portfolio with the same ticker
        setTimeout(() => {
          window.location.href = `/?stock=${ticker}&portfolio=${targetPortfolioId}`;
        }, 1000);
      } else {
        toast.error(data.error || 'Failed to move stock');
      }
    } catch (error) {
      console.error('Error moving stock:', error);
      toast.error('Failed to move stock');
    } finally {
      handleMoveClose();
    }
  };

  const handleRatingClick = async (newRating: number) => {
    console.log('[CompanyInfoCard] Rating click:', { ticker, currentRating: rating, newRating });
    try {
      const response = await fetch('/api/stock/update-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, rating: newRating }),
      });

      console.log('[CompanyInfoCard] API response:', response.ok);

      if (response.ok) {
        console.log('[CompanyInfoCard] Setting rating to:', newRating);
        setRating(newRating);
        toast.success(`Rating updated to ${newRating} star${newRating !== 1 ? 's' : ''}`);
        // Update parent component state immediately
        if (onRatingUpdate) {
          console.log('[CompanyInfoCard] Calling onRatingUpdate:', ticker, newRating);
          onRatingUpdate(ticker, newRating);
        }
      } else {
        toast.error('Failed to update rating');
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      toast.error('Failed to update rating');
    }
  };
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
        {/* Star Rating Section */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          mb: 2,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 1.5, 
              color: 'text.secondary',
              fontWeight: 500,
            }}
          >
            Rate this stock (Current: {rating}, Initial: {initialRating})
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <IconButton
                key={star}
                onClick={() => handleRatingClick(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                sx={{
                  padding: 0.5,
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                }}
              >
                {(hoveredRating >= star || (hoveredRating === 0 && rating >= star)) ? (
                  <StarIcon 
                    sx={{ 
                      fontSize: 28,
                      color: 'warning.main',
                      transition: 'all 0.2s',
                    }} 
                  />
                ) : (
                  <StarBorderIcon 
                    sx={{ 
                      fontSize: 28,
                      color: 'text.disabled',
                      transition: 'all 0.2s',
                    }} 
                  />
                )}
              </IconButton>
            ))}
          </Stack>

          {/* Move Button */}
          {portfolios.length > 0 && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DriveFileMoveIcon />}
                onClick={handleMoveClick}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.light',
                    backgroundColor: 'primary.main',
                    color: 'white',
                  },
                }}
              >
                Transfer to Other Portfolio
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={moveMenuOpen}
                onClose={handleMoveClose}
              >
                {portfolios
                  .filter(p => p.id !== currentPortfolioId)
                  .map((portfolio) => (
                    <MenuItem 
                      key={portfolio.id} 
                      onClick={() => handleMoveToPortfolio(portfolio.id)}
                    >
                      {portfolio.name}
                    </MenuItem>
                  ))}
              </Menu>
            </>
          )}
        </Box>

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
              <Typography variant="h6" sx={{ fontWeight: 700, color: (averageVolume10Day && floatShares) ? 'text.primary' : 'text.disabled' }}>
                {(averageVolume10Day && floatShares)
                  ? `${((averageVolume10Day * 250 / floatShares) * 100).toFixed(2)}%`
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
