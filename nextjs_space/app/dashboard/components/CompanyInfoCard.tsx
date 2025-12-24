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
import TextField from '@mui/material/TextField';
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
  ipoDate?: string;
  assets?: number;
  liabilities?: number;
  floatShares?: number | null;
  averageVolume?: number | null;
  averageVolume10Day?: number | null;
  averageVolume3Month?: number | null;
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
  initialNotes?: string | null;
  ratingUpdatedAt?: Date | null;
  isLocked?: boolean;
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
  ipoDate,
  assets,
  liabilities,
  floatShares,
  averageVolume,
  averageVolume10Day,
  averageVolume3Month,
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
  initialNotes = '',
  ratingUpdatedAt = null,
  isLocked = false,
  portfolios = [],
  currentPortfolioId,
  onRatingUpdate,
}: CompanyInfoCardProps) {
  const [rating, setRating] = React.useState(initialRating);
  const [notes, setNotes] = React.useState(initialNotes || '');
  const [hoveredRating, setHoveredRating] = React.useState(0);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const moveMenuOpen = Boolean(anchorEl);
  const router = useRouter();

  // Format relative date
  const formatRelativeDate = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return new Date(date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Update rating when initialRating changes
  React.useEffect(() => {
    console.log('[CompanyInfoCard] initialRating changed:', { ticker, from: rating, to: initialRating });
    setRating(initialRating);
  }, [initialRating, ticker, rating]);

  // Update notes when ticker or initialNotes changes
  React.useEffect(() => {
    console.log('[CompanyInfoCard] Notes changed:', { ticker, notes: initialNotes });
    setNotes(initialNotes || '');
  }, [ticker, initialNotes]);

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
        {/* Top Section: Rating, Buttons, and Transfer in one line */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          mb: 2,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}>
          {/* Rating Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Stack direction="row" spacing={0.5}>
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
            </Box>
            
            {/* Buttons on the right */}
            <Stack direction="row" spacing={1}>
              {portfolios.length > 0 && !isLocked && (
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
                  Transfer
                </Button>
              )}
              <Button
                variant="contained"
                size="small"
                onClick={async () => {
                  try {
                    // Save both rating and notes
                    const [ratingResponse, notesResponse] = await Promise.all([
                      fetch('/api/stock/update-rating', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ticker, rating }),
                      }),
                      fetch('/api/stock/update-notes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ticker, notes }),
                      }),
                    ]);

                    if (ratingResponse.ok && notesResponse.ok) {
                      toast.success(`Saved: ${rating} star${rating !== 1 ? 's' : ''} and notes`);
                      if (onRatingUpdate) {
                        onRatingUpdate(ticker, rating);
                      }
                      setTimeout(() => window.location.reload(), 1000);
                    } else {
                      toast.error('Failed to save');
                    }
                  } catch (error) {
                    console.error('Error saving:', error);
                    toast.error('Failed to save');
                  }
                }}
                sx={{
                  bgcolor: 'success.main',
                  '&:hover': {
                    bgcolor: 'success.dark',
                  },
                }}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={async () => {
                  try {
                    // Reset both rating and notes
                    const [ratingResponse, notesResponse] = await Promise.all([
                      fetch('/api/stock/update-rating', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ticker, rating: 0 }),
                      }),
                      fetch('/api/stock/update-notes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ticker, notes: '' }),
                      }),
                    ]);

                    if (ratingResponse.ok && notesResponse.ok) {
                      setRating(0);
                      setNotes('');
                      toast.success('Rating and notes reset');
                      setTimeout(() => window.location.reload(), 1000);
                    } else {
                      toast.error('Failed to reset');
                    }
                  } catch (error) {
                    console.error('Error resetting:', error);
                    toast.error('Failed to reset');
                  }
                }}
                sx={{
                  borderColor: 'error.main',
                  color: 'error.main',
                  '&:hover': {
                    borderColor: 'error.dark',
                    bgcolor: 'error.main',
                    color: 'white',
                  },
                }}
              >
                Reset
              </Button>
            </Stack>
          </Box>

          {/* Last Updated */}
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.disabled',
              mb: 1.5,
            }}
          >
            Last updated: {formatRelativeDate(ratingUpdatedAt)}
          </Typography>

          {/* Notes Section */}
          <Box sx={{ width: '100%' }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Add notes about this stock (max 100 characters)"
              value={notes}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 100) {
                  setNotes(value);
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.875rem',
                },
              }}
            />
          </Box>
          
          {/* Move Menu */}
          {portfolios.length > 0 && !isLocked && (
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
          )}
        </Box>

        {/* Company Info Section */}
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
            {sector && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Sector
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {sector}
                </Typography>
              </Box>
            )}
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
            {ipoDate && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  IPO
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {new Date(ipoDate).getFullYear()}
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
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
