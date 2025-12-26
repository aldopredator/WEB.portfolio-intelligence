'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, Trash2, Download, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';

interface TransactionRow {
  date: string;
  details: string;
  account: string;
  paidIn: number;
  withdrawn: number;
}

interface CategorizedTotals {
  fasterPaymentWithdrawal: number;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // FASTER Payment withdrawals
    if ((detailsLower.includes('faster payment') || 
         detailsLower.includes('faster pmt') ||
         detailsLower.includes('fast payment')) && withdrawn > 0) {
      return { fasterPaymentWithdrawal: amount };
    }

    // FASTER Payment deposits (paidIn)
    if ((detailsLower.includes('faster payment') || 
         detailsLower.includes('faster pmt') ||
         detailsLower.includes('fast payment')) && paidIn > 0) {
      return { fasterPaymentWithdrawal: amount };
    }

    // Other/unclassified
    return { other: amount };
  };

  const calculateTotals = (transactions: TransactionRow[]): CategorizedTotals => {
    const totals: CategorizedTotals = {
      fasterPaymentWithdrawal: 0,
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

            const transaction: TransactionRow = {
              date: String(dateValue),
              details: String(detailsValue),
              account: accountIndex !== -1 ? String(row[accountIndex] || '') : '',
              paidIn: paidInIndex !== -1 ? parseMoney(row[paidInIndex]) : 0,
              withdrawn: withdrawnIndex !== -1 ? parseMoney(row[withdrawnIndex]) : 0,
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

  const getCategoryLabel = (key: string): string => {
    const labels: Record<string, string> = {
      fasterPaymentWithdrawal: 'FASTER Payment Withdrawal',
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

          {/* FASTER Payment Withdrawal - Highlighted Card with Visual Bar */}
          {activeStatement.totals.fasterPaymentWithdrawal > 0 && (
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-green-400 text-sm font-medium mb-1">💰 FASTER Payment Withdrawal</p>
                  <p className="text-4xl font-bold text-green-400">
                    {formatCurrency(activeStatement.totals.fasterPaymentWithdrawal)}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400" />
              </div>
              
              {/* Visual Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Cash In</span>
                  <span>{Math.round((activeStatement.totals.fasterPaymentWithdrawal / Math.abs(netCashFlow || 1)) * 100)}% of net flow</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (activeStatement.totals.fasterPaymentWithdrawal / (activeStatement.totals.fasterPaymentWithdrawal + Math.abs(activeStatement.totals.bought || 0) + Math.abs(activeStatement.totals.sold || 0))) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.entries(activeStatement.totals).map(([key, value]) => (
              <div
                key={key}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">
                    {getCategoryLabel(key)}
                  </span>
                  {value < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  ) : value > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : null}
                </div>
                <p className={`text-2xl font-bold text-right ${
                  value < 0 ? 'text-red-400' : value > 0 ? 'text-green-400' : 'text-slate-400'
                }`}>
                  {formatCurrency(value)}
                </p>
              </div>
            ))}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Paid In
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Withdrawn
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {activeStatement.transactions.map((transaction, index) => (
                  <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {transaction.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {transaction.details}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {transaction.account}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-400">
                      {transaction.paidIn > 0 ? formatCurrency(transaction.paidIn) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-400">
                      {transaction.withdrawn > 0 ? `(${formatCurrency(transaction.withdrawn)})` : '-'}
                    </td>
                  </tr>
                ))}
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
