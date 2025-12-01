
export interface PriceMovement {
  Date: string;
  Close: number;
}

export interface AnalystRecommendation {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export interface AnalystData {
  recommendations: AnalystRecommendation[];
  target_price: number;
  consensus: string;
}

export interface StockData {
  ticker: string;
  current_price: number;
  change: number;
  change_percent: number;
  '52_week_high': number;
  '52_week_low': number;
  price_movement_30_days: PriceMovement[];
  analyst_recommendations: AnalystData;
  // Optional real-time fields sourced from Yahoo Finance
  previous_close?: number;
  market_cap?: number;
  volume?: number;
  averageVolume10Day?: number | null;
  averageVolume?: number | null;
  floatShares?: number | null;
  sharesOutstanding?: number | null;
  dailyVolume?: number | null;
  currency?: string;
  country?: string;
  // Finnhub valuation metrics
  pe_ratio?: number;
  pb_ratio?: number;
  ps_ratio?: number;
  pcf_ratio?: number;
  // Finnhub profitability metrics
  roe?: number;
  roa?: number;
  roi?: number;
  gross_margin?: number;
  operating_margin?: number;
  profit_margin?: number;
  // Finnhub financial health
  debt_to_equity?: number;
  current_ratio?: number;
  quick_ratio?: number;
  // Finnhub growth metrics
  revenue_growth?: number;
  earnings_growth?: number;
  // Finnhub dividend metrics
  dividend_yield?: number;
  payout_ratio?: number;
  // Finnhub market data
  beta?: number;
  // Finnhub per share metrics
  eps?: number;
  book_value_per_share?: number;
}

export interface SocialSentiment {
  positive: number;
  neutral: number;
  negative: number;
  isStale?: boolean;
  lastUpdated?: string;
}

export interface CompanyProfile {
  name?: string;
  logo?: string;
  industry?: string;
  sector?: string;
  subSector?: string;
  country?: string;
  marketCapitalization?: number;
  currency?: string;
  weburl?: string;
  assets?: number;
  liabilities?: number;
}

export interface NewsArticle {
  headline: string;
  source: string;
  url: string;
  datetime?: number;
  summary?: string;
  image?: string;
}

export interface PriceTarget {
  targetHigh?: number;
  targetLow?: number;
  targetMean?: number;
  targetMedian?: number;
  numberOfAnalysts?: number;
}

export interface EarningsEvent {
  date: string;
  epsEstimate?: number;
  epsActual?: number;
  revenueEstimate?: number;
  revenueActual?: number;
  quarter?: number;
  year?: number;
}

export interface EarningsSurprise {
  actual?: number;
  estimate?: number;
  period: string;
  quarter?: number;
  year?: number;
  surprise?: number;
  surprisePercent?: number;
}

export interface StockInfo {
  stock_data: StockData;
  analyst_recommendations: AnalystData;
  latest_news: NewsArticle[];
  social_sentiment: SocialSentiment;
  pros: string[];
  cons: string[];
  company_profile?: CompanyProfile;
  price_target?: PriceTarget;
  earnings_calendar?: EarningsEvent[];
  earnings_surprises?: EarningsSurprise[];
  recommendation_trends?: AnalystRecommendation[];
}

export interface StockInsightsData {
  [key: string]: StockInfo | string | undefined;
  timestamp?: string;
}
