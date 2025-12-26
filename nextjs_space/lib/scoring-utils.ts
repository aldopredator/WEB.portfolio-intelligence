// Scoring utilities for multi-factor quantitative analysis

export type ThemePreset = 'stability' | 'growth' | 'value' | 'quality' | 'momentum' | 'all-weather' | 'custom';

export interface FactorWeights {
  value: number;
  quality: number;
  growth: number;
  momentum: number;
  risk: number;
}

export interface ThemeDefinition {
  name: string;
  description: string;
  weights: FactorWeights;
}

// Predefined theme configurations
export const THEME_PRESETS: Record<ThemePreset, ThemeDefinition> = {
  'stability': {
    name: 'Stability',
    description: 'Favors established companies with strong fundamentals and lower volatility',
    weights: {
      value: 0.25,
      quality: 0.35,
      growth: 0.10,
      momentum: 0.10,
      risk: 0.20,
    },
  },
  'growth': {
    name: 'Growth',
    description: 'Emphasizes revenue growth and momentum over valuation',
    weights: {
      value: 0.10,
      quality: 0.15,
      growth: 0.40,
      momentum: 0.30,
      risk: 0.05,
    },
  },
  'value': {
    name: 'Value',
    description: 'Focuses on undervalued companies with low multiples',
    weights: {
      value: 0.45,
      quality: 0.25,
      growth: 0.15,
      momentum: 0.05,
      risk: 0.10,
    },
  },
  'quality': {
    name: 'Quality',
    description: 'Prioritizes profitability, margins, and return on equity',
    weights: {
      value: 0.15,
      quality: 0.50,
      growth: 0.20,
      momentum: 0.05,
      risk: 0.10,
    },
  },
  'momentum': {
    name: 'Momentum',
    description: 'Targets stocks with strong recent performance and trends',
    weights: {
      value: 0.05,
      quality: 0.15,
      growth: 0.20,
      momentum: 0.50,
      risk: 0.10,
    },
  },
  'all-weather': {
    name: 'All-Weather',
    description: 'Balanced approach across all factors',
    weights: {
      value: 0.20,
      quality: 0.20,
      growth: 0.20,
      momentum: 0.20,
      risk: 0.20,
    },
  },
  'custom': {
    name: 'Custom',
    description: 'Define your own factor weights',
    weights: {
      value: 0.20,
      quality: 0.20,
      growth: 0.20,
      momentum: 0.20,
      risk: 0.20,
    },
  },
};

// Z-score normalization
export function zScore(values: number[]): number[] {
  const validValues = values.filter(v => !isNaN(v) && isFinite(v));
  if (validValues.length === 0) return values.map(() => 0);
  
  const mean = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
  const variance = validValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / validValues.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return values.map(() => 0);
  
  return values.map(v => isNaN(v) || !isFinite(v) ? 0 : (v - mean) / stdDev);
}

// Calculate component scores
export interface ComponentScores {
  valueScore: number;
  qualityScore: number;
  growthScore: number;
  momentumScore: number;
  riskScore: number;
}

export interface ScoringMetrics {
  // Value metrics (lower is better for most)
  pe?: number;
  forwardPe?: number;
  pb?: number;
  ps?: number;
  evToRevenue?: number;
  evToEbitda?: number;
  
  // Quality metrics (higher is better)
  roe?: number;
  roa?: number;
  profitMargin?: number;
  
  // Growth metrics (higher is better)
  revenueGrowth?: number;
  earningsGrowth?: number;
  
  // Momentum metrics (higher is better for returns, lower for volatility)
  return30d?: number;
  return60d?: number;
  volatility30d?: number;
  volatility60d?: number;
  
  // Risk metrics
  beta?: number;
  debtToEquity?: number;
}

export function calculateComponentScores(
  allMetrics: ScoringMetrics[],
  stockMetrics: ScoringMetrics
): ComponentScores {
  // Extract arrays for each metric
  const peValues = allMetrics.map(m => m.forwardPe || m.pe || NaN);
  const pbValues = allMetrics.map(m => m.pb || NaN);
  const psValues = allMetrics.map(m => m.ps || NaN);
  
  const roeValues = allMetrics.map(m => m.roe || NaN);
  const roaValues = allMetrics.map(m => m.roa || NaN);
  const profitMarginValues = allMetrics.map(m => m.profitMargin || NaN);
  
  const revenueGrowthValues = allMetrics.map(m => m.revenueGrowth || NaN);
  const earningsGrowthValues = allMetrics.map(m => m.earningsGrowth || NaN);
  
  const return30dValues = allMetrics.map(m => m.return30d || NaN);
  const return60dValues = allMetrics.map(m => m.return60d || NaN);
  
  const betaValues = allMetrics.map(m => m.beta || NaN);
  const debtValues = allMetrics.map(m => m.debtToEquity || NaN);
  
  // Calculate z-scores
  const peZScores = zScore(peValues);
  const pbZScores = zScore(pbValues);
  const psZScores = zScore(psValues);
  const roeZScores = zScore(roeValues);
  const roaZScores = zScore(roaValues);
  const profitMarginZScores = zScore(profitMarginValues);
  const revenueGrowthZScores = zScore(revenueGrowthValues);
  const earningsGrowthZScores = zScore(earningsGrowthValues);
  const return30dZScores = zScore(return30dValues);
  const return60dZScores = zScore(return60dValues);
  const betaZScores = zScore(betaValues);
  const debtZScores = zScore(debtValues);
  
  // Find index of current stock
  const index = allMetrics.indexOf(stockMetrics);
  if (index === -1) {
    return { valueScore: 0, qualityScore: 0, growthScore: 0, momentumScore: 0, riskScore: 0 };
  }
  
  // Value Score (lower PE, PB, PS is better, so negate)
  const valueScore = -(peZScores[index] || 0) - (pbZScores[index] || 0) - (psZScores[index] || 0);
  
  // Quality Score (higher ROE, ROA, Margins is better)
  const qualityScore = (roeZScores[index] || 0) + (roaZScores[index] || 0) + (profitMarginZScores[index] || 0);
  
  // Growth Score (higher growth is better)
  const growthScore = (revenueGrowthZScores[index] || 0) + (earningsGrowthZScores[index] || 0);
  
  // Momentum Score (higher returns are better)
  const momentumScore = (return30dZScores[index] || 0) + (return60dZScores[index] || 0);
  
  // Risk Score (lower beta and debt is better, so negate)
  const riskScore = -(betaZScores[index] || 0) - (debtZScores[index] || 0);
  
  return {
    valueScore,
    qualityScore,
    growthScore,
    momentumScore,
    riskScore,
  };
}

export function calculateFinalScore(
  componentScores: ComponentScores,
  weights: FactorWeights
): number {
  return (
    componentScores.valueScore * weights.value +
    componentScores.qualityScore * weights.quality +
    componentScores.growthScore * weights.growth +
    componentScores.momentumScore * weights.momentum +
    componentScores.riskScore * weights.risk
  );
}
