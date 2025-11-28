'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '@mui/material/styles';

interface MetricsBarChartProps {
  ticker: string;
  metrics: {
    pe_ratio?: number;
    pb_ratio?: number;
    roe?: number;
    profit_margin?: number;
    debt_to_equity?: number;
    dividend_yield?: number;
  };
}

export default function MetricsBarChart({ ticker, metrics }: MetricsBarChartProps) {
  const theme = useTheme();
  const colorPalette = [
    (theme.vars || theme).palette.primary.dark,
    (theme.vars || theme).palette.primary.main,
    (theme.vars || theme).palette.primary.light,
  ];

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          {ticker} Financial Metrics
        </Typography>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack
            direction="row"
            sx={{
              alignContent: { xs: 'center', sm: 'flex-start' },
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="h4" component="p">
              Key Ratios
            </Typography>
            <Chip size="small" color="primary" label={ticker} />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Latest financial metrics and ratios
          </Typography>
        </Stack>
        <BarChart
          colors={colorPalette}
          xAxis={[
            {
              scaleType: 'band',
              data: ['P/E', 'P/B', 'ROE', 'Margin', 'D/E', 'Div %'],
            },
          ]}
          series={[
            {
              data: [
                metrics.pe_ratio || 0,
                metrics.pb_ratio || 0,
                metrics.roe || 0,
                metrics.profit_margin || 0,
                metrics.debt_to_equity || 0,
                metrics.dividend_yield || 0,
              ],
            },
          ]}
          height={250}
          margin={{ left: 50, right: 10, top: 20, bottom: 20 }}
        />
      </CardContent>
    </Card>
  );
}
