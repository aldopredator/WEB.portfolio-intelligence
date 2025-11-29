import { NextRequest, NextResponse } from 'next/server';
import { fetchMultipleQuotes } from '@/lib/yahoo-finance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * API Route: GET /api/stock
 * Fetches real-time stock quotes for multiple tickers
 * Query params: tickers (comma-separated list)
 * Example: /api/stock?tickers=NVDA,META,TSLA
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const tickersParam = searchParams.get('tickers');

        if (!tickersParam) {
            return NextResponse.json(
                { error: 'Missing tickers parameter' },
                { status: 400 }
            );
        }

        // Parse comma-separated tickers
        const tickers = tickersParam.split(',').map((t: string) => t.trim().toUpperCase());

        if (tickers.length === 0) {
            return NextResponse.json(
                { error: 'No valid tickers provided' },
                { status: 400 }
            );
        }

        // Check if Yahoo Finance is enabled
        if (process.env.ENABLE_YAHOO_FINANCE === 'false') {
            return NextResponse.json({
                success: false,
                error: 'Yahoo Finance is disabled',
                message: 'Yahoo Finance API is disabled via ENABLE_YAHOO_FINANCE environment variable',
                timestamp: new Date().toISOString(),
            }, { status: 503 });
        }

        // Fetch quotes from Yahoo Finance
        const quotes = await fetchMultipleQuotes(tickers);

        return NextResponse.json({
            success: true,
            data: quotes,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in stock API route:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock data' },
            { status: 500 }
        );
    }
}
