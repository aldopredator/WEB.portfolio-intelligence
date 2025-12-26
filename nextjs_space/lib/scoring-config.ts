// Internal Scoring System Configuration
// Multi-factor quantitative model for stock ranking

export type ScoringFactor = {
  name: string;
  description: string;
  metrics: {
    field: string;
    source: 'metrics' | 'stockData' | 'calculated';
    direction: 'higher' | 'lower'; // higher = better (ROE) vs lower = better (P/E)
    weight: number; // relative weight within this factor (0-1)
  }[];
};

export type ScoringTheme = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  factors: {
    value: number;
    quality: number;
    growth: number;
    momentum: number;
    risk: number;
  };
};

// Define the five core factors
export const SCORING_FACTORS: Record<string, ScoringFactor> = {
  value: {
    name: 'Value',
    description: 'Valuation multiples (lower is better)',
    metrics: [
      { field: 'peRatio', source: 'metrics', direction: 'lower', weight: 0.25 },
      { field: 'forwardPE', source: 'metrics', direction: 'lower', weight: 0.25 },
      { field: 'pbRatio', source: 'metrics', direction: 'lower', weight: 0.2 },
      { field: 'psRatio', source: 'metrics', direction: 'lower', weight: 0.2 },
      { field: 'evToRevenue', source: 'metrics', direction: 'lower', weight: 0.1 },
    ],
  },
  quality: {
    name: 'Quality',
    description: 'Financial health and profitability (higher is better)',
    metrics: [
      { field: 'roe', source: 'metrics', direction: 'higher', weight: 0.35 },
      { field: 'roa', source: 'metrics', direction: 'higher', weight: 0.25 },
      { field: 'profitMargin', source: 'metrics', direction: 'higher', weight: 0.3 },
      { field: 'debtToEquity', source: 'metrics', direction: 'lower', weight: 0.1 },
    ],
  },
  growth: {
    name: 'Growth',
    description: 'Revenue and earnings expansion (higher is better)',
    metrics: [
      { field: 'revenueGrowthQoQ', source: 'metrics', direction: 'higher', weight: 0.6 },
      { field: 'earningsGrowthQoQ', source: 'metrics', direction: 'higher', weight: 0.4 },
    ],
  },
  momentum: {
    name: 'Momentum',
    description: 'Price performance trends (higher is better)',
    metrics: [
      { field: 'return30d', source: 'calculated', direction: 'higher', weight: 0.4 },
      { field: 'return60d', source: 'calculated', direction: 'higher', weight: 0.3 },
      { field: 'changePercent', source: 'stockData', direction: 'higher', weight: 0.3 },
    ],
  },
  risk: {
    name: 'Risk',
    description: 'Volatility and market sensitivity (lower is better)',
    metrics: [
      { field: 'beta', source: 'metrics', direction: 'lower', weight: 0.6 },
      { field: 'volatility30d', source: 'calculated', direction: 'lower', weight: 0.4 },
    ],
  },
};

// Predefined themes with factor weightings
export const SCORING_THEMES: ScoringTheme[] = [
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Equal weight across all factors',
    emoji: '⚖️',
    factors: {
      value: 0.2,
      quality: 0.2,
      growth: 0.2,
      momentum: 0.2,
      risk: 0.2,
    },
  },
  {
    id: 'stability',
    name: 'Stability',
    description: 'Focus on quality and low risk',
    emoji: '🛡️',
    factors: {
      value: 0.15,
      quality: 0.40,
      growth: 0.10,
      momentum: 0.10,
      risk: 0.25,
    },
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Emphasize growth and momentum',
    emoji: '🚀',
    factors: {
      value: 0.10,
      quality: 0.15,
      growth: 0.40,
      momentum: 0.30,
      risk: 0.05,
    },
  },
  {
    id: 'value',
    name: 'Value',
    description: 'Hunt for undervalued opportunities',
    emoji: '💎',
    factors: {
      value: 0.45,
      quality: 0.30,
      growth: 0.10,
      momentum: 0.05,
      risk: 0.10,
    },
  },
  {
    id: 'momentum',
    name: 'Momentum',
    description: 'Ride the trend winners',
    emoji: '📈',
    factors: {
      value: 0.05,
      quality: 0.15,
      growth: 0.25,
      momentum: 0.45,
      risk: 0.10,
    },
  },
  {
    id: 'allweather',
    name: 'All-Weather',
    description: 'Risk-adjusted quality with balanced exposure',
    emoji: '🌤️',
    factors: {
      value: 0.20,
      quality: 0.35,
      growth: 0.15,
      momentum: 0.10,
      risk: 0.20,
    },
  },
];

// Helper function to get theme by ID
export function getThemeById(id: string): ScoringTheme | undefined {
  return SCORING_THEMES.find(theme => theme.id === id);
}

// Helper function to create custom theme
export function createCustomTheme(factors: ScoringTheme['factors']): ScoringTheme {
  return {
    id: 'custom',
    name: 'Custom',
    description: 'User-defined factor weights',
    emoji: '🎯',
    factors,
  };
}
