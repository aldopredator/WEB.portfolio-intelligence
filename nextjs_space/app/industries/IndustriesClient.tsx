'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { Package } from 'lucide-react';
import IndustryMatrix from './IndustryMatrix';

interface Stock {
  ticker: string;
  name: string;
  industry: string;
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

interface IndustriesClientProps {
  allStocks: Stock[];
  portfolios: Portfolio[];
  selectedPortfolioId?: string | null;
  selectedPortfolioId2?: string | null;
}

export default function IndustriesClient({ allStocks, portfolios, selectedPortfolioId, selectedPortfolioId2 }: IndustriesClientProps) {
  const router = useRouter();
  const [ratingFilter, setRatingFilter] = useState<number>(0); // 0 = All, -1 = Not Rated, 1-5 = min stars
  const [isPending, startTransition] = useTransition();
  
  // Local state for portfolio selections (before Apply)
  const [localPortfolioId, setLocalPortfolioId] = useState(selectedPortfolioId || '');
  const [localPortfolioId2, setLocalPortfolioId2] = useState(selectedPortfolioId2 || '');

  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);
  const selectedPortfolio2 = portfolios.find(p => p.id === selectedPortfolioId2);

  const handleReset = () => {
    const barclaysPortfolio = portfolios.find(p => p.name === 'BARCLAYS');
    setLocalPortfolioId(barclaysPortfolio?.id || '');
    setLocalPortfolioId2('');
    setRatingFilter(0);
  };

  const handleApply = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (localPortfolioId) params.set('portfolio', localPortfolioId);
      if (localPortfolioId2) params.set('portfolio2', localPortfolioId2);
      router.push(`/industries${params.toString() ? `?${params}` : ''}`);
    });
  };

  // Apply rating filter only (portfolio filtering already done server-side)
  const filteredStocks = allStocks.filter(stock => {
    // Rating filter
    if (ratingFilter === -1 && (stock.rating || 0) > 0) return false; // Not Rated
    if (ratingFilter > 0 && (stock.rating || 0) < ratingFilter) return false; // Minimum stars
    return true;
  });

  // Group filtered stocks by industry
  const industryGroups: Record<string, Stock[]> = {};
  filteredStocks.forEach((stock) => {
    if (!industryGroups[stock.industry]) {
      industryGroups[stock.industry] = [];
    }
    industryGroups[stock.industry].push(stock);
  });

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleReset}
          className="px-6 py-2.5 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-all font-medium"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          disabled={isPending}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 border border-blue-500 rounded-lg text-white transition-all font-medium disabled:cursor-not-allowed"
        >
          {isPending ? 'Applying...' : 'Apply'}
        </button>
      </div>

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
              value={localPortfolioId}
              onChange={(e) => setLocalPortfolioId(e.target.value)}
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
                borderColor: localPortfolioId2 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(148, 163, 184, 0.3)',
                '&:hover': {
                  borderColor: localPortfolioId2 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(148, 163, 184, 0.5)',
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                },
                '&.Mui-focused': {
                  borderColor: localPortfolioId2 ? '#22c55e' : '#3b82f6',
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                }
              },
              '& .MuiInputLabel-root': {
                color: localPortfolioId2 ? '#22c55e' : '#94a3b8',
              }
            }}
            size="small"
          >
            <InputLabel sx={{ color: localPortfolioId2 ? '#22c55e' : '#94a3b8' }}>Portfolio 2 (Combine) - Optional</InputLabel>
            <Select
              value={localPortfolioId2}
              onChange={(e) => setLocalPortfolioId2(e.target.value)}
              label="Portfolio 2 (Combine) - Optional"
              sx={{ 
                color: '#fff',
                '& .MuiSvgIcon-root': {
                  color: localPortfolioId2 ? '#22c55e' : '#94a3b8',
                }
              }}
            >
              <MenuItem value="">
                <em>None</em>
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
                  {'⭐'.repeat(stars)} {stars}+
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
                📊 All
              </Box>
            </Box>
          </Box>
        </div>

        {/* Active Filters Display */}
        {(selectedPortfolio || selectedPortfolio2) && (
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <Typography variant="caption" className="text-slate-400 block mb-2">
              Showing {filteredStocks.length} stocks from:
            </Typography>
            <div className="flex flex-wrap gap-2">
              {selectedPortfolio && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
                  <Package size={14} />
                  {selectedPortfolio.name}
                </div>
              )}
              {selectedPortfolio2 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                  <Package size={14} />
                  {selectedPortfolio2.name}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Industry Matrix */}
      <IndustryMatrix industryGroups={industryGroups} />
    </div>
  );
}
