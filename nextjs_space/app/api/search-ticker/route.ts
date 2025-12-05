import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AlphaVantageSearchResult {
  '1. symbol': string;
  '2. name': string;
  '3. type': string;
  '4. region': string;
  '5. marketOpen': string;
  '6. marketClose': string;
  '7. timezone': string;
  '8. currency': string;
  '9. matchScore': string;
}

interface YahooSearchResult {
  symbol: string;
  name: string;
  exch: string;
  type: string;
  exchDisp: string;
  typeDisp: string;
}

// Static database of common tickers as fallback
const COMMON_TICKERS = [
  { symbol: 'GOOG', name: 'Alphabet Inc.', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway Inc. Class B', exchange: 'NYSE', type: 'Equity' },
  { symbol: 'ISRG', name: 'Intuitive Surgical Inc.', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'IDXX', name: 'IDEXX Laboratories Inc.', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'III', name: '3i Group plc', exchange: 'LSE', type: 'Equity' },
  { symbol: 'PLTR', name: 'Palantir Technologies Inc.', exchange: 'NYSE', type: 'Equity' },
  { symbol: 'QBTS', name: 'D-Wave Quantum Inc.', exchange: 'NYSE', type: 'Equity' },
  { symbol: 'RGTI', name: 'Rigetti Computing Inc.', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'BXXX', name: 'BXX Holdings', exchange: 'NYSE', type: 'Equity' },
  { symbol: 'CW8U.PA', name: 'Amundi MSCI World UCITS ETF', exchange: 'Euronext Paris', type: 'ETF' },
  { symbol: 'MWRL.L', name: 'Amundi Core MSCI World UCITS ETF', exchange: 'LSE', type: 'ETF' },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    console.log('[Search API] Query:', query);

    if (!query || query.length < 1) {
      return NextResponse.json({ results: [] });
    }

    const queryLower = query.toLowerCase();

    // First, search in our static database
    const staticResults = COMMON_TICKERS.filter(ticker => 
      ticker.symbol.toLowerCase().includes(queryLower) || 
      ticker.name.toLowerCase().includes(queryLower)
    ).map(ticker => ({
      ...ticker,
      region: ticker.exchange.includes('NASDAQ') || ticker.exchange.includes('NYSE') ? 'United States' : undefined,
      currency: 'USD',
    }));

    console.log('[Search API] Static results:', staticResults.length);

    // If we found results in static database, return them
    if (staticResults.length > 0) {
      return NextResponse.json({ results: staticResults });
    }

    // Try Yahoo Finance for other tickers
    try {
      console.log('[Search API] Trying Yahoo Finance...');
      const yahooResponse = await fetch(
        `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      console.log('[Search API] Yahoo response status:', yahooResponse.status);

      if (yahooResponse.ok) {
        const data = await yahooResponse.json();
        const quotes = data.quotes || [];
        
        console.log('[Search API] Yahoo quotes found:', quotes.length);
        
        const results = quotes
          .filter((q: YahooSearchResult) => q.symbol && q.name)
          .map((quote: YahooSearchResult) => ({
            symbol: quote.symbol,
            name: quote.name,
            exchange: quote.exchDisp || quote.exch || 'N/A',
            type: quote.typeDisp || quote.type || 'Equity',
            region: quote.exch?.includes('NAS') || quote.exch?.includes('NYQ') ? 'United States' : undefined,
            currency: 'USD',
          }))
          .slice(0, 10);

        if (results.length > 0) {
          return NextResponse.json({ results });
        }
      }
    } catch (yahooError) {
      console.error('[Search API] Yahoo Finance API error:', yahooError);
    }

    // Fallback: Try Alpha Vantage if API key is available
    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (alphaVantageKey) {
      try {
        console.log('[Search API] Trying Alpha Vantage...');
        const avResponse = await fetch(
          `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${alphaVantageKey}`
        );

        if (avResponse.ok) {
          const data = await avResponse.json();
          const matches = data.bestMatches || [];
          
          console.log('[Search API] Alpha Vantage matches:', matches.length);
          
          const results = matches.map((match: AlphaVantageSearchResult) => ({
            symbol: match['1. symbol'],
            name: match['2. name'],
            exchange: match['4. region'],
            type: match['3. type'],
            region: match['4. region'],
            currency: match['8. currency'],
          }));

          if (results.length > 0) {
            return NextResponse.json({ results });
          }
        }
      } catch (avError) {
        console.error('[Search API] Alpha Vantage API error:', avError);
      }
    }

    // Last resort: return a generic result
    console.log('[Search API] Returning generic fallback');
    const fallbackResults = [
      { 
        symbol: query.toUpperCase(), 
        name: query.toUpperCase(), 
        exchange: '', 
        type: 'Equity', 
        region: '',
        currency: ''
      },
    ];

    return NextResponse.json({ results: fallbackResults });

  } catch (error) {
    console.error('[Search API] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to search tickers' },
      { status: 500 }
    );
  }
}
