// Yahoo Finance API utility functions for fetching real-time stock data

export interface YahooQuoteResponse {
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    regularMarketPreviousClose: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    symbol: string;
}

export interface StockQuote {
    ticker: string;
    current_price: number;
    change: number;
    change_percent: number;
    previous_close: number;
    '52_week_high': number;
    '52_week_low': number;
    price_history: { Date: string; Close: number }[];
    target_price: number;
    market_cap?: number;
    volume?: number;
    currency?: string;
}

export interface YahooStockStatistics {
    floatShares?: number;              // Free float shares
    averageVolume10Day?: number;       // 10-day average volume
    averageVolume?: number;            // Average volume (longer period)
    sharesOutstanding?: number;        // Total shares outstanding
}

/**
 * Fetch real-time stock quote from Yahoo Finance
 * Uses the unofficial Yahoo Finance API endpoint
 */
export async function fetchYahooQuote(ticker: string): Promise<StockQuote | null> {
    // Check if Yahoo Finance is enabled
    if (process.env.ENABLE_YAHOO_FINANCE === 'false') {
        console.log(`[YAHOO] Yahoo Finance is disabled via ENABLE_YAHOO_FINANCE env var`);
        return null;
    }
    
    try {
        // Yahoo Finance query API endpoint with historical data
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1mo&interval=1d`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            },
            cache: 'no-store', // Don't cache in production
        });

        if (!response.ok) {
            console.error(`Yahoo Finance API error for ${ticker}: ${response.status}`);
            return null;
        }

        const data = await response.json();

        // Extract quote data from response
        const result = data?.chart?.result?.[0];
        if (!result) {
            console.error(`No data found for ticker: ${ticker}`);
            return null;
        }

        const meta = result.meta;
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose || meta.previousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        // Extract historical data
        const timestamps = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0] || {};
        const closes = quotes.close || [];

        const price_history = timestamps.map((timestamp: number, index: number) => ({
            Date: new Date(timestamp * 1000).toISOString(),
            Close: closes[index] || 0
        })).filter((item: any) => item.Close > 0); // Filter out null/zero values

        // Extract target price if available (often in meta.targetMeanPrice)
        const target_price = meta.targetMeanPrice || 0;
        const market_cap = meta.marketCap || (meta?.marketCap?.raw ?? 0) || 0;
        const volume = meta.regularMarketVolume || 0;
        const currency = meta.currency || '';

        return {
            ticker,
            current_price: Number(currentPrice.toFixed(2)),
            change: Number(change.toFixed(2)),
            change_percent: Number(changePercent.toFixed(2)),
            previous_close: Number(previousClose.toFixed(2)),
            '52_week_high': Number((meta.fiftyTwoWeekHigh || 0).toFixed(2)),
            '52_week_low': Number((meta.fiftyTwoWeekLow || 0).toFixed(2)),
            price_history,
            target_price,
            market_cap: Number(market_cap),
            volume: Number(volume),
            currency
        };
    } catch (error) {
        console.error(`Error fetching quote for ${ticker}:`, error);
        return null;
    }
}

/**
 * Fetch multiple stock quotes in parallel
 */
export async function fetchMultipleQuotes(tickers: string[]): Promise<Record<string, StockQuote>> {
    const quotes: Record<string, StockQuote> = {};

    // Fetch all quotes in parallel
    const results = await Promise.allSettled(
        tickers.map((ticker: string) => fetchYahooQuote(ticker))
    );

    // Process results
    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
            quotes[tickers[index]] = result.value;
        }
    });

    return quotes;
}

/**
 * Fetch only 30-day price history from Yahoo Finance (for charts)
 * 
 * DATA SOURCE POLICY:
 * - Primary source: Finnhub API (use when available)
 * - Fallback source: Yahoo Finance (use only when Finnhub data not provided or subject to paid subscription)
 * 
 * This function implements the fallback for 30-day price history because:
 * - Finnhub /stock/candle returns 403 errors (requires paid subscription on free tier)
 * - Yahoo Finance provides free, reliable historical chart data without authentication
 * 
 * All other data (real-time quotes, financial metrics) uses Finnhub as primary source.
 */
export async function fetchYahooPriceHistory(ticker: string): Promise<{ Date: string; Close: number }[]> {
    // Check if Yahoo Finance is enabled
    if (process.env.ENABLE_YAHOO_FINANCE === 'false') {
        console.log(`[YAHOO] Yahoo Finance is disabled via ENABLE_YAHOO_FINANCE env var`);
        return [];
    }
    
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1mo&interval=1d`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            },
            next: { revalidate: 86400 } // 1 day cache
        } as any);

        if (!response.ok) {
            console.error(`Yahoo Finance chart API error for ${ticker}: ${response.status}`);
            return [];
        }

        const data = await response.json();
        const result = data?.chart?.result?.[0];
        if (!result) {
            return [];
        }

        const timestamps = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0] || {};
        const closes = quotes.close || [];

        return timestamps.map((timestamp: number, index: number) => ({
            Date: new Date(timestamp * 1000).toISOString(),
            Close: Number((closes[index] || 0).toFixed(2))
        })).filter((item: any) => item.Close > 0);
    } catch (error) {
        console.error(`Error fetching price history for ${ticker}:`, error);
        return [];
    }
}

/**
 * Fetch stock statistics including free-float and average volume from Yahoo Finance
 * 
 * This provides key statistics not available in Finnhub free tier:
 * - floatShares: Number of shares available for public trading (free float)
 * - averageDailyVolume10Day: 10-day average trading volume
 * - averageVolume: Longer-term average volume
 * - sharesOutstanding: Total number of shares issued
 */
export async function fetchYahooStatistics(ticker: string): Promise<YahooStockStatistics | null> {
    // Check if Yahoo Finance is enabled
    if (process.env.ENABLE_YAHOO_FINANCE === 'false') {
        console.log(`[YAHOO] Yahoo Finance is disabled via ENABLE_YAHOO_FINANCE env var`);
        return null;
    }
    
    try {
        const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=defaultKeyStatistics`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            },
            cache: 'no-store'
        });
        
        if (!response.ok) {
            console.error(`Yahoo Finance statistics API error for ${ticker}: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        const stats = data?.quoteSummary?.result?.[0]?.defaultKeyStatistics;
        
        if (!stats) {
            console.error(`No statistics data found for ticker: ${ticker}`);
            return null;
        }
        
        return {
            floatShares: stats?.floatShares?.raw || 0,
            averageVolume10Day: stats?.averageDailyVolume10Day?.raw || 0,
            averageVolume: stats?.averageVolume?.raw || 0,
            sharesOutstanding: stats?.sharesOutstanding?.raw || 0
        };
    } catch (error) {
        console.error(`Error fetching statistics for ${ticker}:`, error);
        return null;
    }
}
