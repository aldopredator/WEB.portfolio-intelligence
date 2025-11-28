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
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            mt: 8,
            backgroundColor: 'background.default',
            minHeight: '100vh',
          }}
        >
          {children}
        </Box>
      </Box>
    </MUIThemeProvider>
  );
}
