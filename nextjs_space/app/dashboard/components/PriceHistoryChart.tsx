'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
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
  stocks?: Array<{ ticker: string; company: string; portfolioId?: string | null }>;
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
  stocks = [],
}: PriceHistoryChartProps) {
  const theme = useTheme();
  const [compareTicker, setCompareTicker] = useState<string>('');
  const [availableTickers, setAvailableTickers] = useState<Array<{ ticker: string; company: string; portfolioName: string }>>([]);
  const [benchmarkData, setBenchmarkData] = useState<Array<{ date: string; price: number }>>([]);
  const [isLoadingBenchmark, setIsLoadingBenchmark] = useState(false);

  // Calculate 30-day return
  const calculate30DayReturn = (): number | null => {
    if (!data || data.length < 30) return null;
    
    // Sort data by date to ensure correct order
    // Handle both {date, price} and {Date, Close} formats
    const sortedData = [...data].sort((a, b) => {
      const dateA = 'date' in a ? a.date : a.Date;
      const dateB = 'date' in b ? b.date : b.Date;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
    
    // Get today's price (last entry) and 30 days ago price
    const lastEntry = sortedData[sortedData.length - 1];
    const thirtyDaysAgoEntry = sortedData[sortedData.length - 30];
    
    const todayPrice = 'price' in lastEntry ? lastEntry.price : lastEntry.Close;
    const thirtyDaysAgoPrice = 'price' in thirtyDaysAgoEntry ? thirtyDaysAgoEntry.price : thirtyDaysAgoEntry.Close;
    
    if (!todayPrice || !thirtyDaysAgoPrice) return null;
    
    // Calculate: (Price[today] / Price[today - 30d] - 1) * 100
    return ((todayPrice / thirtyDaysAgoPrice) - 1) * 100;
  };

  // Calculate 30-day annualized volatility
  const calculate30DayVolatility = (): number | null => {
    if (!data || data.length < 31) return null;
    
    // Sort data by date to ensure correct order
    const sortedData = [...data].sort((a, b) => {
      const dateA = 'date' in a ? a.date : a.Date;
      const dateB = 'date' in b ? b.date : b.Date;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
    
    // Get last 31 days of data (need 31 to calculate 30 daily returns)
    const last31Days = sortedData.slice(-31);
    
    // Calculate daily returns
    const dailyReturns: number[] = [];
    for (let i = 1; i < last31Days.length; i++) {
      const todayEntry = last31Days[i];
      const yesterdayEntry = last31Days[i-1];
      
      const priceToday = 'price' in todayEntry ? todayEntry.price : todayEntry.Close;
      const priceYesterday = 'price' in yesterdayEntry ? yesterdayEntry.price : yesterdayEntry.Close;
      
      if (priceToday && priceYesterday) {
        const dailyReturn = (priceToday / priceYesterday) - 1;
        dailyReturns.push(dailyReturn);
      }
    }
    
    if (dailyReturns.length < 30) return null;
    
    // Calculate standard deviation of daily returns
    const mean = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const squaredDiffs = dailyReturns.map(ret => Math.pow(ret - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance);
    
    // Annualize volatility: stdDev * sqrt(252) * 100 for percentage
    return stdDev * Math.sqrt(252) * 100;
  };

  const thirtyDayReturn = calculate30DayReturn();
  const thirtyDayVolatility = calculate30DayVolatility();

  // Reset comparison when ticker changes
  useEffect(() => {
    setCompareTicker('');
    setAvailableTickers([]);
    setBenchmarkData([]);
  }, [ticker]);

  // Fetch available tickers for comparison (all portfolios)
  useEffect(() => {
    const fetchTickers = async () => {
      try {
        // Fetch ALL stocks for comparison dropdown (independent of portfolio filter)
        console.log('[PriceHistoryChart] Fetching all tickers from /api/stock-list');
        const response = await fetch('/api/stock-list');
        if (!response.ok) {
          console.error('[PriceHistoryChart] Failed to fetch tickers:', response.status, response.statusText);
          return;
        }
        
        const data = await response.json();
        console.log('[PriceHistoryChart] Received data:', data);
        const stocks = data.stocks || [];
        console.log('[PriceHistoryChart] Total stocks received:', stocks.length);

        // Show all stocks from all portfolios (excluding current ticker)
        const tickers = stocks
          .filter((s: any) => s.ticker !== ticker && s.isActive === true)
          .map((s: any) => ({
            ticker: s.ticker,
            company: s.company || 'Unknown Company',
            portfolioName: s.portfolio?.name || 'Unknown',
          }))
          .sort((a: { ticker: string; company: string; portfolioName: string }, b: { ticker: string; company: string; portfolioName: string }) =>
            a.ticker.localeCompare(b.ticker)
          );

        console.log('[PriceHistoryChart] Available tickers for dropdown:', tickers.length);
        setAvailableTickers(tickers);

        // Auto-select CW8U.PA as default if available
        const cw8Ticker = tickers.find((t: { ticker: string; company: string; portfolioName: string }) => t.ticker === 'CW8U.PA');
        if (cw8Ticker) {
          console.log('[PriceHistoryChart] Auto-selecting CW8U.PA');
          setCompareTicker('CW8U.PA');
        }
      } catch (error) {
        console.error('[PriceHistoryChart] Error fetching tickers:', error);
      }
    };
    fetchTickers();
  }, [ticker]);

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

  // Fetch benchmark data when compare ticker is selected
  useEffect(() => {
    if (!compareTicker) {
      setBenchmarkData([]);
      return;
    }

    const fetchBenchmarkData = async () => {
      setIsLoadingBenchmark(true);
      try {
        console.log(`[PriceHistoryChart] Fetching price history for ${compareTicker}`);
        // Fetch just the specific stock's data to get price history
        const response = await fetch(`/api/stock-prices?ticker=${compareTicker}`);
        if (!response.ok) {
          console.error(`[PriceHistoryChart] API error: ${response.status} ${response.statusText}`);
          setBenchmarkData([]);
          setIsLoadingBenchmark(false);
          return;
        }
        
        const data = await response.json();
        if (!data.success || !data.priceHistory) {
          console.warn(`[PriceHistoryChart] No price history for ${compareTicker}`);
          setBenchmarkData([]);
          setIsLoadingBenchmark(false);
          return;
        }
        
        const priceHistory = data.priceHistory || [];
        
        console.log(`[PriceHistoryChart] ${compareTicker} data received:`, priceHistory.length, 'data points');
        if (priceHistory.length > 0) {
          console.log(`[PriceHistoryChart] First ${compareTicker} point:`, priceHistory[0]);
        }
        
        // Normalize benchmark data - priceHistory has { date, price } format
        const normalizedBenchmark = priceHistory.map((d: any) => ({
          date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date,
          price: d.price || 0,
        }));
        
        console.log('[PriceHistoryChart] Normalized benchmark sample:', normalizedBenchmark.slice(0, 3));
        console.log('[PriceHistoryChart] Stock dates sample:', normalizedData.slice(0, 3));
        
        // Create a map for quick date lookups (normalize dates to YYYY-MM-DD for comparison)
        const benchmarkMap = new Map(
          normalizedBenchmark.map((d: { date: string; price: number }) => {
            const normalizedDate = typeof d.date === 'string' ? d.date.split('T')[0] : d.date;
            return [normalizedDate, d.price];
          })
        );
        
        console.log('[PriceHistoryChart] Benchmark map keys sample:', Array.from(benchmarkMap.keys()).slice(0, 3));
        
        // Align benchmark data with the stock's date range
        const alignedBenchmark = normalizedData.map(d => {
          const normalizedDate = typeof d.date === 'string' ? d.date.split('T')[0] : new Date(d.date).toISOString().split('T')[0];
          const price = benchmarkMap.get(normalizedDate) || 0;
          return { date: d.date, price: price as number };
        });
        
        console.log('[PriceHistoryChart] Aligned benchmark data sample:', alignedBenchmark.slice(0, 3));
        console.log('[PriceHistoryChart] Non-zero benchmark prices:', alignedBenchmark.filter((d: { date: string; price: number }) => d.price > 0).length);
        
        setBenchmarkData(alignedBenchmark);
      } catch (error) {
        console.error('Error fetching benchmark data:', error);
      } finally {
        setIsLoadingBenchmark(false);
      }
    };

    fetchBenchmarkData();
  }, [compareTicker, normalizedData.length]);

  // Determine currency symbol ($ for USD, £ for GBP, € for EUR)
  const currencySymbol = '$'; // Default to USD, can be made dynamic based on ticker

  // When comparing with benchmark, normalize both to percentage change from first value
  // This allows comparison regardless of absolute price differences (like Yahoo Finance)
  let chartData = prices;
  let benchmarkChartData: number[] = [];
  let yMin = Math.floor(Math.min(...prices) * 0.95);
  let yMax = Math.ceil(Math.max(...prices) * 1.05);
  const showComparison = compareTicker && benchmarkData.length > 0;

  if (showComparison) {
    console.log('[PriceHistoryChart] Computing percentage changes');
    console.log('[PriceHistoryChart] Stock first price:', normalizedData[0]?.price);
    console.log('[PriceHistoryChart] Benchmark data length:', benchmarkData.length);
    
    // Calculate percentage change from first day for stock
    const stockFirstPrice = normalizedData[0]?.price || 1;
    const stockPercentChanges = normalizedData.map((d, i) => {
      if (stockFirstPrice === 0) return 0;
      const change = ((d.price - stockFirstPrice) / stockFirstPrice) * 100;
      if (i < 3) console.log(`[PriceHistoryChart] Stock day ${i}: price=${d.price}, change=${change.toFixed(2)}%`);
      return change;
    });

    // Calculate percentage change from first day for benchmark
    const benchmarkPrices = benchmarkData.map(d => d.price);
    const firstBenchmarkPrice = benchmarkPrices.find(p => p > 0) || 1;
    
    console.log('[PriceHistoryChart] Benchmark first non-zero price:', firstBenchmarkPrice);
    console.log('[PriceHistoryChart] Benchmark prices sample:', benchmarkPrices.slice(0, 5));
    
    const benchmarkPercentChanges = benchmarkPrices.map((price, i) => {
      if (firstBenchmarkPrice === 0) return 0;
      const change = price > 0 ? ((price - firstBenchmarkPrice) / firstBenchmarkPrice) * 100 : 0;
      if (i < 3) console.log(`[PriceHistoryChart] Benchmark day ${i}: price=${price}, change=${change.toFixed(2)}%`);
      return change;
    });

    console.log('[PriceHistoryChart] Stock percent changes length:', stockPercentChanges.length);
    console.log('[PriceHistoryChart] Benchmark percent changes length:', benchmarkPercentChanges.length);

    chartData = stockPercentChanges;
    benchmarkChartData = benchmarkPercentChanges;
    
    console.log('[PriceHistoryChart] Final benchmarkChartData length:', benchmarkChartData.length);
    
    const allChanges = [...stockPercentChanges, ...benchmarkPercentChanges.filter(c => c !== 0)];
    yMin = Math.floor(Math.min(...allChanges) * 1.1);
    yMax = Math.ceil(Math.max(...allChanges) * 1.1);
    
    console.log('[PriceHistoryChart] Y-axis range:', yMin, 'to', yMax);
  }

  const colorPalette = [
    theme.palette.primary.light,
    theme.palette.primary.main,
    theme.palette.primary.dark,
  ];

  const isPositive = priceChange >= 0;

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
            {thirtyDayReturn !== null && (
              <Chip
                size="small"
                color={thirtyDayReturn >= 0 ? 'success' : 'error'}
                label={`30d: ${thirtyDayReturn >= 0 ? '+' : ''}${thirtyDayReturn.toFixed(2)}%`}
                sx={{ ml: 1 }}
              />
            )}
            {thirtyDayVolatility !== null && (
              <Chip
                size="small"
                color="info"
                label={`Vol: ${thirtyDayVolatility.toFixed(1)}%`}
                sx={{ ml: 1 }}
              />
            )}
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

        {/* Compare to Another Ticker Dropdown - Inside Chart */}
        <Stack 
          direction="row" 
          alignItems="center" 
          justifyContent="center"
          spacing={2} 
          sx={{ 
            mt: 3, 
            mb: 2,
            p: 2,
            backgroundColor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <FormControl size="medium" sx={{ minWidth: 400 }}>
            <InputLabel id="compare-ticker-label" sx={{ fontWeight: 600 }}>Compare to</InputLabel>
            <Select
              labelId="compare-ticker-label"
              value={compareTicker}
              label="Compare to"
              onChange={(e) => setCompareTicker(e.target.value)}
              disabled={isLoadingBenchmark}
              sx={{ 
                backgroundColor: 'background.paper',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderWidth: 2,
                },
              }}
            >
              <MenuItem value="">
                <em>None - Show absolute price</em>
              </MenuItem>
              {availableTickers.map((t) => (
                <MenuItem key={t.ticker} value={t.ticker}>
                  <strong>{t.ticker}</strong> - {t.company}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {isLoadingBenchmark && (
            <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
              Loading...
            </Typography>
          )}
          {compareTicker && (
            <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
              📊 % change comparison
            </Typography>
          )}
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

        <LineChart
          colors={showComparison ? [theme.palette.primary.main, theme.palette.warning.main] : colorPalette}
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
              valueFormatter: (value) => showComparison 
                ? `${value.toFixed(1)}%` 
                : `${currencySymbol}${value.toFixed(0)}`,
            },
          ]}
          series={[
            {
              id: 'price',
              label: ticker,
              showMark: false,
              curve: 'linear',
              area: !showComparison,
              data: chartData,
            },
            ...(showComparison && benchmarkChartData.length > 0
              ? [
                  {
                    id: 'benchmark',
                    label: compareTicker,
                    showMark: false,
                    curve: 'linear' as const,
                    area: false,
                    data: benchmarkChartData,
                  },
                ]
              : []),
          ]}
          height={300}
          margin={{ left: 60, right: 20, top: 20, bottom: 20 }}
          slotProps={{
            legend: { 
              hidden: !showComparison,
              direction: 'row',
              position: { vertical: 'top', horizontal: 'middle' },
            },
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
