import { fetchYahooQuote } from '@/lib/yahoo-finance';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import { TrendingUp, TrendingDown } from 'lucide-react';

// CW8 is London Stock Exchange (LSE) ticker for Computacenter
// MWRL is London Stock Exchange (LSE) ticker for M&G Credit Income Investment Trust
const BENCHMARK_TICKERS = [
  { ticker: 'CW8', symbol: 'CW8.L', name: 'Computacenter' },
  { ticker: 'MWRL', symbol: 'MWRL.L', name: 'M&G Credit Income' }
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
      <Card>
        <CardContent>
          <Typography variant="h6">{ticker}</Typography>
          <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
            No data available - ticker may not be found on Yahoo Finance
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Try checking if the ticker format is correct (e.g., {ticker}.L for London Exchange)
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const isPositive = data.change >= 0;
  const priceHistory = data.price_history || [];

  // Prepare chart data
  const chartData = priceHistory.slice(-30); // Last 30 days

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              {ticker}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {data.name || data.currency || 'GBP'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {data.currency === 'GBp' ? '£' : '$'}{data.current_price?.toFixed(2)}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ justifyContent: 'flex-end', mt: 0.5 }}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <Typography
                variant="body2"
                sx={{
                  color: isPositive ? 'success.main' : 'error.main',
                  fontWeight: 600
                }}
              >
                {data.change_percent?.toFixed(2)}%
              </Typography>
            </Stack>
          </Box>
        </Stack>

        {/* 52 Week Range */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              52 Week Range
            </Typography>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
              {data.currency === 'GBp' ? '£' : '$'}{data.current_price?.toFixed(2)}
            </Typography>
          </Stack>
          <Box sx={{ position: 'relative', height: 8, bgcolor: 'grey.800', borderRadius: 1, overflow: 'hidden' }}>
            {/* Gradient bar */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to right, #ef4444, #f59e0b, #10b981)',
              }}
            />
            {/* Current price indicator */}
            {data['52_week_low'] && data['52_week_high'] && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -2,
                  left: `${((data.current_price - data['52_week_low']) / (data['52_week_high'] - data['52_week_low'])) * 100}%`,
                  width: 12,
                  height: 12,
                  bgcolor: 'primary.main',
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: 'background.paper',
                  transform: 'translateX(-50%)',
                }}
              />
            )}
          </Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {data.currency === 'GBp' ? '£' : '$'}{data['52_week_low']?.toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {data.currency === 'GBp' ? '£' : '$'}{data['52_week_high']?.toFixed(2)}
            </Typography>
          </Stack>
        </Box>

        {/* Simple line chart using SVG */}
        {chartData.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
              30-Day Price History
            </Typography>
            <Box
              sx={{
                width: '100%',
                height: 120,
                bgcolor: 'grey.900',
                borderRadius: 1,
                p: 2,
                position: 'relative',
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 800 100" preserveAspectRatio="none">
                {/* Create path from price history */}
                <path
                  d={chartData.map((point: any, index: number) => {
                    const x = (index / (chartData.length - 1)) * 800;
                    const minPrice = Math.min(...chartData.map((p: any) => p.Close));
                    const maxPrice = Math.max(...chartData.map((p: any) => p.Close));
                    const y = 100 - ((point.Close - minPrice) / (maxPrice - minPrice)) * 100;
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                {/* Fill area under the line */}
                <path
                  d={
                    chartData.map((point: any, index: number) => {
                      const x = (index / (chartData.length - 1)) * 800;
                      const minPrice = Math.min(...chartData.map((p: any) => p.Close));
                      const maxPrice = Math.max(...chartData.map((p: any) => p.Close));
                      const y = 100 - ((point.Close - minPrice) / (maxPrice - minPrice)) * 100;
                      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ') + ' L 800 100 L 0 100 Z'
                  }
                  fill="url(#gradient)"
                  opacity="0.2"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </Box>
          </Box>
        )}

        {/* Stats */}
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Previous Close
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {data.currency === 'GBp' ? '£' : '$'}{data.previous_close?.toFixed(2)}
            </Typography>
          </Stack>
          {data.volume && (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Volume
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {(data.volume / 1e6).toFixed(2)}M
              </Typography>
            </Stack>
          )}
          {data.market_cap && (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Market Cap
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {data.currency === 'GBp' ? '£' : '$'}{(data.market_cap / 1e9).toFixed(2)}B
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default async function BenchmarkPage() {
  const benchmarkData = await getBenchmarkData();
  
  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, mx: 'auto', p: 3 }}>
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
