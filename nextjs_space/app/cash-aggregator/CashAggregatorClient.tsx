'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Upload, FileSpreadsheet, Trash2, Download, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface TransactionRow {
  date: string;
  details: string;
  account: string;
  paidIn: number;
  withdrawn: number;
  ticker?: string;
}

interface CategorizedTotals {
  fasterPaymentWithdrawal: number;
  moneyWithdrawal: number;
  bought: number;
  sold: number;
  onlineTransactionFee: number;
  internationalTradingCharge: number;
  fxCharge: number;
  customerFee: number;
  interest: number;
  dividend: number;
  fundDistribution: number;
  other: number;
}

interface Statement {
  id: string;
  accountName: string;
  fileName: string;
  uploadDate: Date;
  transactions: TransactionRow[];
  totals: CategorizedTotals;
}

export default function CashAggregatorClient() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [activeStatementId, setActiveStatementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'7D' | '1M' | '3M' | '1Y'>('1Y');
  const [expandedChargesFees, setExpandedChargesFees] = useState(false);
  const [expandedRevenuesIncome, setExpandedRevenuesIncome] = useState(false);
  const [stocks, setStocks] = useState<Array<{ ticker: string; company: string; alternativeTickers: string[] }>>([]);
  const [sortColumn, setSortColumn] = useState<'date' | 'details' | 'ticker' | 'account' | 'paidIn' | 'withdrawn'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch stocks for ticker matching
  useEffect(() => {
    fetch('/api/stock-list')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStocks(data.stocks.map((s: any) => ({ 
            ticker: s.ticker, 
            company: s.company,
            alternativeTickers: s.alternativeTickers || []
          })));
        }
      })
      .catch(err => console.error('Failed to fetch stocks:', err));
  }, []);

  // Load statements from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cashAggregatorStatements');
    const savedActiveId = localStorage.getItem('activeCashAggregatorId');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const statements = parsed.map((s: any) => ({
          ...s,
          uploadDate: new Date(s.uploadDate)
        }));
        setStatements(statements);
        if (savedActiveId) {
          setActiveStatementId(savedActiveId);
        }
      } catch (error) {
        console.error('Failed to load saved statements:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save statements to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && statements.length > 0) {
      localStorage.setItem('cashAggregatorStatements', JSON.stringify(statements));
    }
  }, [statements, isLoaded]);

  // Save active statement ID to localStorage
  useEffect(() => {
    if (isLoaded && activeStatementId) {
      localStorage.setItem('activeCashAggregatorId', activeStatementId);
    }
  }, [activeStatementId, isLoaded]);

  const activeStatement = statements.find(s => s.id === activeStatementId);

  // Extract ticker from transaction details
  const extractTicker = (details: string): string | undefined => {
    if (!stocks.length) return undefined;
    
    // Only process lines containing "Order Id" and NOT containing "ETF"
    if (!details.includes('Order Id') || details.toUpperCase().includes('ETF')) {
      return undefined;
    }
    
    const detailsLower = details.toLowerCase();
    
    // Score each stock based on how well it matches
    const matches: Array<{ ticker: string; score: number }> = [];
    
    for (const stock of stocks) {
      let score = 0;
      const companyLower = stock.company.toLowerCase();
      
      // Split company name into words for better matching
      const companyWords = companyLower.split(/[\s,.-]+/).filter(w => w.length > 2);
      
      // Check each word of company name
      for (const word of companyWords) {
        if (detailsLower.includes(word)) {
          // Exact word match gets higher score
          const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
          if (wordRegex.test(details)) {
            score += 10;
          } else {
            score += 5;
          }
        }
      }
      
      // Check if full company name appears
      if (detailsLower.includes(companyLower)) {
        score += 20;
      }
      
      // Also check alternative tickers in the details
      for (const altTicker of stock.alternativeTickers) {
        const altRegex = new RegExp(`\\b${altTicker}\\b`, 'i');
        if (altRegex.test(details)) {
          score += 15;
        }
      }
      
      if (score > 0) {
        matches.push({ ticker: stock.ticker, score });
      }
    }
    
    // Return ticker with highest score (minimum threshold of 10)
    if (matches.length > 0) {
      matches.sort((a, b) => b.score - a.score);
      if (matches[0].score >= 10) {
        return matches[0].ticker;
      }
    }
    
    return undefined;
  };

  // Categorization logic based on transaction details text
  const categorizeTransaction = (details: string, withdrawn: number, paidIn: number): Partial<CategorizedTotals> => {
    const detailsLower = details.toLowerCase();
    const amount = withdrawn > 0 ? -withdrawn : paidIn;

    // Interest (check first as it's common)
    if (detailsLower.includes('interest')) {
      return { interest: amount };
    }

    // Dividend
    if (detailsLower.includes('dividend')) {
      return { dividend: amount };
    }

    // Fund distribution
    if (detailsLower.includes('fund distribution') || detailsLower.includes('distribution')) {
      return { fundDistribution: amount };
    }

    // FX Charge (check before trading charges)
    if (detailsLower.includes('fx charge') || detailsLower.includes('fx fee') || 
        detailsLower.includes('foreign exchange')) {
      return { fxCharge: amount };
    }

    // International Trading Charge
    if (detailsLower.includes('international trading charge') || 
        detailsLower.includes('international charge') ||
        detailsLower.includes('intl trading')) {
      return { internationalTradingCharge: amount };
    }

    // Online transaction fees
    if (detailsLower.includes('online transaction fee') || 
        detailsLower.includes('online fee') ||
        detailsLower.includes('transaction fee')) {
      return { onlineTransactionFee: amount };
    }

    // Customer fee
    if (detailsLower.includes('customer fee') || 
        detailsLower.includes('service fee') ||
        detailsLower.includes('account fee')) {
      return { customerFee: amount };
    }

    // Buy transactions (check before sold to avoid matching "buy" in "Chubb")
    if ((detailsLower.includes('bought') || 
         (detailsLower.includes(' buy') || detailsLower.includes('buy ')) ||
         detailsLower.includes('purchase')) &&
        !detailsLower.includes('sell') && !detailsLower.includes('sold')) {
      return { bought: amount };
    }

    // Sell transactions
    if (detailsLower.includes('sold') || detailsLower.includes('sell') || detailsLower.includes('sale')) {
      return { sold: amount };
    }

    // Money withdrawals (Smart Investor, FPS, etc.)
    if ((detailsLower.includes('smart investor') && detailsLower.includes('withdrawal')) ||
        (detailsLower.includes('fps') && withdrawn > 0) ||
        (detailsLower.includes('one-off withdrawal') && withdrawn > 0)) {
      return { moneyWithdrawal: amount };
    }

    // FASTER Payment deposits (paidIn)
    if ((detailsLower.includes('faster payment') || 
         detailsLower.includes('faster pmt') ||
         detailsLower.includes('fast payment')) && paidIn > 0) {
      return { fasterPaymentWithdrawal: amount };
    }

    // FASTER Payment withdrawals (legacy, if not caught by Smart Investor)
    if ((detailsLower.includes('faster payment') || 
         detailsLower.includes('faster pmt') ||
         detailsLower.includes('fast payment')) && withdrawn > 0) {
      return { moneyWithdrawal: amount };
    }

    // Other/unclassified
    return { other: amount };
  };

  const calculateTotals = (transactions: TransactionRow[]): CategorizedTotals => {
    const totals: CategorizedTotals = {
      fasterPaymentWithdrawal: 0,
      moneyWithdrawal: 0,
      bought: 0,
      sold: 0,
      onlineTransactionFee: 0,
      internationalTradingCharge: 0,
      fxCharge: 0,
      customerFee: 0,
      interest: 0,
      dividend: 0,
      fundDistribution: 0,
      other: 0,
    };

    transactions.forEach(transaction => {
      const categorized = categorizeTransaction(
        transaction.details,
        transaction.withdrawn,
        transaction.paidIn
      );

      Object.entries(categorized).forEach(([key, value]) => {
        totals[key as keyof CategorizedTotals] += value || 0;
      });
    });

    return totals;
  };

  const parseExcelFile = async (file: File): Promise<Statement> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

          // Find account name from row 1 (ID1830628-001 (Investment ISA))
          let accountName = '';
          if (jsonData.length > 0 && jsonData[0][0]) {
            accountName = String(jsonData[0][0]);
          }

          // Find header row (contains "Date", "Details", "Account", etc.)
          let headerRowIndex = -1;
          for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            const row = jsonData[i];
            if (row.some((cell: any) => String(cell).toLowerCase() === 'date') &&
                row.some((cell: any) => String(cell).toLowerCase() === 'details')) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex === -1) {
            throw new Error('Could not find header row with Date and Details columns');
          }

          const headers = jsonData[headerRowIndex].map((h: any) => String(h).toLowerCase().trim());
          const dateIndex = headers.indexOf('date');
          const detailsIndex = headers.indexOf('details');
          const accountIndex = headers.indexOf('account');
          const paidInIndex = headers.indexOf('paid in');
          const withdrawnIndex = headers.indexOf('withdrawn');

          if (dateIndex === -1 || detailsIndex === -1) {
            throw new Error('Required columns (Date, Details) not found');
          }

          const transactions: TransactionRow[] = [];

          // Process data rows (starting after header)
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            const dateValue = row[dateIndex];
            const detailsValue = row[detailsIndex];

            // Skip empty rows or rows without date/details
            if (!dateValue || !detailsValue) continue;

            // Parse monetary values, handling parentheses for negative numbers and actual negative values
            const parseMoney = (value: any): number => {
              if (!value) return 0;
              
              // If it's already a number (Excel might parse negative values as numbers)
              if (typeof value === 'number') {
                return Math.abs(value); // Always return positive for withdrawn column
              }
              
              const str = String(value).trim();
              // Handle parentheses format: (123.45) means negative
              const isNegative = str.startsWith('(') && str.endsWith(')');
              const cleanStr = str.replace(/[(),£$\s]/g, '');
              const num = parseFloat(cleanStr) || 0;
              return Math.abs(num); // Always return positive for withdrawn column
            };

            const detailsStr = String(detailsValue);
            const transaction: TransactionRow = {
              date: String(dateValue),
              details: detailsStr,
              account: accountIndex !== -1 ? String(row[accountIndex] || '') : '',
              paidIn: paidInIndex !== -1 ? parseMoney(row[paidInIndex]) : 0,
              withdrawn: withdrawnIndex !== -1 ? parseMoney(row[withdrawnIndex]) : 0,
              ticker: extractTicker(detailsStr),
            };

            transactions.push(transaction);
          }

          const totals = calculateTotals(transactions);

          const statement: Statement = {
            id: Date.now().toString(),
            accountName: accountName,
            fileName: file.name,
            uploadDate: new Date(),
            transactions,
            totals,
          };

          resolve(statement);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      const statement = await parseExcelFile(file);
      setStatements(prev => [...prev, statement]);
      setActiveStatementId(statement.id);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Please upload an Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    await handleFileUpload(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Please upload an Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    await handleFileUpload(file);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDeleteStatement = (id: string) => {
    if (!confirm('Are you sure you want to delete this statement?')) return;

    setStatements(prev => {
      const filtered = prev.filter(s => s.id !== id);
      // Clear from localStorage if deleting all
      if (filtered.length === 0) {
        localStorage.removeItem('cashAggregatorStatements');
        localStorage.removeItem('activeCashAggregatorId');
      }
      return filtered;
    });

    if (activeStatementId === id) {
      setActiveStatementId(statements.length > 1 ? statements[0].id : null);
    }
  };

  const exportToExcel = () => {
    if (!activeStatement) return;

    const ws = XLSX.utils.json_to_sheet(activeStatement.transactions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `cash-flows-${activeStatement.accountName}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedTransactions = useMemo(() => {
    if (!activeStatement) return [];
    
    const sorted = [...activeStatement.transactions].sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'date':
          comparison = parseExcelDate(a.date).getTime() - parseExcelDate(b.date).getTime();
          break;
        case 'details':
          comparison = a.details.localeCompare(b.details);
          break;
        case 'ticker':
          comparison = (a.ticker || '').localeCompare(b.ticker || '');
          break;
        case 'account':
          comparison = a.account.localeCompare(b.account);
          break;
        case 'paidIn':
          comparison = a.paidIn - b.paidIn;
          break;
        case 'withdrawn':
          comparison = a.withdrawn - b.withdrawn;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [activeStatement, sortColumn, sortDirection]);

  const getCategoryLabel = (key: string): string => {
    const labels: Record<string, string> = {
      fasterPaymentWithdrawal: 'Money Top-up',
      moneyWithdrawal: 'Money Withdrawal',
      bought: 'Bought (Securities)',
      sold: 'Sold (Securities)',
      onlineTransactionFee: 'Online Transaction Fee',
      internationalTradingCharge: 'International Trading Charge',
      fxCharge: 'FX Charge',
      customerFee: 'Customer Fee',
      interest: 'Interest',
      dividend: 'Dividend',
      fundDistribution: 'Fund Distribution',
      other: 'Other/Unclassified',
    };
    return labels[key] || key;
  };

  const netCashFlow = activeStatement 
    ? Object.entries(activeStatement.totals).reduce((sum, [_, value]) => sum + value, 0)
    : 0;

  // Helper function to parse Excel date strings
  const parseExcelDate = (dateStr: string): Date => {
    // Excel dates might come as:
    // 1. DD/MM/YYYY format (e.g., "25/12/2024")
    // 2. Excel serial number (e.g., 45291)
    // 3. ISO format (e.g., "2024-12-25")
    
    // Try parsing as Excel serial number first
    const asNumber = Number(dateStr);
    if (!isNaN(asNumber) && asNumber > 1000) {
      // Excel serial date (days since 1900-01-01, with 1900-01-01 being 1)
      const excelEpoch = new Date(1899, 11, 30); // Excel's epoch is actually Dec 30, 1899
      const date = new Date(excelEpoch.getTime() + asNumber * 24 * 60 * 60 * 1000);
      return date;
    }
    
    // Try parsing DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    
    // Fallback to default Date parsing
    return new Date(dateStr);
  };

  // Combine data for both charts with aligned dates
  const combinedChartData = useMemo(() => {
    if (!activeStatement) return [];

    // Get all unique dates from transactions, sorted
    const allDates = new Set<string>();
    activeStatement.transactions.forEach(t => allDates.add(t.date));
    const sortedDates = Array.from(allDates).sort((a, b) => 
      parseExcelDate(a).getTime() - parseExcelDate(b).getTime()
    );

    // Calculate cumulative values for each category
    let cumulativeFaster = 0;
    let cumulativeBought = 0;

    const dateMap = new Map<string, { fasterPayment: number; bought: number }>();

    sortedDates.forEach(date => {
      const dayTransactions = activeStatement.transactions.filter(t => t.date === date);
      
      dayTransactions.forEach(t => {
        if (t.details.toLowerCase().includes('faster payment') && t.paidIn > 0) {
          cumulativeFaster += t.paidIn;
        }
        if ((t.details.toLowerCase().includes('bought') || t.details.toLowerCase().includes('buy')) && t.withdrawn > 0) {
          cumulativeBought += t.withdrawn;
        }
      });

      dateMap.set(date, { 
        fasterPayment: cumulativeFaster, 
        bought: cumulativeBought 
      });
    });

    // Convert to array format for chart
    return Array.from(dateMap.entries()).map(([date, values]) => {
      const dateObj = parseExcelDate(date);
      return {
        date,
        dateObj,
        label: dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        fasterPayment: values.fasterPayment,
        bought: values.bought
      };
    });
  }, [activeStatement]);

  // Filter combined chart data by period
  const filteredCombinedData = useMemo(() => {
    if (combinedChartData.length === 0) return [];

    const now = new Date();
    const periodDays: Record<typeof chartPeriod, number> = {
      '7D': 7,
      '1M': 30,
      '3M': 90,
      '1Y': 365
    };

    const cutoffDate = new Date(now.getTime() - periodDays[chartPeriod] * 24 * 60 * 60 * 1000);
    
    return combinedChartData.filter(item => item.dateObj >= cutoffDate);
  }, [combinedChartData, chartPeriod]);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Upload Broker Statement</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-colors
            ${isDragging 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-slate-700 hover:border-slate-600'
            }
          `}
        >
          <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-300 mb-2">
            Drag and drop your broker statement here
          </p>
          <p className="text-slate-500 text-sm">
            or click the Upload File button above (Excel or CSV format)
          </p>
        </div>
      </div>

      {/* Statement Tabs */}
      {statements.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {statements.map(statement => (
              <div key={statement.id} className="flex items-center gap-2">
                <button
                  onClick={() => setActiveStatementId(statement.id)}
                  className={`
                    px-4 py-2 rounded-lg whitespace-nowrap transition-colors
                    ${activeStatementId === statement.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }
                  `}
                >
                  {statement.fileName}
                </button>
                <button
                  onClick={() => handleDeleteStatement(statement.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorized Totals Summary */}
      {activeStatement && (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Cash Flow Summary</h2>
              <p className="text-slate-400 text-sm">
                {activeStatement.accountName} - {activeStatement.transactions.length} transactions
              </p>
            </div>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Combined Cash Flow Evolution Chart */}
          {filteredCombinedData.length > 0 && (
            <div className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Cash Flow Evolution</h3>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <p className="text-sm text-slate-300">
                        Money Top-up: <span className="font-bold text-green-400">{formatCurrency(activeStatement.totals.fasterPaymentWithdrawal)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <p className="text-sm text-slate-300">
                        Bought Securities: <span className="font-bold text-red-400">{formatCurrency(activeStatement.totals.bought)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-slate-400 text-xs mb-4">Cumulative values over time</p>
              
              {/* Chart */}
              <div className="h-80 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredCombinedData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis 
                      dataKey="label" 
                      stroke="#64748b" 
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number, name: string) => [
                        `£${value.toLocaleString()}`, 
                        name === 'fasterPayment' ? 'Money Top-up' : 'Bought Securities'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fasterPayment" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="FASTER Payment"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bought" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      dot={{ fill: '#ef4444', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Bought Securities"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Period Selector */}
              <div className="flex items-center justify-center gap-2">
                {(['7D', '1M', '3M', '1Y'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${chartPeriod === period
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }
                    `}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* 1. Money Top-up */}
            {activeStatement.totals.fasterPaymentWithdrawal !== 0 && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Money Top-up</span>
                  {activeStatement.totals.fasterPaymentWithdrawal < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  ) : activeStatement.totals.fasterPaymentWithdrawal > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : null}
                </div>
                <p className={`text-2xl font-bold text-right ${
                  activeStatement.totals.fasterPaymentWithdrawal < 0 ? 'text-red-400' : 
                  activeStatement.totals.fasterPaymentWithdrawal > 0 ? 'text-green-400' : 'text-slate-400'
                }`}>
                  {formatCurrency(activeStatement.totals.fasterPaymentWithdrawal)}
                </p>
              </div>
            )}

            {/* 2. Sold (Securities) */}
            {activeStatement.totals.sold !== 0 && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Sold (Securities)</span>
                  {activeStatement.totals.sold < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  ) : activeStatement.totals.sold > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : null}
                </div>
                <p className={`text-2xl font-bold text-right ${
                  activeStatement.totals.sold < 0 ? 'text-red-400' : 
                  activeStatement.totals.sold > 0 ? 'text-green-400' : 'text-slate-400'
                }`}>
                  {formatCurrency(activeStatement.totals.sold)}
                </p>
              </div>
            )}

            {/* 3. Grouped Revenues/Income Card */}
            {(() => {
              const totalRevenuesIncome = 
                activeStatement.totals.interest + 
                activeStatement.totals.dividend + 
                activeStatement.totals.fundDistribution;
              
              if (totalRevenuesIncome === 0) return null;

              return (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                  <button
                    onClick={() => setExpandedRevenuesIncome(!expandedRevenuesIncome)}
                    className="w-full"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm flex items-center gap-2">
                        Revenues/Income
                        <span className="text-xs text-slate-500">
                          {expandedRevenuesIncome ? '▼' : '▶'}
                        </span>
                      </span>
                      {totalRevenuesIncome < 0 ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : totalRevenuesIncome > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : null}
                    </div>
                    <p className={`text-2xl font-bold text-right ${
                      totalRevenuesIncome < 0 ? 'text-red-400' : totalRevenuesIncome > 0 ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {formatCurrency(totalRevenuesIncome)}
                    </p>
                  </button>

                  {/* Expanded Drill-Down */}
                  {expandedRevenuesIncome && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                      {[
                        { key: 'interest', label: 'Interest', value: activeStatement.totals.interest },
                        { key: 'dividend', label: 'Dividend', value: activeStatement.totals.dividend },
                        { key: 'fundDistribution', label: 'Fund Distribution', value: activeStatement.totals.fundDistribution }
                      ].map(({ key, label, value }) => (
                        value !== 0 && (
                          <div key={key} className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">{label}</span>
                            <span className={value < 0 ? 'text-red-400' : 'text-green-400'}>
                              {formatCurrency(value)}
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 4. Money Withdrawal */}
            {activeStatement.totals.moneyWithdrawal !== 0 && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Money Withdrawal</span>
                  {activeStatement.totals.moneyWithdrawal < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  ) : activeStatement.totals.moneyWithdrawal > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : null}
                </div>
                <p className={`text-2xl font-bold text-right ${
                  activeStatement.totals.moneyWithdrawal < 0 ? 'text-red-400' : 
                  activeStatement.totals.moneyWithdrawal > 0 ? 'text-green-400' : 'text-slate-400'
                }`}>
                  {formatCurrency(activeStatement.totals.moneyWithdrawal)}
                </p>
              </div>
            )}

            {/* 5. Bought (Securities) */}
            {activeStatement.totals.bought !== 0 && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Bought (Securities)</span>
                  {activeStatement.totals.bought < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  ) : activeStatement.totals.bought > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : null}
                </div>
                <p className={`text-2xl font-bold text-right ${
                  activeStatement.totals.bought < 0 ? 'text-red-400' : 
                  activeStatement.totals.bought > 0 ? 'text-green-400' : 'text-slate-400'
                }`}>
                  {formatCurrency(activeStatement.totals.bought)}
                </p>
              </div>
            )}

            {/* 6. Grouped Charges/Fees Card */}
            {(() => {
              const totalChargesFees = 
                activeStatement.totals.onlineTransactionFee + 
                activeStatement.totals.internationalTradingCharge + 
                activeStatement.totals.fxCharge + 
                activeStatement.totals.customerFee;
              
              if (totalChargesFees === 0) return null;

              return (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                  <button
                    onClick={() => setExpandedChargesFees(!expandedChargesFees)}
                    className="w-full"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm flex items-center gap-2">
                        Charges/Fees
                        <span className="text-xs text-slate-500">
                          {expandedChargesFees ? '▼' : '▶'}
                        </span>
                      </span>
                      {totalChargesFees < 0 ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : totalChargesFees > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : null}
                    </div>
                    <p className={`text-2xl font-bold text-right ${
                      totalChargesFees < 0 ? 'text-red-400' : totalChargesFees > 0 ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {formatCurrency(totalChargesFees)}
                    </p>
                  </button>

                  {/* Expanded Drill-Down */}
                  {expandedChargesFees && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                      {[
                        { key: 'onlineTransactionFee', label: 'Online Transaction Fee', value: activeStatement.totals.onlineTransactionFee },
                        { key: 'internationalTradingCharge', label: 'International Trading Charge', value: activeStatement.totals.internationalTradingCharge },
                        { key: 'fxCharge', label: 'FX Charge', value: activeStatement.totals.fxCharge },
                        { key: 'customerFee', label: 'Customer Fee', value: activeStatement.totals.customerFee }
                      ].map(({ key, label, value }) => (
                        value !== 0 && (
                          <div key={key} className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">{label}</span>
                            <span className={value < 0 ? 'text-red-400' : 'text-green-400'}>
                              {formatCurrency(value)}
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 7. Other/Unclassified */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Other/Unclassified</span>
                {activeStatement.totals.other < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                ) : activeStatement.totals.other > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : null}
              </div>
              <p className={`text-2xl font-bold text-right ${
                activeStatement.totals.other < 0 ? 'text-red-400' : 
                activeStatement.totals.other > 0 ? 'text-green-400' : 'text-slate-400'
              }`}>
                {formatCurrency(activeStatement.totals.other)}
              </p>
            </div>
          </div>

          {/* Net Cash Flow */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Net Cash Flow</p>
                <p className={`text-3xl font-bold text-right ${
                  netCashFlow < 0 ? 'text-red-400' : netCashFlow > 0 ? 'text-green-400' : 'text-white'
                }`}>
                  {formatCurrency(netCashFlow)}
                </p>
              </div>
              {netCashFlow < 0 ? (
                <TrendingDown className="w-8 h-8 text-red-400" />
              ) : netCashFlow > 0 ? (
                <TrendingUp className="w-8 h-8 text-green-400" />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      {activeStatement && (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800/50">
            <h2 className="text-xl font-bold text-white">Transaction Details</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      {sortColumn === 'date' && (
                        <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => handleSort('details')}
                  >
                    <div className="flex items-center gap-2">
                      Details
                      {sortColumn === 'details' && (
                        <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => handleSort('ticker')}
                  >
                    <div className="flex items-center gap-2">
                      Ticker
                      {sortColumn === 'ticker' && (
                        <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => handleSort('account')}
                  >
                    <div className="flex items-center gap-2">
                      Account
                      {sortColumn === 'account' && (
                        <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => handleSort('paidIn')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Paid In
                      {sortColumn === 'paidIn' && (
                        <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Flag
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => handleSort('withdrawn')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Withdrawn
                      {sortColumn === 'withdrawn' && (
                        <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedTransactions.map((transaction, index) => {
                  const categorized = categorizeTransaction(transaction.details, transaction.withdrawn, transaction.paidIn);
                  const isUnclassified = 'other' in categorized;
                  
                  const formattedDate = parseExcelDate(transaction.date).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  });
                  
                  return (
                    <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {transaction.details}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400 font-mono">
                        {transaction.ticker || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {transaction.account}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-400">
                        {transaction.paidIn > 0 ? formatCurrency(transaction.paidIn) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isUnclassified && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            ⚠️ Unclassified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-400">
                        {transaction.withdrawn > 0 ? `(${formatCurrency(transaction.withdrawn)})` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {statements.length === 0 && (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-bold text-slate-400 mb-2">No Statements Uploaded</h3>
          <p className="text-slate-500">
            Upload a broker statement to start analyzing your cash flows
          </p>
        </div>
      )}
    </div>
  );
}
