'use client';

import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from './theme';
import { useMemo } from 'react';

export function MUIThemeProvider({ children }: { children: React.ReactNode }) {
  // Always use dark mode for stock dashboard
  const theme = useMemo(() => createAppTheme('dark'), []);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  );
}
