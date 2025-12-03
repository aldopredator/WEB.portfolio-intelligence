import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface AddTickerRequest {
  ticker: string;
  name: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AddTickerRequest = await request.json();
    const { ticker, name } = body;

    if (!ticker || !name) {
      return NextResponse.json(
        { error: 'Ticker and name are required' },
        { status: 400 }
      );
    }

    console.log('[Add Ticker API] Adding ticker:', ticker, name);

    // Read the current stock insights data
    const dataPath = path.join(process.cwd(), 'public', 'stock_insights_data.json');
    const fileContent = await fs.readFile(dataPath, 'utf-8');
    const stockData = JSON.parse(fileContent);

    // Check if ticker already exists
    if (stockData[ticker]) {
      return NextResponse.json(
        { message: 'Ticker already exists', ticker },
        { status: 200 }
      );
    }

    // Create placeholder data for the new ticker
    const placeholderData = {
      stock_data: {
        ticker: ticker,
        company: name,
        current_price: 0,
        change: 0,
        change_percent: 0,
        '52_week_high': 0,
        '52_week_low': 0,
        price_movement_30_days: Array.from({ length: 21 }, (_, i) => ({
          date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          price: 0
        }))
      },
      analyst_recommendations: {
        strong_buy: 0,
        buy: 0,
        hold: 0,
        sell: 0,
        strong_sell: 0,
        consensus: 'N/A',
        price_target: 0
      },
      social_sentiment: {
        positive: 0,
        neutral: 0,
        negative: 0,
        overall: 'N/A'
      },
      latest_news: [],
      emerging_trends: ['📊 Data loading...']
    };

    // Add the new ticker to the data
    stockData[ticker] = placeholderData;

    // Update timestamp
    stockData.timestamp = new Date().toISOString();

    // Write back to file
    try {
      await fs.writeFile(dataPath, JSON.stringify(stockData, null, 2), 'utf-8');
      console.log('[Add Ticker API] Successfully wrote file for ticker:', ticker);
    } catch (writeError) {
      console.error('[Add Ticker API] Error writing file:', writeError);
      return NextResponse.json(
        { error: 'Failed to save ticker data', details: writeError instanceof Error ? writeError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    console.log('[Add Ticker API] Successfully added ticker:', ticker);

    return NextResponse.json({
      success: true,
      message: `${ticker} has been added to your portfolio`,
      ticker,
      data: placeholderData
    });

  } catch (error) {
    console.error('[Add Ticker API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to add ticker', details: errorMessage },
      { status: 500 }
    );
  }
}
