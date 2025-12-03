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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 1) {
      return NextResponse.json({ results: [] });
    }

    // Try Yahoo Finance first (free, no API key needed)
    try {
      const yahooResponse = await fetch(
        `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (yahooResponse.ok) {
        const data = await yahooResponse.json();
        const quotes = data.quotes || [];
        
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

        return NextResponse.json({ results });
      }
    } catch (yahooError) {
      console.error('Yahoo Finance API error:', yahooError);
    }

    // Fallback: Try Alpha Vantage if API key is available
    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (alphaVantageKey) {
      try {
        const avResponse = await fetch(
          `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${alphaVantageKey}`
        );

        if (avResponse.ok) {
          const data = await avResponse.json();
          const matches = data.bestMatches || [];
          
          const results = matches.map((match: AlphaVantageSearchResult) => ({
            symbol: match['1. symbol'],
            name: match['2. name'],
            exchange: match['4. region'],
            type: match['3. type'],
            region: match['4. region'],
            currency: match['8. currency'],
          }));

          return NextResponse.json({ results });
        }
      } catch (avError) {
        console.error('Alpha Vantage API error:', avError);
      }
    }

    // If all APIs fail, return mock data for development
    const mockResults = [
      { symbol: query.toUpperCase(), name: `${query.toUpperCase()} Corporation`, exchange: 'NASDAQ', type: 'Equity', region: 'United States' },
    ];

    return NextResponse.json({ results: mockResults });

  } catch (error) {
    console.error('Search ticker error:', error);
    return NextResponse.json(
      { error: 'Failed to search tickers' },
      { status: 500 }
    );
  }
}
