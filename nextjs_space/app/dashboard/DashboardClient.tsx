'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Typography, Paper, Snackbar, Alert } from '@mui/material';
import MainGrid from './components/MainGrid';
import TickerSearch from '../components/TickerSearch';
import type { StockInsightsData } from '@/lib/types';

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
export default function DashboardClient({ initialData, stocks }: DashboardClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const stockParam = searchParams.get('stock');
  const [selectedStock, setSelectedStock] = React.useState(stocks[0]?.ticker || 'GOOG');
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'info' | 'warning' | 'error'>('info');
  const [isAddingTicker, setIsAddingTicker] = React.useState(false);

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
            {/* Search Toolbar */}
            <Paper
              elevation={0}
              sx={{
                width: '100%',
                maxWidth: { sm: '100%', md: '1700px' },
                bgcolor: 'transparent',
                mb: 2,
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#fff',
                    mb: 1.5,
                    fontSize: '1.1rem',
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
