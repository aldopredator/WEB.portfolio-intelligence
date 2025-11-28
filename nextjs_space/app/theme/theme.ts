import { createTheme, ThemeOptions, PaletteMode } from '@mui/material/styles';

// Stock-specific colors for gains/losses
const stockColors = {
  gain: '#10b981', // green-500
  loss: '#ef4444',  // red-500
  neutral: '#6b7280', // gray-500
};

export const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'dark'
      ? {
          // Dark mode palette
          primary: {
            main: '#3b82f6', // blue-500
            light: '#60a5fa',
            dark: '#2563eb',
          },
          secondary: {
            main: '#8b5cf6', // purple-500
            light: '#a78bfa',
            dark: '#7c3aed',
          },
          success: {
            main: stockColors.gain,
            light: '#34d399',
            dark: '#059669',
          },
          error: {
            main: stockColors.loss,
            light: '#f87171',
            dark: '#dc2626',
          },
          warning: {
            main: '#f59e0b', // amber-500
            light: '#fbbf24',
            dark: '#d97706',
          },
          info: {
            main: '#06b6d4', // cyan-500
            light: '#22d3ee',
            dark: '#0891b2',
          },
          background: {
            default: '#0f172a', // slate-900
            paper: '#1e293b', // slate-800
          },
          text: {
            primary: '#f1f5f9', // slate-100
            secondary: '#cbd5e1', // slate-300
          },
          divider: '#334155', // slate-700
        }
      : {
          // Light mode palette
          primary: {
            main: '#2563eb', // blue-600
            light: '#3b82f6',
            dark: '#1d4ed8',
          },
          secondary: {
            main: '#7c3aed', // purple-600
            light: '#8b5cf6',
            dark: '#6d28d9',
          },
          success: {
            main: '#059669', // emerald-600
            light: stockColors.gain,
            dark: '#047857',
          },
          error: {
            main: '#dc2626', // red-600
            light: stockColors.loss,
            dark: '#b91c1c',
          },
          warning: {
            main: '#d97706', // amber-600
            light: '#f59e0b',
            dark: '#b45309',
          },
          info: {
            main: '#0891b2', // cyan-600
            light: '#06b6d4',
            dark: '#0e7490',
          },
          background: {
            default: '#f8fafc', // slate-50
            paper: '#ffffff',
          },
          text: {
            primary: '#0f172a', // slate-900
            secondary: '#475569', // slate-600
          },
          divider: '#e2e8f0', // slate-200
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: mode === 'dark'
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`,
        },
      },
    },
  },
});

export const createAppTheme = (mode: PaletteMode) => {
  return createTheme(getDesignTokens(mode));
};
