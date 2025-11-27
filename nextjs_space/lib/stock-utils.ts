
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
  // Server-only sentiment helper moved to `lib/sentiment.ts` to avoid importing
  // server-side APIs (fs, fetch) into client bundles. See `lib/sentiment.ts`.
            // ignore and fall back
          }
        }
      }
    }

    // If no articles from API, try fallbackArticles (from static JSON)
    if ((!articles || articles.length === 0) && Array.isArray(fallbackArticles) && fallbackArticles.length > 0) {
      // Expect fallback articles to have title/summary fields; adapt if different
      articles = fallbackArticles.slice(0, 10).map((a: any) => ({ title: a.title || a.headline || a.summary || '', description: a.description || a.summary || '' }));
    }

    if (!articles || articles.length === 0) return null;

    let positive = 0, neutral = 0, negative = 0;
    for (const a of articles) {
      const text = `${a.title ?? ''} ${a.description ?? ''}`;
      const s = scoreText(text);
      if (s > 0) positive += 1;
      else if (s < 0) negative += 1;
      else neutral += 1;
    }

    const total = positive + neutral + negative || 1;
    return {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      negative: Math.round((negative / total) * 100)
    };
  } catch (err) {
    return null;
  }
}
