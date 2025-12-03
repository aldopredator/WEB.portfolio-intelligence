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
      // Add new ticker to watchlist via database
      setSnackbarMessage(`Adding ${result.symbol} to your watchlist...`);
      setSnackbarSeverity('info');
      setSnackbarOpen(true);

      try {
        const response = await fetch('/api/tickers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbol: result.symbol,
            name: result.name,
            exchange: result.exchange,
            type: result.type,
            category: 'watchlist',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSnackbarMessage(`${result.symbol} added to watchlist! Refreshing...`);
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
          
          // Wait a moment then refresh the page to load new data
          setTimeout(() => {
            router.push(`/dashboard?stock=${result.symbol}`);
            router.refresh();
          }, 1000);
        } else {
          const errorData = await response.json();
          const errorMessage = errorData.error || 'Unknown error';
          console.error('Failed to add ticker:', errorData);
          setSnackbarMessage(`Failed to add ${result.symbol}: ${errorMessage}`);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error('Error adding ticker:', error);
        setSnackbarMessage(`Error adding ${result.symbol}. Please try again.`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
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
                <TickerSearch
                  onTickerSelect={handleTickerSelect}
                  placeholder="Search by ticker or company name..."
                />
              </Box>
            </Paper>

            <MainGrid stockData={initialData} selectedStock={selectedStock} />
          </Stack>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
