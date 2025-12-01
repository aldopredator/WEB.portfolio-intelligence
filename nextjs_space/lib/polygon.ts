// Polygon.io API utility functions for fetching stock statistics
// Free tier: 5 calls per minute

export interface PolygonTickerDetails {
    name?: string;
    market_cap?: number;
    share_class_shares_outstanding?: number;
    weighted_shares_outstanding?: number;
    total_employees?: number;
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
    totalEmployees?: number | null;
}

/**
 * Fetch ticker details from Polygon.io
 * Includes market cap, shares outstanding, and company info
 */
export async function fetchPolygonTickerDetails(ticker: string): Promise<PolygonTickerDetails | null> {
    const apiKey = process.env.POLYGON_API_KEY;
    
    console.log(`[POLYGON] 🔍 fetchPolygonTickerDetails called for ${ticker}`);
    console.log(`[POLYGON] 🔑 API key exists: ${!!apiKey}, length: ${apiKey?.length || 0}`);
    
    if (!apiKey) {
        console.error('[POLYGON] ❌ API key not found in environment variables');
        return null;
    }
    
    try {
        const url = `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${apiKey}`;
        console.log(`[POLYGON] 📡 Fetching: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
        
        const response = await fetch(url, {
            next: { revalidate: 86400 } // Cache for 24 hours
        });
        
        console.log(`[POLYGON] 📊 Response status for ${ticker}: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[POLYGON] ❌ Ticker details API error for ${ticker}: ${response.status}`, errorText);
            return null;
        }
        
        const data = await response.json();
        console.log(`[POLYGON] 📦 Data received for ${ticker}:`, JSON.stringify(data).substring(0, 200));
        
        if (data.status === 'ERROR') {
            console.error(`[POLYGON] ❌ API error for ${ticker}:`, data.error);
            return null;
        }
        
        const results = data.results || null;
        console.log(`[POLYGON] ✅ Returning results for ${ticker}:`, results ? 'data exists' : 'null');
        return results;
    } catch (error) {
        console.error(`[POLYGON] ❌ Exception fetching ticker details for ${ticker}:`, error);
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
            next: { revalidate: 86400 } // Cache for 24 hours
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
    console.log(`[POLYGON] 🚀 fetchPolygonStockStats START for ${ticker}`);
    
    try {
        // Fetch ticker details first
        console.log(`[POLYGON] ⏳ Calling fetchPolygonTickerDetails for ${ticker}...`);
        const details = await fetchPolygonTickerDetails(ticker);
        console.log(`[POLYGON] 📋 Details result for ${ticker}:`, details ? JSON.stringify(details) : 'null');
        
        // Add 250ms delay between calls to respect rate limits (5 calls/min = 12 sec/call, but we batch them)
        await delay(250);
        
        // Fetch aggregates
        console.log(`[POLYGON] ⏳ Calling fetchPolygonAggregates for ${ticker}...`);
        const aggregates = await fetchPolygonAggregates(ticker);
        console.log(`[POLYGON] 📊 Aggregates result for ${ticker}:`, aggregates ? JSON.stringify(aggregates) : 'null');
        
        if (!details && !aggregates) {
            console.log(`[POLYGON] ⚠️ No data available for ${ticker}`);
            return null;
        }
        
        const stats: PolygonStockStats = {
            // Use weighted shares outstanding as an estimate for float
            // (actual float shares not available in free tier)
            floatShares: details?.weighted_shares_outstanding || null,
            sharesOutstanding: details?.share_class_shares_outstanding || null,
            dailyVolume: aggregates?.volume || null,
            totalEmployees: details?.total_employees || null,
            // Polygon.io free tier doesn't provide average volume calculations
            // These would need to be calculated from historical data
            averageVolume10Day: null,
            averageVolume: null
        };
        
        console.log(`[POLYGON] ✅ Stats constructed for ${ticker}:`, JSON.stringify(stats));
        console.log(`[POLYGON] 🏁 fetchPolygonStockStats END for ${ticker}`);
        
        return stats;
    } catch (error) {
        console.error(`[POLYGON] Error fetching stock stats for ${ticker}:`, error);
        return null;
    }
}
