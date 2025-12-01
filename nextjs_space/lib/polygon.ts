// Polygon.io API utility functions for fetching stock statistics
// Free tier: 5 calls per minute

export interface PolygonTickerDetails {
    name?: string;
    market_cap?: number;
    share_class_shares_outstanding?: number;
    weighted_shares_outstanding?: number;
}

export interface PolygonAggregates {
    volume?: number;
    close?: number;
    open?: number;
    high?: number;
    low?: number;
}

export interface PolygonStockStats {
    floatShares?: number | null;
    averageVolume10Day?: number | null;
    averageVolume?: number | null;
    sharesOutstanding?: number | null;
    dailyVolume?: number | null;
}

/**
 * Fetch ticker details from Polygon.io
 * Includes market cap, shares outstanding, and company info
 */
export async function fetchPolygonTickerDetails(ticker: string): Promise<PolygonTickerDetails | null> {
    const apiKey = process.env.POLYGON_API_KEY;
    
    if (!apiKey) {
        console.error('[POLYGON] API key not found in environment variables');
        return null;
    }
    
    console.log(`[POLYGON] Fetching ticker details for ${ticker} (API key exists: ${!!apiKey})`);
    
    try {
        const url = `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${apiKey}`;
        
        const response = await fetch(url, {
            cache: 'no-store'
        });
        
        if (!response.ok) {
            console.error(`[POLYGON] Ticker details API error for ${ticker}: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        
        if (data.status === 'ERROR') {
            console.error(`[POLYGON] API error for ${ticker}:`, data.error);
            return null;
        }
        
        return data.results || null;
    } catch (error) {
        console.error(`[POLYGON] Error fetching ticker details for ${ticker}:`, error);
        return null;
    }
}

/**
 * Fetch previous day's aggregates (including volume) from Polygon.io
 */
export async function fetchPolygonAggregates(ticker: string): Promise<PolygonAggregates | null> {
    const apiKey = process.env.POLYGON_API_KEY;
    
    if (!apiKey) {
        console.error('[POLYGON] API key not found in environment variables');
        return null;
    }
    
    try {
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${apiKey}`;
        
        const response = await fetch(url, {
            cache: 'no-store'
        });
        
        if (!response.ok) {
            console.error(`[POLYGON] Aggregates API error for ${ticker}: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        
        if (data.status === 'ERROR') {
            console.error(`[POLYGON] API error for ${ticker}:`, data.error);
            return null;
        }
        
        const result = data.results?.[0];
        if (!result) {
            return null;
        }
        
        return {
            volume: result.v,
            close: result.c,
            open: result.o,
            high: result.h,
            low: result.l
        };
    } catch (error) {
        console.error(`[POLYGON] Error fetching aggregates for ${ticker}:`, error);
        return null;
    }
}

/**
 * Helper to add delay between API calls
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch comprehensive stock statistics from Polygon.io
 * Combines ticker details and aggregates data
 * NOTE: Free tier limit is 5 calls/minute, so we add delays
 */
export async function fetchPolygonStockStats(ticker: string): Promise<PolygonStockStats | null> {
    try {
        // Fetch ticker details first
        const details = await fetchPolygonTickerDetails(ticker);
        
        // Add 250ms delay between calls to respect rate limits (5 calls/min = 12 sec/call, but we batch them)
        await delay(250);
        
        // Fetch aggregates
        const aggregates = await fetchPolygonAggregates(ticker);
        
        if (!details && !aggregates) {
            console.log(`[POLYGON] No data available for ${ticker}`);
            return null;
        }
        
        const stats: PolygonStockStats = {
            // Use weighted shares outstanding as an estimate for float
            // (actual float shares not available in free tier)
            floatShares: details?.weighted_shares_outstanding || null,
            sharesOutstanding: details?.share_class_shares_outstanding || null,
            dailyVolume: aggregates?.volume || null,
            // Polygon.io free tier doesn't provide average volume calculations
            // These would need to be calculated from historical data
            averageVolume10Day: null,
            averageVolume: null
        };
        
        console.log(`[POLYGON] ✅ Stats fetched for ${ticker}:`, JSON.stringify(stats));
        
        return stats;
    } catch (error) {
        console.error(`[POLYGON] Error fetching stock stats for ${ticker}:`, error);
        return null;
    }
}
