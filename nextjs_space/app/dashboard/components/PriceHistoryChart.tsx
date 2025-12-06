'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { LineChart } from '@mui/x-charts/LineChart';

function AreaGradient({ color, id }: { color: string; id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

interface PriceHistoryChartProps {
  data: Array<{ date: string; price: number } | { Date: string; Close: number }>;
  ticker: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  weekLow52?: number;
  weekHigh52?: number;
  volume?: number;
  fiftyDayAverage?: number | null;
  twoHundredDayAverage?: number | null;
}

export default function PriceHistoryChart({
  data,
  ticker,
  currentPrice,
  priceChange,
  priceChangePercent,
  weekLow52,
  weekHigh52,
  volume,
  fiftyDayAverage,
  twoHundredDayAverage,
}: PriceHistoryChartProps) {
  const theme = useTheme();
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<Array<{ date: string; price: number }>>([]);
  const [isLoadingBenchmark, setIsLoadingBenchmark] = useState(false);

  // Normalize data format (support both lowercase and uppercase field names)
  const normalizedData = data.map(d => ({
    date: 'date' in d ? d.date : d.Date,
    price: 'price' in d ? d.price : d.Close,
  }));

  // Format dates as "Day Month" (e.g., "1 Nov", "15 Nov")
  const dates = normalizedData.map((d) => {
    const date = new Date(d.date);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${day} ${month}`;
  });
  const prices = normalizedData.map((d) => d.price);

  // Fetch benchmark data when checkbox is checked
  useEffect(() => {
    if (!showBenchmark) {
      setBenchmarkData([]);
      return;
    }

    const fetchBenchmarkData = async () => {
      setIsLoadingBenchmark(true);
      try {
        const response = await fetch('/api/stock?ticker=CW8');
        if (response.ok) {
          const stockData = await response.json();
          const priceHistory = stockData.price_history || [];
          
          // Create a map for quick date lookups (using raw dates from normalizedData)
          const benchmarkMap = new Map(
            priceHistory.map((d: any) => [d.date || d.Date, d.price || d.Close])
          );
          
          // Align benchmark data with the stock's date range
          const alignedBenchmark = normalizedData.map(d => {
            const price = benchmarkMap.get(d.date);
            return { date: d.date, price: (price as number) || 0 };
          });
          
          setBenchmarkData(alignedBenchmark);
        }
      } catch (error) {
        console.error('Error fetching benchmark data:', error);
      } finally {
        setIsLoadingBenchmark(false);
      }
    };

    fetchBenchmarkData();
  }, [showBenchmark, data]);

  // Calculate dynamic Y-axis range to emphasize price movements
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1; // 10% padding
  const yMin = Math.floor(minPrice - padding);
  const yMax = Math.ceil(maxPrice + padding);

  const colorPalette = [
    theme.palette.primary.light,
    theme.palette.primary.main,
    theme.palette.primary.dark,
  ];

  const isPositive = priceChange >= 0;

  // Determine currency symbol ($ for USD, £ for GBP, € for EUR)
  const currencySymbol = '$'; // Default to USD, can be made dynamic based on ticker

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack
            direction="row"
            sx={{
              alignContent: { xs: 'center', sm: 'flex-start' },
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="h4" component="p">
              ${currentPrice.toFixed(0)}
            </Typography>
            <Chip
              size="small"
              color={isPositive ? 'success' : 'error'}
              label={`${isPositive ? '+' : ''}${priceChangePercent.toFixed(2)}%`}
            />
            {fiftyDayAverage && (
              <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                50-Day MA: <strong>${fiftyDayAverage.toFixed(0)}</strong>
              </Typography>
            )}
            {twoHundredDayAverage && (
              <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                200-Day MA: <strong>${twoHundredDayAverage.toFixed(0)}</strong>
              </Typography>
            )}
          </Stack>
        </Stack>

        {/* 52 Week Range and Volume Section */}
        {(weekLow52 !== undefined && weekHigh52 !== undefined) || volume !== undefined ? (
          <Stack spacing={2} sx={{ mt: 2, mb: 2 }}>
            {/* 52 Week Range Spectrum */}
            {weekLow52 !== undefined && weekHigh52 !== undefined && (
              <Stack>
                <Typography variant="body1" sx={{ color: 'text.primary', mb: 1, textAlign: 'center', fontWeight: 700 }}>
                  52 Week Range
                </Typography>
                
                {/* Spectrum Slider */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ position: 'relative', px: 2 }}>
                  {/* Min Value */}
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: '60px', textAlign: 'right' }}>
                    ${weekLow52.toFixed(0)}
                  </Typography>
                  
                  {/* Slider Track */}
                  <Stack sx={{ flex: 1, position: 'relative', height: 32 }}>
                    {/* Background Track */}
                    <Stack
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: 0,
                        right: 0,
                        height: 12,
                        transform: 'translateY(-50%)',
                        borderRadius: 6,
                        background: `linear-gradient(to right, ${theme.palette.error.main}, ${theme.palette.warning.main}, ${theme.palette.success.main})`,
                        opacity: 0.4,
                      }}
                    />
                    
                    {/* Current Price Cursor */}
                    <Stack
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: `${((currentPrice - weekLow52) / (weekHigh52 - weekLow52)) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 2,
                      }}
                    >
                      {/* Cursor Circle */}
                      <Stack
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: theme.palette.primary.main,
                          border: `3px solid ${theme.palette.background.paper}`,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }}
                      />
                      {/* Price Label Above Cursor */}
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          top: -24,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontWeight: 700,
                          color: theme.palette.primary.main,
                          whiteSpace: 'nowrap',
                          fontSize: '0.7rem',
                        }}
                      >
                        ${currentPrice.toFixed(2)}
                      </Typography>
                    </Stack>
                  </Stack>
                  
                  {/* Max Value */}
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: '60px' }}>
                    ${weekHigh52.toFixed(0)}
                  </Typography>
                </Stack>
              </Stack>
            )}
            
            {/* Volume */}
            {volume !== undefined && (
              <Stack
                direction="row"
                sx={{
                  p: 2,
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  justifyContent: 'center',
                }}
              >
                <Stack alignItems="center">
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Volume
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {(volume / 1e6).toFixed(2)}M
                  </Typography>
                </Stack>
              </Stack>
            )}
          </Stack>
        ) : null}

        {/* Benchmark Comparison Checkbox */}
        <Stack direction="row" alignItems="center" sx={{ mt: 2, mb: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showBenchmark}
                onChange={(e) => setShowBenchmark(e.target.checked)}
                sx={{ color: 'primary.main' }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Compare with CW8 benchmark {isLoadingBenchmark && '(Loading...)'}
              </Typography>
            }
          />
        </Stack>

        <LineChart
          colors={showBenchmark && benchmarkData.length > 0 ? [theme.palette.primary.main, theme.palette.warning.main] : colorPalette}
          xAxis={[
            {
              scaleType: 'point',
              data: dates,
              tickInterval: (index, i) => (i + 1) % 5 === 0,
            },
          ]}
          yAxis={[
            {
              min: yMin,
              max: yMax,
              valueFormatter: (value) => `${currencySymbol}${value.toFixed(0)}`,
            },
          ]}
          series={[
            {
              id: 'price',
              label: ticker,
              showMark: false,
              curve: 'linear',
              area: !showBenchmark,
              data: prices,
            },
            ...(showBenchmark && benchmarkData.length > 0
              ? [
                  {
                    id: 'benchmark',
                    label: 'CW8',
                    showMark: false,
                    curve: 'linear' as const,
                    area: false,
                    data: benchmarkData.map(d => d.price),
                  },
                ]
              : []),
          ]}
          height={300}
          margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
          slotProps={{
            legend: { hidden: !showBenchmark },
          }}
          sx={{
            '& .MuiAreaElement-series-price': {
              fill: "url('#price-gradient')",
            },
          }}
        >
          <AreaGradient color={theme.palette.primary.main} id="price-gradient" />
        </LineChart>
      </CardContent>
    </Card>
  );
}
