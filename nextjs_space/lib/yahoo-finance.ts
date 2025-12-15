// Yahoo Finance API utility functions for fetching real-time stock data

import YahooFinance from 'yahoo-finance2';

// Initialize yahoo-finance2 instance
const yahooFinance = new YahooFinance();

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
    floatShares?: number | null;              // Free float shares
    averageVolume10Day?: number | null;       // 10-day average volume
    averageVolume?: number | null;            // Average volume (3 months)
    sharesOutstanding?: number | null;        // Total shares outstanding
    heldPercentInsiders?: number | null;      // % held by insiders
    heldPercentInstitutions?: number | null;  // % held by institutions
    fiftyTwoWeekHigh?: number | null;         // 52-week high price
    fiftyTwoWeekLow?: number | null;          // 52-week low price
    fiftyDayAverage?: number | null;          // 50-day moving average
    twoHundredDayAverage?: number | null;     // 200-day moving average
    returnOnAssets?: number | null;           // Return on Assets (ttm)
    debtToEquity?: number | null;             // Total Debt/Equity (mrq)
    quarterlyRevenueGrowth?: number | null;   // Quarterly Revenue Growth (yoy)
    quarterlyEarningsGrowth?: number | null;  // Quarterly Earnings Growth (yoy)
    priceToSales?: number | null;             // Price/Sales (ttm)
    enterpriseValue?: number | null;          // Enterprise Value
    enterpriseToRevenue?: number | null;      // Enterprise Value/Revenue
    enterpriseToEbitda?: number | null;       // Enterprise Value/EBITDA
    trailingPE?: number | null;               // Trailing P/E
    forwardPE?: number | null;                // Forward P/E
    pegRatio?: number | null;                 // PEG Ratio (5yr expected)
    priceToBook?: number | null;              // Price/Book
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
 * Uses the yahoo-finance2 package which handles authentication automatically
 * 
 * Fields returned:
 * - floatShares: Number of shares available for public trading (free float)
 * - averageVolume10Day: 10-day average trading volume
 * - averageVolume: Average volume (3 months)
 * - sharesOutstanding: Total number of shares issued
 * - heldPercentInsiders: % held by insiders
 * - heldPercentInstitutions: % held by institutions
 * - fiftyTwoWeekHigh: 52-week high price
 * - fiftyTwoWeekLow: 52-week low price
 * - fiftyDayAverage: 50-day moving average
 * - twoHundredDayAverage: 200-day moving average
 * - returnOnAssets: Return on Assets (ttm)
 * - debtToEquity: Total Debt/Equity (mrq)
 * - quarterlyRevenueGrowth: Quarterly Revenue Growth (yoy)
 * - quarterlyEarningsGrowth: Quarterly Earnings Growth (yoy)
 * - priceToSales: Price/Sales (ttm)
 */
