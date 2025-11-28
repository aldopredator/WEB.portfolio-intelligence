'use client';

import * as React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Chip,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShowChart as ShowChartIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import Link from 'next/link';

const drawerWidth = 240;

interface MenuContentProps {
  selectedStock?: string;
  onStockSelect?: (ticker: string) => void;
  stocks?: Array<{ ticker: string; company: string; change_percent?: number }>;
}

export function MenuContent({ selectedStock, onStockSelect, stocks = [] }: MenuContentProps) {
  return (
    <Box sx={{ overflow: 'auto' }}>
      {/* Brand Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrendingUpIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Portfolio Intel
        </Typography>
      </Box>
      
      <Divider />

      {/* Main Navigation */}
      <List sx={{ px: 2, py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton selected sx={{ borderRadius: 1, mb: 0.5 }}>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href="/screening"
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemIcon>
              <SearchIcon />
            </ListItemIcon>
            <ListItemText primary="Screening" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href="/criteria"
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemIcon>
              <FilterListIcon />
            </ListItemIcon>
            <ListItemText primary="Criteria" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton sx={{ borderRadius: 1, mb: 0.5 }}>
            <ListItemIcon>
              <AssessmentIcon />
            </ListItemIcon>
            <ListItemText primary="Analytics" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Watchlist */}
      <Box sx={{ px: 2, py: 1 }}>
        <Typography
          variant="caption"
          sx={{ px: 1, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}
        >
          Watchlist
        </Typography>
      </Box>

      <List sx={{ px: 2 }}>
        {stocks.map((stock) => {
          const isSelected = selectedStock === stock.ticker;
          const isPositive = (stock.change_percent ?? 0) >= 0;
          
          return (
            <ListItem key={stock.ticker} disablePadding>
              <ListItemButton
                selected={isSelected}
                onClick={() => onStockSelect?.(stock.ticker)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.875rem',
                      bgcolor: isSelected ? 'primary.main' : 'action.hover',
                    }}
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
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                    noWrap: true,
                    sx: { maxWidth: '120px' },
                  }}
                />
                {stock.change_percent !== undefined && (
                  <Chip
                    label={`${isPositive ? '+' : ''}${stock.change_percent.toFixed(1)}%`}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor: isPositive ? 'success.main' : 'error.main',
                      color: 'white',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      {/* Settings at bottom */}
      <List sx={{ px: 2, pb: 2 }}>
        <Divider sx={{ mb: 1 }} />
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
}

interface SideMenuProps extends MenuContentProps {
  open: boolean;
  onClose: () => void;
}

export function SideMenu({ open, onClose, selectedStock, onStockSelect, stocks }: SideMenuProps) {
  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        <MenuContent
          selectedStock={selectedStock}
          onStockSelect={(ticker) => {
            onStockSelect?.(ticker);
            onClose();
          }}
          stocks={stocks}
        />
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
        open
      >
        <Box sx={{ height: 64 }} /> {/* Toolbar spacer */}
        <MenuContent
          selectedStock={selectedStock}
          onStockSelect={onStockSelect}
          stocks={stocks}
        />
      </Drawer>
    </>
  );
}
