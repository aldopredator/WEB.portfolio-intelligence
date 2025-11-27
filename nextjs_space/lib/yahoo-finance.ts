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
}

/**
 * Fetch real-time stock quote from Yahoo Finance
 * Uses the unofficial Yahoo Finance API endpoint
 */
export async function fetchYahooQuote(ticker: string): Promise<StockQuote | null> {
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

        return {
            ticker,
            current_price: Number(currentPrice.toFixed(2)),
            change: Number(change.toFixed(2)),
            change_percent: Number(changePercent.toFixed(2)),
            previous_close: Number(previousClose.toFixed(2)),
            '52_week_high': Number((meta.fiftyTwoWeekHigh || 0).toFixed(2)),
            '52_week_low': Number((meta.fiftyTwoWeekLow || 0).toFixed(2)),
            price_history,
            target_price
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
