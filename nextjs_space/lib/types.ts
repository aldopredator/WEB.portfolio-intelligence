
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
  currency?: string;
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
  pros: string[];
  cons: string[];
}

export interface StockInsightsData {
  [key: string]: StockInfo | string | undefined;
  timestamp?: string;
}
