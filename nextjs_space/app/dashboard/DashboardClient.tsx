'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Typography, Paper, Snackbar, Alert, Select, MenuItem, FormControl, InputLabel, Chip } from '@mui/material';
import { Package } from 'lucide-react';
import MainGrid from './components/MainGrid';
import TickerSearch from '../components/TickerSearch';
import type { StockInsightsData } from '@/lib/types';
import { usePortfolio } from '@/lib/portfolio-context';

interface DashboardClientProps {
  initialData: StockInsightsData;
  stocks: Array<{ ticker: string; company: string; change_percent?: number }>;
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

function DashboardClientContent({ initialData, stocks }: DashboardClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const stockParam = searchParams.get('stock');
  const { selectedPortfolio, portfolios, selectPortfolio } = usePortfolio();
  const [selectedStock, setSelectedStock] = React.useState(stocks[0]?.ticker || 'GOOG');
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'info' | 'warning' | 'error'>('info');
  const [isAddingTicker, setIsAddingTicker] = React.useState(false);

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
            // Refresh the page to load the new ticker data
            window.location.href = `/dashboard?stock=${result.symbol}`;
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
              right: 24,
              zIndex: 100,
              width: '400px',
              display: 'none',
            }}>
              <Paper
                elevation={3}
                sx={{
                  bgcolor: 'rgba(30, 41, 59, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  p: 2.5,
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                }}
              >
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
                      <MenuItem value="all">
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
              </Paper>
            </Box>

            <MainGrid stockData={initialData} selectedStock={selectedStock} />
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
