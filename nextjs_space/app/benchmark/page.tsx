import { fetchYahooQuote } from '@/lib/yahoo-finance';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { TrendingUp } from 'lucide-react';
import PriceHistoryChart from '../dashboard/components/PriceHistoryChart';

// CW8U.PA is Euronext Paris ticker for Amundi MSCI World UCITS ETF
// MWRL.L is London Stock Exchange (LSE) ticker for Amundi Core MSCI World UCITS ETF Acc
const BENCHMARK_TICKERS = [
  { ticker: 'CW8', symbol: 'CW8U.PA', name: 'Amundi MSCI World' },
  { ticker: 'MWRL', symbol: 'MWRL.L', name: 'Amundi Core MSCI World UCITS ETF Acc' }
];

export const dynamic = 'force-dynamic';

async function getBenchmarkData() {
  const data: Record<string, any> = {};
  
  for (const config of BENCHMARK_TICKERS) {
    try {
      console.log(`[BENCHMARK] Fetching data for ${config.ticker} (${config.symbol})...`);
      const quote = await fetchYahooQuote(config.symbol);
      if (quote) {
        data[config.ticker] = {
          ...quote,
          ticker: config.ticker,
          name: config.name
        };
        console.log(`[BENCHMARK] ✅ Successfully fetched ${config.ticker}:`, quote.current_price);
      } else {
        console.log(`[BENCHMARK] ⚠️ No data returned for ${config.ticker}`);
      }
    } catch (error) {
      console.error(`[BENCHMARK] ❌ Error fetching ${config.ticker}:`, error);
    }
  }
  
  console.log(`[BENCHMARK] Final data:`, Object.keys(data));
  return data;
}

interface BenchmarkCardProps {
  ticker: string;
  data: any;
}

function BenchmarkCard({ ticker, data }: BenchmarkCardProps) {
  if (!data) {
    return (
      <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6">{ticker}</Typography>
        <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
          No data available - ticker may not be found on Yahoo Finance
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Try checking if the ticker format is correct
        </Typography>
      </Box>
    );
  }

  const priceHistory = data.price_history || [];

  return (
    <PriceHistoryChart
      data={priceHistory}
      ticker={ticker}
      currentPrice={data.current_price || 0}
      priceChange={data.change || 0}
      priceChangePercent={data.change_percent || 0}
      weekLow52={data['52_week_low']}
      weekHigh52={data['52_week_high']}
      volume={undefined}
      fiftyDayAverage={null}
      twoHundredDayAverage={null}
    />
  );
}

export default async function BenchmarkPage() {
  const benchmarkData = await getBenchmarkData();
  
  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, mx: 'auto', p: 3, minHeight: '100vh', bgcolor: '#000' }}>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <TrendingUp className="w-8 h-8 text-blue-400" />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Benchmark
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Compare portfolio performance against market benchmarks
          </Typography>
        </Box>
      </Stack>

      {/* Benchmark Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
          },
          gap: 3,
        }}
      >
        <BenchmarkCard ticker="CW8" data={benchmarkData['CW8']} />
        <BenchmarkCard ticker="MWRL" data={benchmarkData['MWRL']} />
      </Box>
    </Box>
  );
}
