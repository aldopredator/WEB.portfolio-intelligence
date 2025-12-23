'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Upload, FileSpreadsheet, Trash2, Download, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';

type SortField = 'investment' | 'identifier' | 'quantityHeld' | 'lastPrice' | 'value' | 'valueR' | 'bookCostR' | 'percentChange' | 'valueCcy' | 'returnGBP' | 'weight' | 'investmentType' | 'sector' | 'industry';
type SortDirection = 'asc' | 'desc' | null;

interface SortLevel {
  field: SortField;
  direction: 'asc' | 'desc';
}

interface StockInfo {
  ticker: string;
  company: string;
  sector: string | null;
  industry: string | null;
  type: string | null;
  exchange: string | null;
  region: string | null;
}

interface HoldingRow {
  investment: string;
  identifier: string;
  quantityHeld: number;
  lastPrice: number;
  lastPriceCcy: string;
  value: number;
  valueCcy: string;
  fxRate: number;
  lastPriceP: number;
  valueR: number;
  bookCost: number;
  bookCostCcy: string;
  averageFxRate: number;
  bookCostR: number;
  percentChange: number;
}

interface Statement {
  id: string;
  accountId: string;
  fileName: string;
  uploadDate: Date;
  holdings: HoldingRow[];
}

export default function BankStatementClient() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [activeStatementId, setActiveStatementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sortLevels, setSortLevels] = useState<SortLevel[]>([]);
  const [showGrandTotal, setShowGrandTotal] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [stockInfo, setStockInfo] = useState<Record<string, StockInfo>>({});

  const activeStatement = statements.find(s => s.id === activeStatementId);
  const holdings = activeStatement?.holdings || [];
  const accountId = activeStatement?.accountId || '';
  const fileName = activeStatement?.fileName || '';

  // Fetch stock information when holdings change
  useEffect(() => {
    const fetchStockInfo = async () => {
      if (holdings.length === 0) return;

      const tickers = holdings
        .map(h => h.identifier)
        .filter(id => id && id !== '-' && id !== 'CASH');

      if (tickers.length === 0) return;

      try {
        const response = await fetch(`/api/stock-info?tickers=${tickers.join(',')}`);
        if (response.ok) {
          const data = await response.json();
          setStockInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch stock info:', error);
      }
    };

    fetchStockInfo();
  }, [holdings]);

  const getInvestmentType = (investmentName: string): string => {
    const nameLower = investmentName.toLowerCase();
    if (nameLower === 'cash') return 'Cash';
    if (nameLower.includes(' etf') || nameLower.includes('etf ') || 
        nameLower.includes(' etc') || nameLower.includes('etc ') ||
        nameLower.includes('tracker') || nameLower.includes('funds')) return 'ETF';
    return 'Stock';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const addSortLevel = (field: SortField) => {
    const existingIndex = sortLevels.findIndex(s => s.field === field);
    if (existingIndex >= 0) {
      // Toggle direction or remove
      const existing = sortLevels[existingIndex];
      if (existing.direction === 'asc') {
        setSortLevels(sortLevels.map((s, i) => i === existingIndex ? { ...s, direction: 'desc' } : s));
      } else {
        setSortLevels(sortLevels.filter((_, i) => i !== existingIndex));
      }
    } else {
      setSortLevels([...sortLevels, { field, direction: 'asc' }]);
    }
  };

  const clearSortLevels = () => {
    setSortLevels([]);
  };

  const handleColumnClick = (field: SortField, e: React.MouseEvent) => {
    if (e.shiftKey) {
      addSortLevel(field);
    } else {
      handleSort(field);
    }
  };

  const getSortValue = (holding: HoldingRow, field: SortField): string | number => {
    if (field === 'returnGBP') {
      return holding.valueR - holding.bookCostR;
    } else if (field === 'weight') {
      return totalValue > 0 ? (holding.valueR / totalValue) * 100 : 0;
    } else if (field === 'investmentType') {
      return getInvestmentType(holding.investment);
    } else if (field === 'sector') {
      return stockInfo[holding.identifier]?.sector || '-';
    } else if (field === 'industry') {
      return stockInfo[holding.identifier]?.industry || '-';
    }
    return holding[field];
  };

  // Calculate totalValue before using it in sortedHoldings
  const totalValue = holdings.reduce((sum, h) => sum + (h.valueR || 0), 0);

  const sortedHoldings = useMemo(() => {
    if (sortLevels.length === 0 && (!sortField || !sortDirection)) return holdings;

    return [...holdings].sort((a, b) => {
      // Multi-level sorting
      if (sortLevels.length > 0) {
        for (const level of sortLevels) {
          const aVal = getSortValue(a, level.field);
          const bVal = getSortValue(b, level.field);
          
          let comparison = 0;
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            comparison = aVal.localeCompare(bVal);
          } else if (typeof aVal === 'number' && typeof bVal === 'number') {
            comparison = aVal - bVal;
          }
          
          if (comparison !== 0) {
            return level.direction === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      }

      // Single level sorting (legacy)
      let aVal: string | number;
      let bVal: string | number;

      // Handle computed fields
      if (sortField === 'returnGBP') {
        aVal = a.valueR - a.bookCostR;
        bVal = b.valueR - b.bookCostR;
      } else if (sortField === 'weight') {
        aVal = totalValue > 0 ? (a.valueR / totalValue) * 100 : 0;
        bVal = totalValue > 0 ? (b.valueR / totalValue) * 100 : 0;
      } else if (sortField === 'investmentType') {
        aVal = getInvestmentType(a.investment);
        bVal = getInvestmentType(b.investment);
      } else if (sortField === 'sector') {
        aVal = stockInfo[a.identifier]?.sector || '-';
        bVal = stockInfo[b.identifier]?.sector || '-';
      } else if (sortField === 'industry') {
        aVal = stockInfo[a.identifier]?.industry || '-';
        bVal = stockInfo[b.identifier]?.industry || '-';
      } else {
        aVal = a[sortField!];
        bVal = b[sortField!];
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [holdings, sortField, sortDirection, sortLevels, totalValue]);

  // Calculate grand totals by type
  const grandTotalsByType = useMemo(() => {
    const totals = new Map<string, { count: number; value: number; bookCost: number; gainLoss: number }>();
    
    holdings.forEach(h => {
      const type = getInvestmentType(h.investment);
      const existing = totals.get(type) || { count: 0, value: 0, bookCost: 0, gainLoss: 0 };
      // Exclude Cash from book cost and gain/loss calculations
      const bookCost = type === 'Cash' ? 0 : h.bookCostR;
      const gainLoss = type === 'Cash' ? 0 : (h.valueR - h.bookCostR);
      totals.set(type, {
        count: existing.count + 1,
        value: existing.value + h.valueR,
        bookCost: existing.bookCost + bookCost,
        gainLoss: existing.gainLoss + gainLoss
      });
    });
    
    return Array.from(totals.entries()).map(([type, stats]) => ({
      type,
      ...stats,
      weight: totalValue > 0 ? (stats.value / totalValue) * 100 : 0,
      gainLossPercent: stats.bookCost > 0 ? ((stats.value - stats.bookCost) / stats.bookCost) * 100 : 0
    }));
  }, [holdings, totalValue]);

  const SortIcon = ({ field }: { field: SortField }) => {
    const sortLevel = sortLevels.find(s => s.field === field);
    if (sortLevel) {
      const levelIndex = sortLevels.findIndex(s => s.field === field);
      return (
        <span className="flex items-center gap-1">
          {sortLevel.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          <span className="text-xs bg-blue-500/30 text-blue-300 rounded px-1">{levelIndex + 1}</span>
        </span>
      );
    }
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-3 h-3" />;
    if (sortDirection === 'desc') return <ArrowDown className="w-3 h-3" />;
    return <ArrowUpDown className="w-3 h-3 opacity-40" />;
  };

  const parseExcelFile = useCallback((file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Find the account ID (first row)
        const firstRow = jsonData[0] as string[];
        let accountIdFromFile = '';
        if (firstRow && firstRow[0]) {
          accountIdFromFile = firstRow[0];
        }

        // Find the header row (contains "Investment", "Identifier", etc.)
        let headerRowIndex = -1;
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i] as string[];
          if (row[0] === 'Investment') {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error('Could not find header row');
        }

        // Parse data rows
        const parsedHoldings: HoldingRow[] = [];
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || !row[0]) continue; // Skip empty rows

          const holding: HoldingRow = {
            investment: row[0] || '',
            identifier: row[1] || '',
            quantityHeld: parseFloat(row[2]) || 0,
            lastPrice: parseFloat(row[3]) || 0,
            lastPriceCcy: row[4] || '',
            value: parseFloat(row[5]) || 0,
            valueCcy: row[6] || '',
            fxRate: parseFloat(row[7]) || 0,
            lastPriceP: parseFloat(row[8]) || 0,
            valueR: parseFloat(row[9]) || 0,
            bookCost: parseFloat(row[10]) || 0,
            bookCostCcy: row[11] || '',
            averageFxRate: parseFloat(row[12]) || 0,
            bookCostR: parseFloat(row[13]) || 0,
            percentChange: parseFloat(row[14]) || 0,
          };

          parsedHoldings.push(holding);
        }

        // Create new statement
        const newStatement: Statement = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          accountId: accountIdFromFile,
          fileName: file.name,
          uploadDate: new Date(),
          holdings: parsedHoldings,
        };

        // Keep only the last 3 statements
        setStatements(prev => {
          const updated = [newStatement, ...prev].slice(0, 3);
          return updated;
        });
        setActiveStatementId(newStatement.id);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('Error parsing file. Please ensure it is a valid Barclays statement.');
      }
    };

    reader.readAsBinaryString(file);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelFile(file);
    }
  }, [parseExcelFile]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      parseExcelFile(file);
    }
  }, [parseExcelFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClear = () => {
    if (activeStatementId) {
      setStatements(prev => prev.filter(s => s.id !== activeStatementId));
      setActiveStatementId(prev => {
        const remaining = statements.filter(s => s.id !== prev);
        return remaining.length > 0 ? remaining[0].id : null;
      });
    }
  };

  const exportToExcel = () => {
    const totalVal = holdings.reduce((sum, h) => sum + (h.valueR || 0), 0);
    const worksheet = XLSX.utils.json_to_sheet(holdings.map(h => ({
      'Investment': h.investment,
      'Type': getInvestmentType(h.investment),
      'Sector': stockInfo[h.identifier]?.sector || '-',
      'Industry': stockInfo[h.identifier]?.industry || '-',
      'Identifier': h.identifier,
      'Quantity Held': h.quantityHeld,
      'Last Price': h.lastPrice,
      'Last Price CCY': h.lastPriceCcy,
      'Value': h.value,
      'Value CCY': h.valueCcy,
      'FX Rate': h.fxRate,
      'Last Price (£)': h.lastPriceP,
      'Value (£)': h.valueR,
      'Weight (%)': totalVal > 0 ? ((h.valueR / totalVal) * 100).toFixed(2) : '0.00',
      'Book Cost': h.bookCost,
      'Book Cost CCY': h.bookCostCcy,
      'Average FX Rate': h.averageFxRate,
      'Book Cost (£)': h.bookCostR,
      'Return (£)': h.valueR - h.bookCostR,
      '% Change': h.percentChange,
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Holdings');
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    XLSX.writeFile(workbook, `bank_statement_${timestamp}.xlsx`);
  };

  const updateSectorsForHoldings = async () => {
    const tickers = holdings
      .map(h => h.identifier)
      .filter(id => id && id !== '-' && id !== 'CASH');

    if (tickers.length === 0) return;

    try {
      const response = await fetch('/api/update-stock-sectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Sector update result:', result);
        
        // Refresh stock info
        const refreshResponse = await fetch(`/api/stock-info?tickers=${tickers.join(',')}`);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setStockInfo(data);
        }
        
        alert(`Updated ${result.updated} stocks successfully!`);
      } else {
        alert('Failed to update sectors');
      }
    } catch (error) {
      console.error('Error updating sectors:', error);
      alert('Error updating sectors');
    }
  };

  // Exclude Cash from Total Book Cost and Total Gain/Loss calculations
  const totalBookCost = holdings.reduce((sum, h) => {
    const type = getInvestmentType(h.investment);
    return type === 'Cash' ? sum : sum + (h.bookCostR || 0);
  }, 0);
  
  const totalNonCashValue = holdings.reduce((sum, h) => {
    const type = getInvestmentType(h.investment);
    return type === 'Cash' ? sum : sum + (h.valueR || 0);
  }, 0);
  
  const totalGainLoss = totalNonCashValue - totalBookCost;
  const totalGainLossPercent = totalBookCost > 0 ? (totalGainLoss / totalBookCost) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Statement Tabs - Show when we have statements */}
      {statements.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-slate-400">Statements:</span>
            {statements.map((statement) => (
              <button
                key={statement.id}
                onClick={() => setActiveStatementId(statement.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeStatementId === statement.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-semibold">{statement.fileName}</div>
                    <div className="text-xs opacity-75">
                      {statement.uploadDate.toLocaleDateString()} {statement.uploadDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {statements.length < 3 && (
              <label className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 cursor-pointer transition-all flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Add Statement
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {statements.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-all
            ${isDragging 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
            }
          `}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Upload Bank Statement
              </h3>
              <p className="text-slate-400 mb-4">
                Drag and drop your Barclays Excel file here, or click to browse
              </p>
            </div>
            <label className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              Choose File
            </label>
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200">
                  Supported format: Barclays Investment ISA Excel statements (.xlsx, .xls)
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header with file info and actions */}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{accountId}</h3>
                  <p className="text-sm text-slate-400">{fileName}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={updateSectorsForHoldings}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 transition-colors"
                  title="Fetch sector and industry data from Yahoo Finance"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Update Sectors
                </button>
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-400 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/50 border border-slate-800/50 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-1">Total Holdings</p>
                <p className="text-2xl font-bold text-white">{holdings.length}</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-800/50 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-1">Total Value (£)</p>
                <p className="text-2xl font-bold text-white">£{totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-800/50 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-1">Total Book Cost (£)</p>
                <p className="text-2xl font-bold text-white">£{totalBookCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-800/50 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-1">Total Gain/Loss</p>
                <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {totalGainLoss >= 0 ? '+' : ''}£{totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  <span className="text-sm ml-2">({totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Sort Controls and Grand Total Toggle */}
          <div className="flex items-center justify-between gap-4 bg-slate-950/30 border border-slate-800/30 rounded-lg p-3">
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">
                {sortLevels.length > 0 ? (
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">Sort:</span>
                    {sortLevels.map((level, i) => (
                      <span key={i} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                        {level.field} ({level.direction})
                      </span>
                    ))}
                    <button 
                      onClick={clearSortLevels}
                      className="text-red-400 hover:text-red-300 underline"
                    >
                      Clear all
                    </button>
                  </span>
                ) : (
                  <span>Shift+Click column headers to add sort levels</span>
                )}
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showGrandTotal}
                onChange={(e) => setShowGrandTotal(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">Show Grand Total by Type</span>
            </label>
          </div>

          {/* Grand Total by Type */}
          {showGrandTotal && grandTotalsByType.length > 0 && (
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Grand Total by Investment Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {grandTotalsByType.map(({ type, count, value, bookCost, gainLoss, weight, gainLossPercent }) => (
                  <div key={type} className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded text-sm font-semibold ${
                        type === 'ETF' ? 'bg-blue-500/20 text-blue-300' : 
                        type === 'Cash' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {type}
                      </span>
                      <span className="text-xs text-slate-400">{count} holdings</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-400">Total Value</p>
                        <p className="text-lg font-bold text-white">£{value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                        <p className="text-xs text-slate-400">{weight.toFixed(2)}% of portfolio</p>
                      </div>
                      {type !== 'Cash' && (
                        <>
                          <div>
                            <p className="text-xs text-slate-400">Book Cost</p>
                            <p className="text-sm text-slate-300">£{bookCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Gain/Loss</p>
                            <p className={`text-sm font-semibold ${gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {gainLoss >= 0 ? '+' : ''}£{gainLoss.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              <span className="text-xs ml-1">({gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)</span>
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holdings Table */}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-950/50 to-slate-900/50 border-b border-slate-800/50">
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={(e) => handleColumnClick('investment', e)} className="flex items-center gap-1 hover:text-white transition-colors">
                        Investment <SortIcon field="investment" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={(e) => handleColumnClick('investmentType', e)} className="flex items-center gap-1 hover:text-white transition-colors">
                        Type <SortIcon field="investmentType" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={(e) => handleColumnClick('sector', e)} className="flex items-center gap-1 hover:text-white transition-colors">
                        Sector <SortIcon field="sector" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={(e) => handleColumnClick('industry', e)} className="flex items-center gap-1 hover:text-white transition-colors">
                        Industry <SortIcon field="industry" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={(e) => handleColumnClick('identifier', e)} className="flex items-center gap-1 hover:text-white transition-colors">
                        Identifier <SortIcon field="identifier" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={(e) => handleColumnClick('quantityHeld', e)} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                        Quantity <SortIcon field="quantityHeld" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={(e) => handleColumnClick('lastPrice', e)} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                        Last Price <SortIcon field="lastPrice" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={(e) => handleColumnClick('value', e)} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                        Value <SortIcon field="value" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={(e) => handleColumnClick('valueCcy', e)} className="flex items-center gap-1 hover:text-white transition-colors mx-auto">
                        Ccy <SortIcon field="valueCcy" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={(e) => handleColumnClick('valueR', e)} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                        Value (£) <SortIcon field="valueR" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={(e) => handleColumnClick('weight', e)} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                        Weight <SortIcon field="weight" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={(e) => handleColumnClick('bookCostR', e)} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                        Book Cost (£) <SortIcon field="bookCostR" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={(e) => handleColumnClick('returnGBP', e)} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                        Return (£) <SortIcon field="returnGBP" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={(e) => handleColumnClick('percentChange', e)} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                        % Change <SortIcon field="percentChange" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHoldings.map((holding, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-4 text-sm text-white">{holding.investment}</td>
                      <td className="px-4 py-4 text-sm text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          getInvestmentType(holding.investment) === 'ETF' ? 'bg-blue-500/20 text-blue-300' : 
                          getInvestmentType(holding.investment) === 'Cash' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {getInvestmentType(holding.investment)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">
                        {stockInfo[holding.identifier]?.sector || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">
                        {stockInfo[holding.identifier]?.industry || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300 font-mono">{holding.identifier}</td>
                      <td className="px-4 py-4 text-sm text-right text-slate-300">{holding.quantityHeld.toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm text-right text-slate-300">
                        {holding.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-slate-300">
                        {holding.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-4 text-sm text-center text-slate-400 font-mono text-xs">
                        {holding.valueCcy}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-white font-semibold">
                        £{holding.valueR.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-slate-300">
                        {totalValue > 0 ? ((holding.valueR / totalValue) * 100).toFixed(2) : '0.00'}%
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-slate-300">
                        £{holding.bookCostR.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className={`px-4 py-4 text-sm text-right font-semibold ${
                        (holding.valueR - holding.bookCostR) >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {(holding.valueR - holding.bookCostR) >= 0 ? '+' : ''}£{(holding.valueR - holding.bookCostR).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className={`px-4 py-4 text-sm text-right font-semibold ${
                        holding.percentChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {holding.percentChange >= 0 ? '+' : ''}{holding.percentChange.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
