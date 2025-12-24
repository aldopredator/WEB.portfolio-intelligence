'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Download, Database } from 'lucide-react';
import * as XLSX from 'xlsx';

type SortField = 'ticker' | 'sector' | 'industry' | 'portfolio' | 'rating' | 'updatedAt' | 'pe' | 'pb' | 'priceToSales' | 'marketCap' | 'avgVolume' | 'avgAnnualVolume10D' | 'avgAnnualVolume3M' | 'beta' | 'roe' | 'profitMargin' | 'debtToEquity' | 'sentiment' | 'matchScore' | 'return30Day' | 'volatility30Day' | 'dailyChange' | 'return60Day' | 'volatility60Day' | 'maxDrawdown' | 'maxDrawup' | 'cagr';
type SortDirection = 'asc' | 'desc';

interface Stock {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  portfolio: string;
  portfolioId: string;
  rating: number;
  updatedAt: Date;
  pe: string;
  pb: string;
  priceToSales: string;
  marketCap: string;
  avgVolume: string;
  avgAnnualVolume10D: string;
  avgAnnualVolume3M: string;
  beta: string;
  roe: string;
  profitMargin: string;
  debtToEquity: string;
  sentiment: string;
  matchScore: number;
  country: string;
  trailingPE: string;
  forwardPE: string;
  enterpriseToRevenue: string;
  enterpriseToEbitda: string;
  roa: string;
  quarterlyRevenueGrowth: string;
  quarterlyEarningsGrowth: string;
  return30Day: string;
  volatility30Day: string;
  dailyChange: string;
  return60Day: string;
  volatility60Day: string;
  maxDrawdown: string;
  maxDrawup: string;
  cagr: string;
}

interface ScreeningTableProps {
  stocks: Stock[];
  criteria: {
    peEnabled: boolean;
    pbEnabled: boolean;
    marketCapEnabled: boolean;
    betaEnabled: boolean;
    roeEnabled: boolean;
    profitMarginEnabled: boolean;
    debtToEquityEnabled: boolean;
    sentimentEnabled: boolean;
    ratingEnabled: boolean;
    avgAnnualVolume10DEnabled: boolean;
    avgAnnualVolume3MEnabled: boolean;
  };
}

