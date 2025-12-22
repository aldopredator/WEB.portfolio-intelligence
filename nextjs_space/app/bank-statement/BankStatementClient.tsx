'use client';

import { useState, useCallback, useMemo } from 'react';
import { Upload, FileSpreadsheet, Trash2, Download, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';

type SortField = 'investment' | 'identifier' | 'quantityHeld' | 'lastPrice' | 'value' | 'valueR' | 'bookCostR' | 'percentChange' | 'valueCcy' | 'returnGBP' | 'weight';
type SortDirection = 'asc' | 'desc' | null;

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
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const activeStatement = statements.find(s => s.id === activeStatementId);
  const holdings = activeStatement?.holdings || [];
  const accountId = activeStatement?.accountId || '';
  const fileName = activeStatement?.fileName || '';

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

  // Calculate totalValue before using it in sortedHoldings
  const totalValue = holdings.reduce((sum, h) => sum + (h.valueR || 0), 0);

  const sortedHoldings = useMemo(() => {
    if (!sortField || !sortDirection) return holdings;

    return [...holdings].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      // Handle computed field returnGBP
      if (sortField === 'returnGBP') {
        aVal = a.valueR - a.bookCostR;
        bVal = b.valueR - b.bookCostR;
      } else if (sortField === 'weight') {
        aVal = totalValue > 0 ? (a.valueR / totalValue) * 100 : 0;
        bVal = totalValue > 0 ? (b.valueR / totalValue) * 100 : 0;
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
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
  }, [holdings, sortField, sortDirection, totalValue]);

  const SortIcon = ({ field }: { field: SortField }) => {
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
        if (firstRow && firstRow[0]) {
          setAccountId(firstRow[0]);
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
    const worksheet = XLSX.utils.json_to_sheet(holdings.map(h => ({
      'Investment': h.investment,
      'Identifier': h.identifier,
      'Quantity Held': h.quantityHeld,
      'Last Price': h.lastPrice,
      'Last Price CCY': h.lastPriceCcy,
      'Value': h.value,
      'Value CCY': h.valueCcy,
      'FX Rate': h.fxRate,
      'Last Price (£)': h.lastPriceP,
      'Value (£)': h.valueR,
      'Book Cost': h.bookCost,
      'Book Cost CCY': h.bookCostCcy,
      'Average FX Rate': h.averageFxRate,
      'Book Cost (£)': h.bookCostR,
      '% Change': h.percentChange,
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Holdings');
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    XLSX.writeFile(workbook, `bank_statement_${timestamp}.xlsx`);
  };

  const totalBookCost = holdings.reduce((sum, h) => sum + (h.bookCostR || 0), 0);
  const totalGainLoss = totalValue - totalBookCost;
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

          {/* Holdings Table */}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-950/50 to-slate-900/50 border-b border-slate-800/50">
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={() => handleSort('investment')} className="flex items-center gap-1 hover:text-white transition-colors">
                        Investment <SortIcon field="investment" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={() => handleSort('identifier')} className="flex items-center gap-1 hover:text-white transition-colors">
                        Identifier <SortIcon field="identifier" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={() => handleSort('quantityHeld')} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                        Quantity <SortIcon field="quantityHeld" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={() => handleSort('lastPrice')} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                        Last Price <SortIcon field="lastPrice" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={() => handleSort('value')} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                        Value <SortIcon field="value" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={() => handleSort('valueCcy')} className="flex items-center gap-1 hover:text-white transition-colors mx-auto">
                        Ccy <SortIcon field="valueCcy" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={() => handleSort('valueR')} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                        Value (£) <SortIcon field="valueR" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={() => handleSort('weight')} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                        Weight <SortIcon field="weight" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={() => handleSort('bookCostR')} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                        Book Cost (£) <SortIcon field="bookCostR" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={() => handleSort('returnGBP')} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                        Return (£) <SortIcon field="returnGBP" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <button onClick={() => handleSort('percentChange')} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
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
