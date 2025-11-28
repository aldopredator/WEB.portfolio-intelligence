'use client';

import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Stack,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  TrendingUp as TrendingUpIcon,
  Dashboard as DashboardIcon,
  ShowChart as ShowChartIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useState, ReactNode } from 'react';

const drawerWidth = 260;

interface DashboardLayoutProps {
  children: ReactNode;
  selectedStock?: string;
  onStockSelect?: (ticker: string) => void;
  stocks?: Array<{ ticker: string; company: string; change_percent?: number }>;
}

export function DashboardLayout({ 
  children, 
  selectedStock,
  onStockSelect,
  stocks = []
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ px: 3 }}>
        <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" noWrap component="div" fontWeight={700}>
          Portfolio Intel
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* Main Navigation */}
      <List sx={{ px: 2, py: 2 }}>
        <ListItem disablePadding>
          <ListItemButton selected>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Overview" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <ShowChartIcon />
            </ListItemIcon>
            <ListItemText primary="Markets" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <AssessmentIcon />
            </ListItemIcon>
            <ListItemText primary="Analytics" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Stock List */}
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', fontWeight: 600 }}>
          WATCHLIST
        </Typography>
      </Box>
      <List sx={{ px: 2 }}>
        {stocks.map((stock) => (
          <ListItem key={stock.ticker} disablePadding>
            <ListItemButton
              selected={selectedStock === stock.ticker}
              onClick={() => onStockSelect?.(stock.ticker)}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemIcon>
                <Avatar 
                  sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
                  src={`/logos/${stock.ticker}.svg`}
                  alt={stock.ticker}
                >
                  {stock.ticker.slice(0, 2)}
                </Avatar>
              </ListItemIcon>
              <ListItemText 
                primary={stock.ticker}
                secondary={stock.company}
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                secondaryTypographyProps={{ fontSize: '0.75rem', noWrap: true }}
              />
              {stock.change_percent !== undefined && (
                <Chip
                  label={`${stock.change_percent >= 0 ? '+' : ''}${stock.change_percent.toFixed(2)}%`}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: stock.change_percent >= 0 ? 'success.main' : 'error.main',
                    color: 'white',
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      {/* Settings at bottom */}
      <List sx={{ px: 2, pb: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <ListItem disablePadding>
          <ListItemButton sx={{ borderRadius: 1 }}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
            <Typography variant="h6" noWrap component="div">
              {selectedStock || 'Dashboard Overview'}
            </Typography>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        {children}
      </Box>
    </Box>
  );
}