export async function fetchYahooStatistics(ticker: string): Promise<YahooStockStatistics | null> {
    // Check if Yahoo Finance is enabled
    if (process.env.ENABLE_YAHOO_FINANCE === 'false') {
        console.log(`[YAHOO] Yahoo Finance is disabled via ENABLE_YAHOO_FINANCE env var`);
        return null;
    }
    
    try {
        console.log(`[YAHOO] 🔍 Fetching statistics for ${ticker} using yahoo-finance2...`);
        
        // Fetch quoteSummary with multiple modules for comprehensive data
        const result: any = await yahooFinance.quoteSummary(ticker, {
            modules: ['defaultKeyStatistics', 'summaryDetail', 'financialData']
        });
        
        const stats = result?.defaultKeyStatistics;
        const summary = result?.summaryDetail;
        const financial = result?.financialData;
        
        if (!stats && !summary && !financial) {
            console.error(`[YAHOO] ❌ No statistics data found for ${ticker}`);
            return null;
        }
        
        // Extract values from defaultKeyStatistics
        const floatShares = stats?.floatShares || null;
        const averageVolume10Day = summary?.averageDailyVolume10Day || null;
        const averageVolume = summary?.averageVolume || null;
        const sharesOutstanding = stats?.sharesOutstanding || null;
        const heldPercentInsiders = stats?.heldPercentInsiders ? stats.heldPercentInsiders * 100 : null;
        const heldPercentInstitutions = stats?.heldPercentInstitutions ? stats.heldPercentInstitutions * 100 : null;
        
        // Extract values from summaryDetail
        const fiftyTwoWeekHigh = summary?.fiftyTwoWeekHigh || null;
        const fiftyTwoWeekLow = summary?.fiftyTwoWeekLow || null;
        const fiftyDayAverage = summary?.fiftyDayAverage || null;
        const twoHundredDayAverage = summary?.twoHundredDayAverage || null;
        
        // Extract financial metrics from financialData
        const returnOnAssets = financial?.returnOnAssets ? financial.returnOnAssets * 100 : null;
        const debtToEquity = financial?.debtToEquity || null;
        const quarterlyRevenueGrowth = financial?.revenueGrowth ? financial.revenueGrowth * 100 : null;
        const quarterlyEarningsGrowth = financial?.earningsGrowth ? financial.earningsGrowth * 100 : null;
        
        // Extract price ratios from summaryDetail or defaultKeyStatistics
        const priceToSales = summary?.priceToSalesTrailing12Months || null;
        
        // Extract valuation metrics from defaultKeyStatistics
        const enterpriseValue = stats?.enterpriseValue || null;
        const enterpriseToRevenue = stats?.enterpriseToRevenue || null;
        const enterpriseToEbitda = stats?.enterpriseToEbitda || null;
        const trailingPE = summary?.trailingPE || null;
        const forwardPE = stats?.forwardPE || null;
        const pegRatio = stats?.pegRatio || null;
        const priceToBook = stats?.priceToBook || null;
        
        console.log(`[YAHOO] ✅ ${ticker} - Float: ${floatShares}, Outstanding: ${sharesOutstanding}, ROA: ${returnOnAssets}%, D/E: ${debtToEquity}, P/S: ${priceToSales}`);
        
        return {
            floatShares,
            averageVolume10Day,
            averageVolume,
            sharesOutstanding,
            heldPercentInsiders,
            heldPercentInstitutions,
            fiftyTwoWeekHigh,
            fiftyTwoWeekLow,
            fiftyDayAverage,
            twoHundredDayAverage,
            returnOnAssets,
            debtToEquity,
            quarterlyRevenueGrowth,
            quarterlyEarningsGrowth,
            priceToSales,
            enterpriseValue,
            enterpriseToRevenue,
            enterpriseToEbitda,
            trailingPE,
            forwardPE,
            pegRatio,
            priceToBook
        };
    } catch (error) {
        console.error(`[YAHOO] ❌ Error fetching statistics for ${ticker}:`, error);
        return null;
    }
}

/**
 * Check if a ticker is likely a non-US stock that needs Yahoo Finance fallback
 * European stocks typically have format: XXX.PA, XXX.DE, XXX.L, etc.
 */
export function shouldUseYahooFinance(ticker: string): boolean {
  // Common European and international exchange suffixes
  const internationalExchanges = [
    '.PA',  // Euronext Paris (France)
    '.DE',  // Xetra (Germany)
    '.F',   // Frankfurt (Germany)
    '.L',   // London Stock Exchange (UK)
    '.MI',  // Milan (Italy)
    '.AS',  // Amsterdam (Netherlands)
    '.BR',  // Brussels (Belgium)
    '.MC',  // Madrid (Spain)
    '.LS',  // Lisbon (Portugal)
    '.SW',  // SIX Swiss Exchange
    '.HE',  // Helsinki (Finland)
    '.ST',  // Stockholm (Sweden)
    '.OL',  // Oslo (Norway)
    '.CO',  // Copenhagen (Denmark)
    '.VI',  // Vienna (Austria)
    '.HK',  // Hong Kong
    '.T',   // Tokyo Stock Exchange
    '.TO',  // Toronto Stock Exchange
  ];

  return internationalExchanges.some(suffix => ticker.endsWith(suffix));
}

/**
 * Fetch company profile using Yahoo Finance (works for international stocks)
 * Better alternative to Finnhub for non-US stocks like MC.PA, SU.PA, GLE.PA
 */
export async function fetchYahooCompanyProfile(ticker: string) {
  try {
    console.log(`[YAHOO] ${ticker} - Fetching company profile`);
    
    const modules = await yahooFinance.quoteSummary(ticker, {
      modules: ['assetProfile', 'price', 'summaryDetail']
    });

    if (!modules) {
      console.warn(`[YAHOO] ${ticker} - No profile data returned`);
      return null;
    }

    const assetProfile = modules.assetProfile || {};
    const price = modules.price || {};
    const summaryDetail = modules.summaryDetail || {};

    console.log(`[YAHOO] ✅ ${ticker} - Successfully fetched profile`);

    return {
      name: price.longName || price.shortName,
      logo: assetProfile.website ? `https://logo.clearbit.com/${assetProfile.website.replace(/^https?:\/\//, '').split('/')[0]}` : undefined,
      industry: assetProfile.industry,
      sector: assetProfile.sector,
      country: assetProfile.country,
      marketCapitalization: price.marketCap || summaryDetail.marketCap,
      currency: price.currency,
      weburl: assetProfile.website,
    };
  } catch (error) {
    console.error(`[YAHOO] ❌ ${ticker} - Error fetching profile:`, error);
    return null;
  }
}
