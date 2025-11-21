
import type { StockInfo } from './types';

export function calculateRecommendation(stock: StockInfo): {
  action: 'BUY' | 'HOLD' | 'SELL';
  reasoning: string;
} {
  const currentPrice = stock?.stock_data?.current_price ?? 0;
  const targetPrice = stock?.analyst_recommendations?.target_price ?? 0;
  const consensus = stock?.analyst_recommendations?.consensus ?? '';
  const sentiment = stock?.social_sentiment;
  
  const upside = targetPrice > 0 ? ((targetPrice - currentPrice) / currentPrice) * 100 : 0;
  const positiveSentiment = sentiment?.positive ?? 0;
  
  // Buy if strong analyst consensus, significant upside, and positive sentiment
  if (consensus === 'strong_buy' && upside > 20 && positiveSentiment >= 45) {
    return {
      action: 'BUY',
      reasoning: `Strong analyst consensus with ${upside?.toFixed?.(1) ?? '0'}% upside potential. Positive social sentiment at ${positiveSentiment?.toFixed?.(0) ?? '0'}%.`
    };
  }
  
  // Hold if moderate conditions
  if (upside > 10 && upside < 20) {
    return {
      action: 'HOLD',
      reasoning: `Moderate upside of ${upside?.toFixed?.(1) ?? '0'}%. Analysts maintain ${consensus?.replace?.('_', ' ') ?? 'neutral'} rating.`
    };
  }
  
  // Sell if negative indicators
  if (upside < 5 || positiveSentiment < 40) {
    return {
      action: 'SELL',
      reasoning: `Limited upside potential and mixed sentiment indicators suggest caution.`
    };
  }
  
  return {
    action: 'HOLD',
    reasoning: `Mixed signals across price targets and sentiment. Monitor closely for changes.`
  };
}

export function formatPrice(price: number): string {
  return `$${price?.toFixed?.(2) ?? '0.00'}`;
}

export function formatPercent(percent: number): string {
  const sign = (percent ?? 0) >= 0 ? '+' : '';
  return `${sign}${percent?.toFixed?.(2) ?? '0.00'}%`;
}

export function getSentimentColor(type: 'positive' | 'neutral' | 'negative'): string {
  const colors = {
    positive: '#10b981',
    neutral: '#f59e0b',
    negative: '#ef4444'
  };
  return colors?.[type] ?? '#6b7280';
}

export function getOverallSentiment(sentiment: { positive: number; neutral: number; negative: number }): {
  label: string;
  color: string;
} {
  const pos = sentiment?.positive ?? 0;
  const neg = sentiment?.negative ?? 0;
  
  if (pos > 50) return { label: 'Very Positive', color: '#10b981' };
  if (pos > 40 && pos > neg) return { label: 'Positive', color: '#34d399' };
  if (neg > 40) return { label: 'Negative', color: '#ef4444' };
  if (Math.abs(pos - neg) < 10) return { label: 'Neutral', color: '#f59e0b' };
  
  return { label: 'Mixed', color: '#6b7280' };
}
