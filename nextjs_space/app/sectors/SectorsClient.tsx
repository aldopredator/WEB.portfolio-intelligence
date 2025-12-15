'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { Package } from 'lucide-react';
import SectorMatrix from './SectorMatrix';

interface Stock {
  ticker: string;
  name: string;
  sector: string;
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

interface SectorsClientProps {
  allStocks: Stock[];
  portfolios: Portfolio[];
  selectedPortfolioId?: string | null;
}

export default function SectorsClient({ allStocks, portfolios, selectedPortfolioId }: SectorsClientProps) {
  const router = useRouter();
  const [ratingFilter, setRatingFilter] = useState<number>(0); // 0 = All, -1 = Not Rated, 1-5 = min stars

  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);

  const handlePortfolioChange = (portfolioId: string) => {
    if (portfolioId === 'all') {
      router.push('/sectors');
    } else {
      router.push(`/sectors?portfolio=${portfolioId}`);
    }
  };

  // Apply filters
  const filteredStocks = allStocks.filter(stock => {
    // Rating filter
    if (ratingFilter === -1 && (stock.rating || 0) > 0) return false; // Not Rated
    if (ratingFilter > 0 && (stock.rating || 0) < ratingFilter) return false; // Minimum stars
    return true;
  });

  // Group filtered stocks by sector
  const sectorGroups: Record<string, Stock[]> = {};
  filteredStocks.forEach((stock) => {
    if (!sectorGroups[stock.sector]) {
      sectorGroups[stock.sector] = [];
    }
    sectorGroups[stock.sector].push(stock);
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
            <InputLabel sx={{ color: '#94a3b8' }}>Portfolio Filter</InputLabel>
            <Select
              value={selectedPortfolio?.id || 'all'}
              onChange={(e) => handlePortfolioChange(e.target.value)}
              label="Portfolio Filter"
              sx={{ 
                color: '#fff',
                '& .MuiSvgIcon-root': {
                  color: '#94a3b8',
                }
              }}
            >
              <MenuItem value="all">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Package size={16} />
                  All Portfolios ({allStocks.length} tickers)
                </Box>
              </MenuItem>
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
        {(selectedPortfolio || ratingFilter !== 0) && (
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Showing <span className="text-blue-400 font-semibold">{filteredStocks.length}</span> stocks
              {selectedPortfolio && <span> from <span className="text-blue-400 font-semibold">{selectedPortfolio.name}</span></span>}
              {ratingFilter === -1 && <span> with <span className="text-gray-400 font-semibold">No Rating</span></span>}
              {ratingFilter > 0 && <span> with <span className="text-yellow-400 font-semibold">{ratingFilter}+ stars</span></span>}
            </Typography>
          </div>
        )}
      </div>

      {/* Sector Matrix */}
      <SectorMatrix sectorGroups={sectorGroups} />
    </div>
  );
}
