'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { Package } from 'lucide-react';
import CountryMatrix from './CountryMatrix';

interface Stock {
  ticker: string;
  name: string;
  country: string;
  marketCap?: number;
  change?: number;
  changePercent?: number;
  rating?: number;
  portfolioId?: string | null;
}

interface Portfolio {
  id: string;
  name: string;
  description?: string | null;
}

interface CountriesClientProps {
  allStocks: Stock[];
  portfolios: Portfolio[];
  selectedPortfolioId?: string | null;
  selectedPortfolioId2?: string | null;
}

export default function CountriesClient({ allStocks, portfolios, selectedPortfolioId, selectedPortfolioId2 }: CountriesClientProps) {
  const router = useRouter();
  const [ratingFilter, setRatingFilter] = useState<number>(0); // 0 = All, -1 = Not Rated, 1-5 = min stars

  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);
  const selectedPortfolio2 = portfolios.find(p => p.id === selectedPortfolioId2);

  const handlePortfolioChange = (portfolioId: string) => {
    const params = new URLSearchParams();
    params.set('portfolio', portfolioId);
    if (selectedPortfolioId2) params.set('portfolio2', selectedPortfolioId2);
    router.push(`/countries?${params}`);
  };

  const handlePortfolio2Change = (portfolioId2: string) => {
    const params = new URLSearchParams();
    if (selectedPortfolioId) params.set('portfolio', selectedPortfolioId);
    if (portfolioId2) params.set('portfolio2', portfolioId2);
    router.push(`/countries${params.toString() ? `?${params}` : ''}`);
  };

  // Apply filters - include both portfolios if portfolio2 is selected
  const portfolioIds = [selectedPortfolioId, selectedPortfolioId2].filter(Boolean);
  const filteredStocks = allStocks.filter(stock => {
    // Portfolio filter - include stocks from either portfolio if both are selected
    if (portfolioIds.length > 0 && !portfolioIds.includes(stock.portfolioId || '')) return false;
    
    // Rating filter
    if (ratingFilter === -1 && (stock.rating || 0) > 0) return false; // Not Rated
    if (ratingFilter > 0 && (stock.rating || 0) < ratingFilter) return false; // Minimum stars
    return true;
  });

  // Group filtered stocks by country
  const countryGroups: Record<string, Stock[]> = {};
  filteredStocks.forEach((stock) => {
    if (!countryGroups[stock.country]) {
      countryGroups[stock.country] = [];
    }
    countryGroups[stock.country].push(stock);
  });

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Portfolio Filter */}
          <FormControl
            sx={{
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderColor: 'rgba(148, 163, 184, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(148, 163, 184, 0.5)',
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                },
                '&.Mui-focused': {
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                }
              },
              '& .MuiInputLabel-root': {
                color: '#94a3b8',
              }
            }}
            size="small"
          >
            <InputLabel sx={{ color: '#94a3b8' }}>Portfolio 1 (Base)</InputLabel>
            <Select
              value={selectedPortfolio?.id || ''}
              onChange={(e) => handlePortfolioChange(e.target.value)}
              label="Portfolio 1 (Base)"
              sx={{ 
                color: '#fff',
                '& .MuiSvgIcon-root': {
                  color: '#94a3b8',
                }
              }}
            >
              {portfolios.map((portfolio) => (
                <MenuItem key={portfolio.id} value={portfolio.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Package size={16} />
                    {portfolio.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Portfolio 2 Filter (Optional) */}
          <FormControl
            sx={{
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderColor: selectedPortfolioId2 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(148, 163, 184, 0.3)',
                '&:hover': {
                  borderColor: selectedPortfolioId2 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(148, 163, 184, 0.5)',
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                },
                '&.Mui-focused': {
                  borderColor: selectedPortfolioId2 ? '#22c55e' : '#3b82f6',
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                }
              },
              '& .MuiInputLabel-root': {
                color: selectedPortfolioId2 ? '#22c55e' : '#94a3b8',
              }
            }}
            size="small"
          >
            <InputLabel sx={{ color: selectedPortfolioId2 ? '#22c55e' : '#94a3b8' }}>Portfolio 2 (Combine) - Optional</InputLabel>
            <Select
              value={selectedPortfolio2?.id || ''}
              onChange={(e) => handlePortfolio2Change(e.target.value)}
              label="Portfolio 2 (Combine) - Optional"
              sx={{ 
                color: '#fff',
                '& .MuiSvgIcon-root': {
                  color: selectedPortfolioId2 ? '#22c55e' : '#94a3b8',
                }
              }}
            >
              <MenuItem value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Package size={16} />
                  None
                </Box>
              </MenuItem>
              {portfolios
                .filter(p => p.id !== selectedPortfolioId)
                .map((portfolio) => (
                  <MenuItem key={portfolio.id} value={portfolio.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Package size={16} />
                      {portfolio.name}
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          
          {/* Rating Filter */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: '#94a3b8',
                mb: 1,
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Rating
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 1 }}>
              <Box
                onClick={() => setRatingFilter(-1)}
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                  border: '2px solid',
                  borderColor: ratingFilter === -1 ? '#6b7280' : 'rgba(148, 163, 184, 0.2)',
                  bgcolor: ratingFilter === -1 ? 'rgba(107, 114, 128, 0.2)' : 'rgba(30, 41, 59, 0.3)',
                  color: ratingFilter === -1 ? '#9ca3af' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: ratingFilter === -1 ? 'rgba(107, 114, 128, 0.3)' : 'rgba(30, 41, 59, 0.5)',
                  }
                }}
              >
                ☆ Not Rated
              </Box>
              {[1, 2, 3, 4, 5].map((stars) => (
                <Box
                  key={stars}
                  onClick={() => setRatingFilter(stars)}
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 1.5,
                    border: '2px solid',
                    borderColor: ratingFilter === stars ? '#eab308' : 'rgba(148, 163, 184, 0.2)',
                    bgcolor: ratingFilter === stars ? 'rgba(234, 179, 8, 0.2)' : 'rgba(30, 41, 59, 0.3)',
                    color: ratingFilter === stars ? '#facc15' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: ratingFilter === stars ? 'rgba(234, 179, 8, 0.3)' : 'rgba(30, 41, 59, 0.5)',
                    }
                  }}
                >
                  {stars === 1 ? '⭐ 1+' : stars === 2 ? '⭐ 2+' : stars === 3 ? '⭐ 3+' : stars === 4 ? '⭐ 4+' : '⭐ 5'}
                </Box>
              ))}
              <Box
                onClick={() => setRatingFilter(0)}
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                  border: '2px solid',
                  borderColor: ratingFilter === 0 ? '#3b82f6' : 'rgba(148, 163, 184, 0.2)',
                  bgcolor: ratingFilter === 0 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.3)',
                  color: ratingFilter === 0 ? '#60a5fa' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: ratingFilter === 0 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(30, 41, 59, 0.5)',
                  }
                }}
              >
                📋 All
              </Box>
            </Box>
          </Box>
        </div>

        {/* Active Filter Info */}
        {(selectedPortfolio || selectedPortfolio2 || ratingFilter !== 0) && (
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Showing <span className="text-blue-400 font-semibold">{filteredStocks.length}</span> stocks
              {selectedPortfolio && !selectedPortfolio2 && <span> from <span className="text-blue-400 font-semibold">{selectedPortfolio.name}</span></span>}
              {selectedPortfolio && selectedPortfolio2 && (
                <span> from <span className="text-blue-400 font-semibold">{selectedPortfolio.name}</span> + <span className="text-green-400 font-semibold">{selectedPortfolio2.name}</span></span>
              )}
              {ratingFilter === -1 && <span> with <span className="text-gray-400 font-semibold">No Rating</span></span>}
              {ratingFilter > 0 && <span> with <span className="text-yellow-400 font-semibold">{ratingFilter}+ stars</span></span>}
            </Typography>
          </div>
        )}
      </div>

      {/* Country Matrix */}
      <CountryMatrix countryGroups={countryGroups} />
    </div>
  );
}
