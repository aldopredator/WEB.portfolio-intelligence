'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Typography, Paper, Snackbar, Alert, Select, MenuItem, FormControl, InputLabel, Chip, IconButton, Tooltip } from '@mui/material';
import { Package, ChevronRight, Trash2, Lock } from 'lucide-react';
import MainGrid from './components/MainGrid';
import TickerSearch from '../components/TickerSearch';
import type { StockInsightsData } from '@/lib/types';
import { usePortfolio } from '@/lib/portfolio-context';

// Helper function to format relative dates
function formatRelativeDate(date: Date | null): string {
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
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

interface DashboardClientProps {
  initialData: StockInsightsData;
  stocks: Array<{ 
    ticker: string; 
    company: string; 
    change_percent?: number; 
    rating?: number;
    notes?: string;
    ratingUpdatedAt?: Date | null; 
    portfolioId?: string | null;
    isLocked?: boolean;
  }>
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans)',
  },
});

function DashboardClientContent({ initialData, stocks: initialStocks }: DashboardClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const stockParam = searchParams.get('stock');
  const { selectedPortfolio, portfolios, selectPortfolio } = usePortfolio();
  const [selectedStock, setSelectedStock] = React.useState(initialStocks[0]?.ticker || '');
  const [stocks, setStocks] = React.useState(initialStocks);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'info' | 'warning' | 'error'>('info');
  const [isAddingTicker, setIsAddingTicker] = React.useState(false);
  const [panelCollapsed, setPanelCollapsed] = React.useState(false);
  const [ratingFilter, setRatingFilter] = React.useState<number>(0); // 0 = All, -1 = Not Rated, 1-5 = min stars

  // Sync stocks when initialStocks changes
  React.useEffect(() => {
    setStocks(initialStocks);
  }, [initialStocks]);

  // Callback to update rating in local state
  const handleRatingUpdate = React.useCallback((ticker: string, newRating: number) => {
    setStocks(prevStocks => 
      prevStocks.map(stock => 
        stock.ticker === ticker 
          ? { ...stock, rating: newRating }
          : stock
      )
    );
  }, []);

  // Handle portfolio change
  const handlePortfolioChange = (portfolioId: string) => {
    console.log('[DashboardClient] Portfolio changed to:', portfolioId);
    if (portfolioId === 'all') {
      selectPortfolio(null);
      window.location.href = '/';
    } else {
      const portfolio = portfolios.find(p => p.id === portfolioId);
      if (portfolio) {
        selectPortfolio(portfolio);
        window.location.href = `/?portfolio=${portfolioId}`;
      }
    }
  };

  // Update selected stock when URL param changes
  React.useEffect(() => {
    if (stockParam) {
      setSelectedStock(stockParam);
    }
  }, [stockParam]);

  const handleTickerSelect = async (result: { symbol: string; name: string; exchange: string; type: string }) => {
    console.log('Selected ticker:', result);
    
    // Check if ticker already exists in portfolio
    const tickerExists = stocks.some(s => s.ticker === result.symbol);
    
    if (tickerExists) {
      // Navigate to existing ticker
      router.push(`/dashboard?stock=${result.symbol}`);
      setSnackbarMessage(`Switched to ${result.symbol}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } else {
      // Add ticker to portfolio
      setIsAddingTicker(true);
      setSnackbarMessage(`Adding ${result.symbol} to your portfolio...`);
      setSnackbarSeverity('info');
      setSnackbarOpen(true);

      try {
        const response = await fetch('/api/add-ticker', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticker: result.symbol,
            name: result.name,
            type: result.type,
            exchange: result.exchange,
            portfolioId: selectedPortfolio?.id,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setSnackbarMessage(`✅ ${result.symbol} has been added to your portfolio!`);
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
          
          // Wait a bit to show the success message, then refresh the page
          setTimeout(() => {
            // Refresh the page to load the new ticker data with portfolio filter
            const portfolioParam = selectedPortfolio ? `&portfolio=${selectedPortfolio.id}` : '';
            window.location.href = `/?stock=${result.symbol}${portfolioParam}`;
          }, 1500);
        } else {
          throw new Error(data.error || 'Failed to add ticker');
        }
      } catch (error) {
        console.error('Error adding ticker:', error);
        setSnackbarMessage(`❌ Failed to add ${result.symbol}. Please try again.`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setIsAddingTicker(false);
      }
    }
  };

  const handleDeleteTicker = async (ticker: string, isLocked: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent ticker selection when clicking delete
    
    console.log('[DashboardClient] Delete attempt:', { ticker, isLocked });
    
    if (isLocked) {
      setSnackbarMessage(`❌ Cannot delete ${ticker}. This portfolio is locked. Please unlock it in the Portfolios tab first.`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${ticker}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/delete-ticker?ticker=${ticker}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbarMessage(`✅ ${ticker} has been deleted successfully`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        // Refresh the page after a short delay
        setTimeout(() => {
          const portfolioParam = selectedPortfolio ? `?portfolio=${selectedPortfolio.id}` : '';
          window.location.href = `/${portfolioParam}`;
        }, 1000);
      } else {
        throw new Error(data.error || 'Failed to delete ticker');
      }
    } catch (error) {
      console.error('Error deleting ticker:', error);
      setSnackbarMessage(`❌ Failed to delete ${ticker}. Please try again.`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Main Content */}
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: 3,
            }}
          >
            {/* Top Right Toolbar */}
            <Box sx={{ 
              position: 'fixed',
              top: 180,
              right: panelCollapsed ? -376 : 24,
              bottom: 24,
              zIndex: 100,
              width: '400px',
              display: 'flex',
              flexDirection: 'column',
              transition: 'right 0.3s ease',
            }}>
              {/* Collapse Button */}
              {panelCollapsed && (
                <IconButton
                  onClick={() => setPanelCollapsed(false)}
                  sx={{
                    position: 'absolute',
                    left: -40,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    '&:hover': {
                      bgcolor: 'rgba(30, 41, 59, 1)',
                    },
                    width: 40,
                    height: 60,
                    borderRadius: '8px 0 0 8px',
                  }}
                >
                  <ChevronRight className="w-5 h-5 text-slate-400" style={{ transform: 'rotate(180deg)' }} />
                </IconButton>
              )}
              <Paper
                elevation={3}
                sx={{
                  bgcolor: 'rgba(30, 41, 59, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  p: 2.5,
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  overflow: 'hidden',
                }}
              >
                {/* Collapse Button Inside Panel */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Box
                    onClick={() => setPanelCollapsed(true)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 1,
                      color: '#94a3b8',
                      cursor: 'pointer',
                      borderRadius: 1,
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: '#fff',
                        bgcolor: 'rgba(148, 163, 184, 0.1)',
                      },
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      Collapse
                    </Typography>
                  </Box>
                </Box>
                {/* Portfolio Selector */}
                <Box sx={{ mb: 2.5 }}>
                  <FormControl 
                    fullWidth
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(15, 23, 42, 0.6)',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: 'rgba(15, 23, 42, 0.8)',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: '#94a3b8',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(148, 163, 184, 0.2)',
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
                      <MenuItem value="all" disabled sx={{ color: 'text.disabled' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Package size={16} />
                          All Portfolios ({stocks.length} tickers)
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
                  
                  {selectedPortfolio && (
                    <Chip 
                      label={`Showing ${stocks.length} tickers from ${selectedPortfolio.name}`}
                      color="primary"
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(59, 130, 246, 0.2)',
                        color: '#60a5fa',
                        borderRadius: 2,
                        fontWeight: 500,
                        mt: 1.5,
                      }}
                    />
                  )}
                  
                  {/* Rating Filter */}
                  <Box sx={{ mt: 2 }}>
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
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
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
                        🔄 All
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Search Tickers */}
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#fff',
                      mb: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    Search Tickers
                  </Typography>
                  <Box sx={{ position: 'relative' }}>
                    <TickerSearch
                      onTickerSelect={handleTickerSelect}
                      placeholder="Search by ticker or company name..."
                    />
                    {isAddingTicker && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          bgcolor: 'rgba(0, 0, 0, 0.5)',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                        }}
                      >
                        <Typography sx={{ color: '#fff', fontSize: '0.9rem' }}>
                          Adding ticker...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Ticker List */}
                <Box sx={{ mt: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#fff',
                      mb: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    Tickers ({stocks.filter(stock => {
                      if (ratingFilter === 0) return true; // All
                      if (ratingFilter === -1) return !stock.rating || stock.rating === 0; // Not Rated
                      return (stock.rating || 0) >= ratingFilter; // Min stars
                    }).length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto', flex: 1, pr: 1 }}>
                    {[...stocks]
                      .filter(stock => {
                        if (ratingFilter === 0) return true; // All
                        if (ratingFilter === -1) return !stock.rating || stock.rating === 0; // Not Rated
                        return (stock.rating || 0) >= ratingFilter; // Min stars
                      })
                      .sort((a, b) => a.ticker.localeCompare(b.ticker))
                      .map((stock) => (
                      <Box
                        key={stock.ticker}
                        onClick={() => {
                          setSelectedStock(stock.ticker);
                          router.push(`/?stock=${stock.ticker}${selectedPortfolio ? `&portfolio=${selectedPortfolio.id}` : ''}`);
                        }}
                        sx={{
                          p: 1.5,
                          bgcolor: selectedStock === stock.ticker ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                          border: selectedStock === stock.ticker ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(148, 163, 184, 0.1)',
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: selectedStock === stock.ticker ? 'rgba(59, 130, 246, 0.25)' : 'rgba(15, 23, 42, 0.8)',
                            borderColor: 'rgba(59, 130, 246, 0.3)',
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                                {stock.ticker}
                              </Typography>
                              {stock.isLocked && (
                                <Tooltip title="Portfolio is locked">
                                  <Lock size={12} className="text-amber-500" />
                                </Tooltip>
                              )}
                            </Box>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mt: 0.25 }}>
                              {stock.company}
                            </Typography>
                            {stock.ratingUpdatedAt && (
                              <Typography sx={{ color: '#64748b', fontSize: '0.65rem', mt: 0.25, fontStyle: 'italic' }}>
                                Rated {formatRelativeDate(stock.ratingUpdatedAt)}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {stock.change_percent !== undefined && (
                              <Typography 
                                sx={{ 
                                  color: stock.change_percent >= 0 ? '#4ade80' : '#f87171',
                                  fontWeight: 600,
                                  fontSize: '0.85rem'
                                }}
                              >
                                {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                              </Typography>
                            )}
                            <Tooltip title={stock.isLocked ? `Portfolio locked - unlock in Portfolios tab` : `Delete ${stock.ticker}`}>
                              <IconButton
                                size="small"
                                onClick={(e) => handleDeleteTicker(stock.ticker, stock.isLocked || false, e)}
                                disabled={stock.isLocked}
                                sx={{
                                  color: stock.isLocked ? '#64748b' : '#94a3b8',
                                  '&:hover': {
                                    color: stock.isLocked ? '#64748b' : '#f87171',
                                    bgcolor: stock.isLocked ? 'transparent' : 'rgba(248, 113, 113, 0.1)',
                                  },
                                  cursor: stock.isLocked ? 'not-allowed' : 'pointer',
                                }}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Box>

            <MainGrid 
              stockData={initialData} 
              selectedStock={selectedStock} 
              stocks={stocks}
              portfolios={portfolios}
              onRatingUpdate={handleRatingUpdate}
            />
          </Stack>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={isAddingTicker ? null : 4000}
        onClose={() => !isAddingTicker && setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => !isAddingTicker && setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default function DashboardClient(props: DashboardClientProps) {
  return (
    <React.Suspense fallback={
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ color: 'text.secondary' }}>Loading dashboard...</Typography>
        </Box>
      </ThemeProvider>
    }>
      <DashboardClientContent {...props} />
    </React.Suspense>
  );
}
