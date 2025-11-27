
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
}

export interface SocialSentiment {
  positive: number;
  neutral: number;
  negative: number;
}

export interface StockInfo {
  stock_data: StockData;
  analyst_recommendations: AnalystData;
  latest_news: any[];
  social_sentiment: SocialSentiment;
  emerging_trends: string[];
}

export interface StockInsightsData {
  META: StockInfo;
  NVDA: StockInfo;
  GOOG: StockInfo;
  TSLA: StockInfo;
  timestamp?: string;
}
