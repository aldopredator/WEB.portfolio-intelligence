import { getCached, setCached } from './cache';

// Simple keyword-based sentiment scoring as a fallback or lightweight option.
export async function fetchAndScoreSentiment(ticker: string, companyName?: string, fallbackArticles?: Array<any>): Promise<{ positive: number; neutral: number; negative: number } | null> {
  console.log(`[SENTIMENT] Starting sentiment analysis for ${ticker}`);

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
        console.log(`[SENTIMENT] ${ticker} - Using cached Finnhub news (${articles.length} articles)`);
      } else {
        try {
          const to = new Date();
          const from = new Date();
          from.setDate(to.getDate() - 7); // last 7 days
          const fromStr = from.toISOString().split('T')[0];
          const toStr = to.toISOString().split('T')[0];
          const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(ticker)}&from=${fromStr}&to=${toStr}&token=${finnhubKey}`;

          console.log(`[SENTIMENT] ${ticker} - Fetching Finnhub news from ${fromStr} to ${toStr}`);
          const res = await fetch(url, { cache: 'no-store' } as any);

          if (res.ok) {
            const json = await res.json();
            // Finnhub returns an array of news items with 'headline' and 'summary'
            articles = (json || []).slice(0, 20).map((a: any) => ({ title: a.headline || a.summary || '', description: a.summary || '' }));
            await setCached(cacheKey, articles);
            console.log(`[SENTIMENT] ${ticker} - Fetched ${articles.length} articles from Finnhub`);
          } else {
            console.warn(`[SENTIMENT] ${ticker} - Finnhub API returned status ${res.status}`);
          }
        } catch (e) {
          console.error(`[SENTIMENT] ${ticker} - Error fetching from Finnhub:`, e);
        }
      }
    } else {
      console.warn(`[SENTIMENT] ${ticker} - No Finnhub API key configured`);
    }

    // If no Finnhub articles, try NewsAPI if available (with cache)
    if ((!articles || articles.length === 0)) {
      const apiKey = process.env.NEWS_API_KEY || process.env.NEWSAPI_KEY;
      if (apiKey) {
        const cacheKey = `newsapi:${ticker}`;
        const cached = await getCached<{ title?: string; description?: string }[]>(cacheKey, ttlMs);
        if (cached) {
          articles = cached;
          console.log(`[SENTIMENT] ${ticker} - Using cached NewsAPI articles (${articles.length} articles)`);
        } else {
          const q = encodeURIComponent(`${companyName ?? ticker} stock OR ${ticker}`);
          const url = `https://newsapi.org/v2/everything?q=${q}&language=en&pageSize=10&sortBy=publishedAt&apiKey=${apiKey}`;
          try {
            console.log(`[SENTIMENT] ${ticker} - Fetching from NewsAPI`);
            const res = await fetch(url, { cache: 'no-store' } as any);
            if (res.ok) {
              const json = await res.json();
              articles = (json.articles || []).map((a: any) => ({ title: a.title, description: a.description }));
              await setCached(cacheKey, articles);
              console.log(`[SENTIMENT] ${ticker} - Fetched ${articles.length} articles from NewsAPI`);
            } else {
              console.warn(`[SENTIMENT] ${ticker} - NewsAPI returned status ${res.status}`);
            }
          } catch (e) {
            console.error(`[SENTIMENT] ${ticker} - Error fetching from NewsAPI:`, e);
          }
        }
      } else {
        console.warn(`[SENTIMENT] ${ticker} - No NewsAPI key configured`);
      }
    }

    // If no articles from API, try fallbackArticles (from static JSON)
    if ((!articles || articles.length === 0) && Array.isArray(fallbackArticles) && fallbackArticles.length > 0) {
      // Expect fallback articles to have title/summary fields; adapt if different
      articles = fallbackArticles.slice(0, 10).map((a: any) => ({ title: a.title || a.headline || a.summary || '', description: a.description || a.summary || '' }));
      console.log(`[SENTIMENT] ${ticker} - Using ${articles.length} fallback articles from static data`);
    }

    if (!articles || articles.length === 0) {
      console.warn(`[SENTIMENT] ${ticker} - No articles found for sentiment analysis`);
      return null;
    }

    let positive = 0, neutral = 0, negative = 0;
    for (const a of articles) {
      const text = `${a.title ?? ''} ${a.description ?? ''}`;
      const s = scoreText(text);
      if (s > 0) positive += 1;
      else if (s < 0) negative += 1;
      else neutral += 1;
    }

    const total = positive + neutral + negative || 1;
    const result = {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      negative: Math.round((negative / total) * 100)
    };

    console.log(`[SENTIMENT] ${ticker} - Analysis complete:`, {
      articlesAnalyzed: total,
      result,
      breakdown: { positive, neutral, negative }
    });

    return result;
  } catch (err) {
    console.error(`[SENTIMENT] ${ticker} - Unexpected error:`, err);
    return null;
  }
}
