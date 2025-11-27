
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

export function formatLargeNumber(value: number | undefined | null): string {
  const n = Number(value ?? 0);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return `${n}`;
}

export function formatMarketCap(value: number | undefined | null, currency = '$'): string {
  if (!value) return 'N/A';
  return `${currency}${formatLargeNumber(value)}`;
}
