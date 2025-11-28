'use client';

import * as React from 'react';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MainGrid from './components/MainGrid';
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
  const [selectedStock, setSelectedStock] = React.useState(stocks[0]?.ticker || 'GOOG');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top Toolbar with Stock List */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            backgroundColor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            px: 3,
            py: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ overflowX: 'auto' }}>
            {stocks.map((stock) => (
              <Box
                key={stock.ticker}
                onClick={() => setSelectedStock(stock.ticker)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: selectedStock === stock.ticker ? 'primary.main' : 'transparent',
                  '&:hover': {
                    backgroundColor: selectedStock === stock.ticker ? 'primary.dark' : 'action.hover',
                  },
                  minWidth: 'fit-content',
                  border: 1,
                  borderColor: selectedStock === stock.ticker ? 'primary.main' : 'divider',
                }}
              >
                <Box
                  component="img"
                  src={`/logos/${stock.ticker}.svg`}
                  alt={stock.ticker}
                  sx={{ width: 32, height: 32, borderRadius: 1 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: selectedStock === stock.ticker ? 'white' : 'text.primary',
                      }}
                    >
                      {stock.ticker}
                    </Box>
                    {stock.change_percent !== undefined && (
                      <Box
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: selectedStock === stock.ticker 
                            ? 'white' 
                            : stock.change_percent >= 0 
                              ? 'success.main' 
                              : 'error.main',
                        }}
                      >
                        {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>

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
            <MainGrid stockData={initialData} selectedStock={selectedStock} />
          </Stack>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
