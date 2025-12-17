import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
  shortname?: string;
  longname?: string;
  name?: string; // Sometimes Yahoo uses this
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
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', type: 'Equity' },
  { symbol: 'BE', name: 'Bloom Energy Corporation', exchange: 'NYSE', type: 'Equity' },
  { symbol: 'INTU', name: 'Intuit Inc.', exchange: 'NASDAQ', type: 'Equity' },
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

    let searchResults: any[] = [];

    // Try Yahoo Finance first (it has a much larger database)
    // Only use static results as a fallback or to supplement Yahoo results
    try {
      console.log('[Search API] Trying Yahoo Finance...');
      const yahooResponse = await fetch(
        `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0&enableFuzzyQuery=true`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          },
        }
      );

      console.log('[Search API] Yahoo response status:', yahooResponse.status);

      if (yahooResponse.ok) {
        const data = await yahooResponse.json();
        const quotes = data.quotes || [];
        
        console.log('[Search API] Yahoo quotes found:', quotes.length);
        
        searchResults = quotes
          .filter((q: YahooSearchResult) => q.symbol && (q.shortname || q.longname || q.name))
          .map((quote: YahooSearchResult) => ({
            symbol: quote.symbol,
            name: quote.shortname || quote.longname || quote.name || quote.symbol,
            exchange: quote.exchDisp || quote.exch || 'N/A',
            type: quote.typeDisp || quote.type || 'Equity',
            region: quote.exch?.includes('NAS') || quote.exch?.includes('NYQ') ? 'United States' : undefined,
            currency: 'USD',
          }))
          .slice(0, 15);
      }
    } catch (yahooError) {
      console.error('[Search API] Yahoo Finance API error:', yahooError);
    }

    // If Yahoo didn't work, return static results if we have any
    if (searchResults.length === 0 && staticResults.length > 0) {
      searchResults = staticResults;
    }

    // If still no results, try Alpha Vantage
    if (searchResults.length === 0) {
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
            
            searchResults = matches.map((match: AlphaVantageSearchResult) => ({
              symbol: match['1. symbol'],
              name: match['2. name'],
              exchange: match['4. region'],
              type: match['3. type'],
              region: match['4. region'],
              currency: match['8. currency'],
            }));
          }
        } catch (avError) {
          console.error('[Search API] Alpha Vantage API error:', avError);
        }
      }
    }

    // Last resort: return a generic result
    if (searchResults.length === 0) {
      console.log('[Search API] Returning generic fallback');
      searchResults = [
        { 
          symbol: query.toUpperCase(), 
          name: query.toUpperCase(), 
          exchange: '', 
          type: 'Equity', 
          region: '',
          currency: ''
        },
      ];
    }

    // Now check which tickers already exist in portfolios
    const tickers = searchResults.map((r: any) => r.symbol);
    const existingStocks = await prisma.stock.findMany({
      where: {
        ticker: {
          in: tickers,
        },
      },
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Map portfolio info to search results
    const resultsWithPortfolio = searchResults.map((result: any) => {
      const existingStock = existingStocks.find(s => s.ticker === result.symbol);
      return {
        ...result,
        portfolioId: existingStock?.portfolioId || null,
        portfolioName: existingStock?.portfolio?.name || null,
      };
    });

    return NextResponse.json({ results: resultsWithPortfolio });

  } catch (error) {
    console.error('[Search API] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to search tickers' },
      { status: 500 }
    );
  }
}
