'use client';

import * as React from 'react';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MainGrid from './components/MainGrid';
import { DashboardLayout } from '@/app/components/DashboardLayout';
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
      <Box sx={{ display: 'flex' }}>
        <DashboardLayout
          selectedStock={selectedStock}
          onStockSelect={setSelectedStock}
          stocks={stocks}
        >
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
                mt: { xs: 8, md: 0 },
              }}
            >
              <MainGrid stockData={initialData} selectedStock={selectedStock} />
            </Stack>
          </Box>
        </DashboardLayout>
      </Box>
    </ThemeProvider>
  );
}