export default function ScreeningTable({ stocks, criteria }: ScreeningTableProps) {
  const [sortField, setSortField] = useState<SortField>('matchScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedStocks = useMemo(() => {
    return [...stocks].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Check for N/A values first - always put them at the bottom
      const aIsNA = aVal === 'N/A' || aVal === null || aVal === undefined;
      const bIsNA = bVal === 'N/A' || bVal === null || bVal === undefined;

      if (aIsNA && bIsNA) return 0; // Both N/A, keep same order
      if (aIsNA) return 1; // a is N/A, put it after b
      if (bIsNA) return -1; // b is N/A, put it after a

      // Convert string numbers to actual numbers for sorting
      if (sortField === 'rating') {
        aVal = a.rating;
        bVal = b.rating;
      } else if (sortField === 'updatedAt') {
        aVal = new Date(a.updatedAt).getTime();
        bVal = new Date(b.updatedAt).getTime();
      } else if (sortField === 'pe' || sortField === 'pb' || sortField === 'priceToSales' || sortField === 'beta' || sortField === 'roe' || sortField === 'profitMargin' || sortField === 'debtToEquity') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      } else if (sortField === 'return30Day' || sortField === 'volatility30Day') {
        aVal = parseFloat(aVal.replace(/[%+]/g, ''));
        bVal = parseFloat(bVal.replace(/[%+]/g, ''));
      } else if (sortField === 'marketCap') {
        aVal = parseFloat(aVal.replace(/[$B]/g, ''));
        bVal = parseFloat(bVal.replace(/[$B]/g, ''));
      } else if (sortField === 'avgVolume') {
        aVal = parseFloat(aVal.replace(/[M]/g, ''));
        bVal = parseFloat(bVal.replace(/[M]/g, ''));
      } else if (sortField === 'matchScore') {
        aVal = a.matchScore;
        bVal = b.matchScore;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }, [stocks, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-blue-400" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-400" />
    );
  };

  const exportToExcel = () => {
    // Format date as DDMMYYYY_HHMM
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const filename = `pi_${dd}${mm}${yyyy}_${hh}${min}.xlsx`;

    // Prepare data for export (only enabled columns)
    const exportData = sortedStocks.map(stock => ({
      'Portfolio': stock.portfolio,
      'Ticker': stock.ticker,
      'Name': stock.name,
      'Rating': stock.rating,
      'Last Updated': formatDate(stock.updatedAt),
      'Sector': stock.sector,
      'Industry': stock.industry,
      ...(criteria.peEnabled && { 'P/E': stock.pe }),
      ...(criteria.pbEnabled && { 'P/B': stock.pb }),
      'P/S': stock.priceToSales,
      ...(criteria.marketCapEnabled && { 'Market Cap': stock.marketCap }),
      'Avg Volume': stock.avgVolume,
      ...(criteria.avgAnnualVolume10DEnabled && { 'Avg Annual Volume (10D)': stock.avgAnnualVolume10D }),
      ...(criteria.avgAnnualVolume3MEnabled && { 'Avg Annual Volume (3M)': stock.avgAnnualVolume3M }),
      ...(criteria.betaEnabled && { 'Beta': stock.beta }),
      ...(criteria.roeEnabled && { 'ROE': stock.roe }),
      ...(criteria.profitMarginEnabled && { 'Profit Margin': stock.profitMargin }),
      ...(criteria.debtToEquityEnabled && { 'Debt/Equity': stock.debtToEquity }),
      ...(criteria.sentimentEnabled && { 'Sentiment': stock.sentiment }),
      '30d Return': stock.return30Day,
      '30d Volatility': stock.volatility30Day,
      '1d Change': stock.dailyChange,
      '60d Return': stock.return60Day,
      '60d Volatility': stock.volatility60Day,
      'Max Drawdown': stock.maxDrawdown,
      'Max Drawup': stock.maxDrawup,
      'CAGR': stock.cagr,
      'Match Score': `${stock.matchScore}%`,
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Screening Results');

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.min(Math.max(key.length, 10), maxWidth)
    }));
    worksheet['!cols'] = colWidths;

    // Export file
    XLSX.writeFile(workbook, filename);
  };

  const exportRawData = () => {
    // Format date as DDMMYYYY_HHMM
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const filename = `pi_raw_${dd}${mm}${yyyy}_${hh}${min}.xlsx`;

    // Prepare data for export (all metrics regardless of enabled state)
    const exportData = sortedStocks.map(stock => ({
      'Portfolio': stock.portfolio,
      'Ticker': stock.ticker,
      'Name': stock.name,
      'Rating': stock.rating,
      'Last Updated': formatDate(stock.updatedAt),
      'Sector': stock.sector,
      'Industry': stock.industry,
      'Country': stock.country,
      'P/E': stock.pe,
      'Trailing P/E': stock.trailingPE,
      'Forward P/E': stock.forwardPE,
      'P/B': stock.pb,
      'P/S': stock.priceToSales,
      'Enterprise Value/Revenue': stock.enterpriseToRevenue,
      'Enterprise Value/EBITDA': stock.enterpriseToEbitda,
      'Market Cap': stock.marketCap,
      'Avg Volume': stock.avgVolume,
      'Avg Annual Volume (10D)': stock.avgAnnualVolume10D,
      'Avg Annual Volume (3M)': stock.avgAnnualVolume3M,
      'Beta': stock.beta,
      'ROE': stock.roe,
      'ROA': stock.roa,
      'Profit Margin': stock.profitMargin,
      'Quarterly Revenue Growth': stock.quarterlyRevenueGrowth,
      'Quarterly Earnings Growth': stock.quarterlyEarningsGrowth,
      'Debt/Equity': stock.debtToEquity,
      'Sentiment': stock.sentiment,
      '30d Return': stock.return30Day,
      '30d Volatility': stock.volatility30Day,
      '1d Change': stock.dailyChange,
      '60d Return': stock.return60Day,
      '60d Volatility': stock.volatility60Day,
      'Max Drawdown': stock.maxDrawdown,
      'Max Drawup': stock.maxDrawup,
      'CAGR': stock.cagr,
      'Match Score': `${stock.matchScore}%`,
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Raw Data');

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.min(Math.max(key.length, 10), maxWidth)
    }));
    worksheet['!cols'] = colWidths;

    // Export file
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden">
      {/* Export Buttons */}
      <div className="px-6 py-4 border-b border-slate-800/50 flex justify-end gap-3">
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-400 font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </button>
        <button
          onClick={exportRawData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 font-medium transition-colors"
        >
          <Database className="w-4 h-4" />
          Export Raw Data
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-slate-950/50 to-slate-900/50 border-b border-slate-800/50">
              <th 
                className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => handleSort('portfolio')}
              >
                <div className="flex items-center gap-2">
                  Portfolio
                  <SortIcon field="portfolio" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => handleSort('ticker')}
              >
                <div className="flex items-center gap-2">
                  Stock
                  <SortIcon field="ticker" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-center text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => handleSort('rating')}
              >
                <div className="flex items-center justify-center gap-2">
                  Rating
                  <SortIcon field="rating" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-center text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => handleSort('updatedAt')}
              >
                <div className="flex items-center justify-center gap-2">
                  Last Updated
                  <SortIcon field="updatedAt" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => handleSort('sector')}
              >
                <div className="flex items-center gap-2">
                  Sector
                  <SortIcon field="sector" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => handleSort('industry')}
              >
                <div className="flex items-center gap-2">
                  Industry
                  <SortIcon field="industry" />
                </div>
              </th>
              {criteria.peEnabled && (
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('pe')}
                >
                  <div className="flex items-center justify-end gap-2">
                    P/E
                    <SortIcon field="pe" />
                  </div>
                </th>
              )}
              {criteria.pbEnabled && (
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('pb')}
                >
                  <div className="flex items-center justify-end gap-2">
                    P/B
                    <SortIcon field="pb" />
                  </div>
                </th>
              )}
              <th 
                className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => handleSort('priceToSales')}
              >
                <div className="flex items-center justify-end gap-2">
                  P/S
                  <SortIcon field="priceToSales" />
                </div>
              </th>
              {criteria.marketCapEnabled && (
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('marketCap')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Market Cap
                    <SortIcon field="marketCap" />
                  </div>
                </th>
              )}
              <th 
                className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => handleSort('avgVolume')}
              >
                <div className="flex items-center justify-end gap-2">
                  Avg Volume
                  <SortIcon field="avgVolume" />
                </div>
              </th>
              {criteria.avgAnnualVolume10DEnabled && (
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('avgAnnualVolume10D')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Annual Vol % (10D)
                    <SortIcon field="avgAnnualVolume10D" />
                  </div>
                </th>
              )}
              {criteria.avgAnnualVolume3MEnabled && (
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('avgAnnualVolume3M')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Annual Vol % (3M)
                    <SortIcon field="avgAnnualVolume3M" />
                  </div>
                </th>
              )}
              {criteria.betaEnabled && (
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('beta')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Beta
                    <SortIcon field="beta" />
                  </div>
                </th>
              )}
              {criteria.roeEnabled && (
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('roe')}
                >
                  <div className="flex items-center justify-end gap-2">
                    ROE
                    <SortIcon field="roe" />
                  </div>
                </th>
              )}
              {criteria.profitMarginEnabled && (
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('profitMargin')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Profit Margin
                    <SortIcon field="profitMargin" />
                  </div>
                </th>
              )}
              {criteria.debtToEquityEnabled && (
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('debtToEquity')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Debt/Equity
                    <SortIcon field="debtToEquity" />
                  </div>
                </th>
              )}
              {criteria.sentimentEnabled && (
                <th 
                  className="px-6 py-4 text-center text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('sentiment')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Sentiment
                    <SortIcon field="sentiment" />
                  </div>
                </th>
              )}
              <th 
                className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => handleSort('return30Day')}
              >
                <div className="flex items-center justify-end gap-2">
                  30d Return
                  <SortIcon field="return30Day" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => handleSort('volatility30Day')}
              >
                <div className="flex items-center justify-end gap-2">
                  30d Vol
                  <SortIcon field="volatility30Day" />
                </div>
              </th>
              {criteria.betaEnabled && (
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('dailyChange')}
                >
                  <div className="flex items-center justify-end gap-2">
                    1d Change
                    <SortIcon field="dailyChange" />
                  </div>
                </th>
              )}
              {criteria.betaEnabled && (
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('return60Day')}
                >
                  <div className="flex items-center justify-end gap-2">
                    60d Return
                    <SortIcon field="return60Day" />
                  </div>
                </th>
              )}
              {criteria.betaEnabled && (
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('volatility60Day')}
                >
                  <div className="flex items-center justify-end gap-2">
                    60d Vol
                    <SortIcon field="volatility60Day" />
                  </div>
                </th>
              )}
              {criteria.betaEnabled && (
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('maxDrawdown')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Max DD
                    <SortIcon field="maxDrawdown" />
                  </div>
                </th>
              )}
              {criteria.betaEnabled && (
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('maxDrawup')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Max DU
                    <SortIcon field="maxDrawup" />
                  </div>
                </th>
              )}
              {criteria.betaEnabled && (
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleSort('cagr')}
                >
                  <div className="flex items-center justify-end gap-2">
                    CAGR
                    <SortIcon field="cagr" />
                  </div>
                </th>
              )}
              <th 
                className="px-6 py-4 text-center text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => handleSort('matchScore')}
              >
                <div className="flex items-center justify-center gap-2">
                  Match Score
                  <SortIcon field="matchScore" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {sortedStocks.map((stock) => (
              <tr
                key={stock.ticker}
                className="hover:bg-slate-800/30 transition-all group"
              >
                <td className="px-6 py-5">
                  <span className="inline-block px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-medium">
                    {stock.portfolio}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <Link 
                    href={`https://www.portfolio-intelligence.co.uk/?stock=${stock.ticker}&portfolio=${stock.portfolioId}`}
                    className="group/link block hover:bg-slate-800/30 -mx-2 px-2 py-1 rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="text-white font-bold text-lg group-hover/link:text-blue-400 transition-colors">{stock.ticker}</div>
                        <div className="text-slate-400 text-sm mt-1">{stock.name}</div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-600 group-hover/link:text-blue-400 opacity-0 group-hover/link:opacity-100 transition-all" />
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= stock.rating ? 'text-yellow-400' : 'text-slate-600'}>
                        {star <= stock.rating ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-center">
                    <div className="text-slate-300 text-sm font-medium">{formatDate(stock.updatedAt)}</div>
                    <div className="text-slate-500 text-xs mt-1">
                      {new Date(stock.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">
                    {stock.sector}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-medium">
                    {stock.industry}
                  </span>
                </td>
                {criteria.peEnabled && (
                  <td className="px-6 py-5 text-right">
                    <span className="text-emerald-400 font-mono font-bold text-lg">{stock.pe}</span>
                  </td>
                )}
                {criteria.pbEnabled && (
                  <td className="px-6 py-5 text-right">
                    <span className="text-emerald-400 font-mono font-bold text-lg">{stock.pb}</span>
                  </td>
                )}
                <td className="px-6 py-5 text-right">
                  <span className="text-emerald-400 font-mono font-bold text-lg">{stock.priceToSales}</span>
                </td>
                {criteria.marketCapEnabled && (
                  <td className="px-6 py-5 text-right">
                    <span className="text-purple-400 font-mono font-bold text-lg">{stock.marketCap}</span>
                  </td>
                )}
                <td className="px-6 py-5 text-right">
                  <span className="text-purple-400 font-mono font-bold text-lg">{stock.avgVolume}</span>
                </td>
                {criteria.avgAnnualVolume10DEnabled && (
                  <td className="px-6 py-5 text-right">
                    <span className="text-purple-400 font-mono font-bold text-lg">{stock.avgAnnualVolume10D}</span>
                  </td>
                )}
                {criteria.avgAnnualVolume3MEnabled && (
                  <td className="px-6 py-5 text-right">
                    <span className="text-purple-400 font-mono font-bold text-lg">{stock.avgAnnualVolume3M}</span>
                  </td>
                )}
                {criteria.betaEnabled && (
                  <td className="px-6 py-5 text-right">
                    <span className="text-purple-400 font-mono font-bold text-lg">{stock.beta}</span>
                  </td>
                )}
                {criteria.roeEnabled && (
                  <td className="px-6 py-5 text-right">
                    <span className="text-purple-400 font-mono font-bold text-lg">{stock.roe}</span>
                  </td>
                )}
                {criteria.profitMarginEnabled && (
                  <td className="px-6 py-5 text-right">
                    <span className="text-purple-400 font-mono font-bold text-lg">{stock.profitMargin}</span>
                  </td>
                )}
                {criteria.debtToEquityEnabled && (
                  <td className="px-6 py-5 text-right">
                    <span className="text-purple-400 font-mono font-bold text-lg">{stock.debtToEquity}</span>
                  </td>
                )}
                {criteria.sentimentEnabled && (
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      stock.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      stock.sentiment === 'negative' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      stock.sentiment === 'neutral' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                      'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {stock.sentiment}
                    </span>
                  </td>
                )}
                <td className="px-6 py-5 text-right">
                  <span className={`font-mono font-bold text-lg ${
                    stock.return30Day.startsWith('+') ? 'text-emerald-400' : 
                    stock.return30Day.startsWith('-') ? 'text-red-400' : 
                    'text-slate-400'
                  }`}>
                    {stock.return30Day}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <span className="text-blue-400 font-mono font-bold text-lg">{stock.volatility30Day}</span>
                </td>
                {criteria.betaEnabled && (
                  <td className="px-6 py-5 text-right">
                    <span className={`font-mono font-bold text-lg ${
                      stock.dailyChange.startsWith('+') ? 'text-emerald-400' : 
                      stock.dailyChange.startsWith('-') ? 'text-red-400' : 
                      'text-slate-400'
                    }`}>
                      {stock.dailyChange}
                    </span>
                  </td>
                )}
                {criteria.betaEnabled && (
                  <td className="px-6 py-5 text-right">
                    <span className={`font-mono font-bold text-lg ${
                      stock.return60Day.startsWith('+') ? 'text-emerald-400' : 
                      stock.return60Day.startsWith('-') ? 'text-red-400' : 
                      'text-slate-400'
                    }`}>
                      {stock.return60Day}
                    </span>
                  </td>
                )}
                {criteria.betaEnabled && (
                  <td className="px-6 py-5 text-right">
                    <span className="text-blue-400 font-mono font-bold text-lg">{stock.volatility60Day}</span>
                  </td>
                )}
                {criteria.betaEnabled && (
                  <td className="px-6 py-5 text-right">
                    <span className={`font-mono font-bold text-lg ${
                      stock.maxDrawdown.startsWith('-') ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {stock.maxDrawdown}
                    </span>
                  </td>
                )}
                {criteria.betaEnabled && (
                  <td className="px-6 py-5 text-right">
                    <span className={`font-mono font-bold text-lg ${
                      stock.maxDrawup.startsWith('+') ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      {stock.maxDrawup}
                    </span>
                  </td>
                )}
                {criteria.betaEnabled && (
                  <td className="px-6 py-5 text-right">
                    <span className={`font-mono font-bold text-lg ${
                      stock.cagr.startsWith('+') ? 'text-emerald-400' : 
                      stock.cagr.startsWith('-') ? 'text-red-400' : 
                      'text-slate-400'
                    }`}>
                      {stock.cagr}
                    </span>
                  </td>
                )}
                <td className="px-6 py-5">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-emerald-400 font-bold text-lg">{stock.matchScore}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
