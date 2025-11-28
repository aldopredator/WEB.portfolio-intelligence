'use client';

import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

interface FinancialMetric {
  id: string;
  category: string;
  metric: string;
  value: number | string;
  type: 'percentage' | 'ratio' | 'currency' | 'number';
}

interface FinancialMetricsGridProps {
  metrics: {
    pe_ratio?: number;
    pb_ratio?: number;
    ps_ratio?: number;
    pcf_ratio?: number;
    roe?: number;
    roa?: number;
    roi?: number;
    gross_margin?: number;
    operating_margin?: number;
    profit_margin?: number;
    debt_to_equity?: number;
    current_ratio?: number;
    quick_ratio?: number;
    revenue_growth?: number;
    earnings_growth?: number;
    dividend_yield?: number;
    payout_ratio?: number;
    beta?: number;
    eps?: number;
    book_value?: number;
  };
}

export function FinancialMetricsGrid({ metrics }: FinancialMetricsGridProps) {
  const formatValue = (value: number | string | undefined, type: string): string => {
    if (value === undefined || value === null || value === 'N/A') return 'N/A';
    if (typeof value === 'string') return value;
    
    switch (type) {
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'ratio':
        return value.toFixed(2);
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'number':
        return value.toLocaleString();
      default:
        return String(value);
    }
  };

  const getCellColor = (value: number | string | undefined, type: string) => {
    if (value === undefined || value === null || value === 'N/A' || typeof value === 'string') {
      return 'inherit';
    }
    
    // For growth metrics and margins, positive is green, negative is red
    if (type === 'percentage' && (value < 0)) {
      return 'error.main';
    }
    
    return 'inherit';
  };

  const rows: FinancialMetric[] = [
    // Valuation
    { id: '1', category: 'Valuation', metric: 'P/E Ratio', value: metrics.pe_ratio || 'N/A', type: 'ratio' },
    { id: '2', category: 'Valuation', metric: 'P/B Ratio', value: metrics.pb_ratio || 'N/A', type: 'ratio' },
    { id: '3', category: 'Valuation', metric: 'P/S Ratio', value: metrics.ps_ratio || 'N/A', type: 'ratio' },
    { id: '4', category: 'Valuation', metric: 'P/CF Ratio', value: metrics.pcf_ratio || 'N/A', type: 'ratio' },
    
    // Profitability
    { id: '5', category: 'Profitability', metric: 'ROE', value: metrics.roe || 'N/A', type: 'percentage' },
    { id: '6', category: 'Profitability', metric: 'ROA', value: metrics.roa || 'N/A', type: 'percentage' },
    { id: '7', category: 'Profitability', metric: 'ROI', value: metrics.roi || 'N/A', type: 'percentage' },
    { id: '8', category: 'Profitability', metric: 'Gross Margin', value: metrics.gross_margin || 'N/A', type: 'percentage' },
    { id: '9', category: 'Profitability', metric: 'Operating Margin', value: metrics.operating_margin || 'N/A', type: 'percentage' },
    { id: '10', category: 'Profitability', metric: 'Profit Margin', value: metrics.profit_margin || 'N/A', type: 'percentage' },
    
    // Financial Health
    { id: '11', category: 'Financial Health', metric: 'Debt/Equity', value: metrics.debt_to_equity || 'N/A', type: 'ratio' },
    { id: '12', category: 'Financial Health', metric: 'Current Ratio', value: metrics.current_ratio || 'N/A', type: 'ratio' },
    { id: '13', category: 'Financial Health', metric: 'Quick Ratio', value: metrics.quick_ratio || 'N/A', type: 'ratio' },
    
    // Growth
    { id: '14', category: 'Growth', metric: 'Revenue Growth', value: metrics.revenue_growth || 'N/A', type: 'percentage' },
    { id: '15', category: 'Growth', metric: 'Earnings Growth', value: metrics.earnings_growth || 'N/A', type: 'percentage' },
    
    // Dividends
    { id: '16', category: 'Dividends', metric: 'Dividend Yield', value: metrics.dividend_yield || 'N/A', type: 'percentage' },
    { id: '17', category: 'Dividends', metric: 'Payout Ratio', value: metrics.payout_ratio || 'N/A', type: 'percentage' },
    
    // Risk & Per Share
    { id: '18', category: 'Risk & Per Share', metric: 'Beta', value: metrics.beta || 'N/A', type: 'ratio' },
    { id: '19', category: 'Risk & Per Share', metric: 'EPS', value: metrics.eps || 'N/A', type: 'currency' },
    { id: '20', category: 'Risk & Per Share', metric: 'Book Value', value: metrics.book_value || 'N/A', type: 'currency' },
  ];

  const columns: GridColDef[] = [
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      headerClassName: 'super-app-theme--header',
    },
    {
      field: 'metric',
      headerName: 'Metric',
      flex: 1,
      minWidth: 150,
      headerClassName: 'super-app-theme--header',
    },
    {
      field: 'value',
      headerName: 'Value',
      width: 150,
      headerClassName: 'super-app-theme--header',
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          sx={{
            fontWeight: 600,
            color: getCellColor(params.row.value, params.row.type),
          }}
        >
          {formatValue(params.row.value, params.row.type)}
        </Typography>
      ),
    },
  ];

  return (
    <Card elevation={0} sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Typography variant="h6" fontWeight={700}>
            Financial Metrics
          </Typography>
        }
        subheader="Comprehensive financial analysis"
      />
      <CardContent>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 20 },
              },
            }}
            pageSizeOptions={[10, 20, 50]}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid',
                borderColor: 'divider',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'background.paper',
                borderBottom: '2px solid',
                borderColor: 'divider',
              },
              '& .super-app-theme--header': {
                fontWeight: 700,
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
