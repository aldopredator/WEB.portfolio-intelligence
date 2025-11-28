'use client';

import * as React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { AppNavbar } from './AppNavbar';
import { SideMenu } from './SideMenu';
import { MUIThemeProvider } from '@/app/theme/MUIThemeProvider';

const drawerWidth = 240;

interface DashboardLayoutCRUDProps {
  children: React.ReactNode;
  selectedStock?: string;
  onStockSelect?: (ticker: string) => void;
  stocks?: Array<{ ticker: string; company: string; change_percent?: number }>;
  title?: string;
}

export function DashboardLayoutCRUD({
  children,
  selectedStock,
  onStockSelect,
  stocks = [],
  title,
}: DashboardLayoutCRUDProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <MUIThemeProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />
        
        <AppNavbar onMenuClick={handleDrawerToggle} title={title} />
        
        <SideMenu
          open={mobileOpen}
          onClose={handleDrawerToggle}
          selectedStock={selectedStock}
          onStockSelect={onStockSelect}
          stocks={stocks}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
            mt: 8,
            backgroundColor: 'background.default',
            minHeight: '100vh',
            overflowX: 'auto',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              height: '20px',
              width: '20px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
              border: '1px solid #ddd',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#888',
              border: '2px solid #f1f1f1',
              borderRadius: '2px',
              '&:hover': {
                backgroundColor: '#555',
              },
            },
            '&::-webkit-scrollbar-corner': {
              backgroundColor: '#f1f1f1',
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </MUIThemeProvider>
  );
}
