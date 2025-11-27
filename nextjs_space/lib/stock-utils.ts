
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

// Simple keyword-based sentiment scoring as a fallback or lightweight option.
import { getCached, setCached } from './cache';

export async function fetchAndScoreSentiment(ticker: string, companyName?: string, fallbackArticles?: Array<any>): Promise<{ positive: number; neutral: number; negative: number } | null> {
  const positiveWords = ['good', 'great', 'bull', 'beat', 'up', 'gain', 'growth', 'outperform', 'positive', 'rise'];
  const negativeWords = ['bad', 'fall', 'miss', 'down', 'drop', 'loss', 'decline', 'underperform', 'negative', 'sell'];

  function scoreText(text: string) {
    if (!text) return 0;
    const t = text.toLowerCase();
    let score = 0;
    for (const w of positiveWords) if (t.includes(w)) score += 1;
    for (const w of negativeWords) if (t.includes(w)) score -= 1;
    return score;
  }

  try {
    // Prefer Finnhub if available; cache responses to reduce calls
    const ttlMs = Number(process.env.SENTIMENT_CACHE_TTL_MS ?? '600000'); // default 10 minutes
    const finnhubKey = process.env.FINNHUB_API_KEY || process.env.FINNHUB_KEY;
    let articles: Array<{ title?: string; description?: string }> = [];

    if (finnhubKey) {
      const cacheKey = `finnhub:${ticker}`;
      const cached = await getCached<{ title?: string; description?: string }[]>(cacheKey, ttlMs);
      if (cached) {
        articles = cached;
      } else {
        try {
          const to = new Date();
          const from = new Date();
          from.setDate(to.getDate() - 7); // last 7 days
          const fromStr = from.toISOString().split('T')[0];
          const toStr = to.toISOString().split('T')[0];
          const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(ticker)}&from=${fromStr}&to=${toStr}&token=${finnhubKey}`;
          const res = await fetch(url, { cache: 'no-store' } as any);
          if (res.ok) {
            const json = await res.json();
            // Finnhub returns an array of news items with 'headline' and 'summary'
            articles = (json || []).slice(0, 20).map((a: any) => ({ title: a.headline || a.summary || '', description: a.summary || '' }));
            await setCached(cacheKey, articles);
          }
        } catch (e) {
          // ignore and fall back to other sources
        }
      }
    }

    // If no Finnhub articles, try NewsAPI if available (with cache)
    if ((!articles || articles.length === 0)) {
      const apiKey = process.env.NEWS_API_KEY || process.env.NEWSAPI_KEY;
      if (apiKey) {
        const cacheKey = `newsapi:${ticker}`;
        const cached = await getCached<{ title?: string; description?: string }[]>(cacheKey, ttlMs);
        if (cached) {
          articles = cached;
        } else {
          const q = encodeURIComponent(`${companyName ?? ticker} stock OR ${ticker}`);
          const url = `https://newsapi.org/v2/everything?q=${q}&language=en&pageSize=10&sortBy=publishedAt&apiKey=${apiKey}`;
          try {
            const res = await fetch(url, { cache: 'no-store' } as any);
            if (res.ok) {
              const json = await res.json();
              articles = (json.articles || []).map((a: any) => ({ title: a.title, description: a.description }));
              await setCached(cacheKey, articles);
            }
          } catch (e) {
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
