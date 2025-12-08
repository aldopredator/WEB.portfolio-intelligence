'use client';

import { useState, useMemo } from 'react';
import { CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortField = 'ticker' | 'sector' | 'portfolio' | 'rating' | 'pe' | 'pb' | 'priceToSales' | 'marketCap' | 'avgVolume' | 'beta' | 'roe' | 'profitMargin' | 'debtToEquity' | 'sentiment' | 'matchScore';
type SortDirection = 'asc' | 'desc';

interface Stock {
  ticker: string;
  name: string;
  sector: string;
  portfolio: string;
  rating: number;
  pe: string;
  pb: string;
  priceToSales: string;
  marketCap: string;
  avgVolume: string;
  beta: string;
  roe: string;
  profitMargin: string;
  debtToEquity: string;
  sentiment: string;
  matchScore: number;
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
  };
}

export default function ScreeningTable({ stocks, criteria }: ScreeningTableProps) {
  const [sortField, setSortField] = useState<SortField>('matchScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

      // Convert string numbers to actual numbers for sorting
      if (sortField === 'rating') {
        aVal = a.rating;
        bVal = b.rating;
      } else if (sortField === 'pe' || sortField === 'pb' || sortField === 'priceToSales' || sortField === 'beta' || sortField === 'roe' || sortField === 'profitMargin' || sortField === 'debtToEquity') {
        aVal = aVal === 'N/A' ? -Infinity : parseFloat(aVal);
        bVal = bVal === 'N/A' ? -Infinity : parseFloat(bVal);
      } else if (sortField === 'marketCap') {
        aVal = aVal === 'N/A' ? -Infinity : parseFloat(aVal.replace(/[$B]/g, ''));
        bVal = bVal === 'N/A' ? -Infinity : parseFloat(bVal.replace(/[$B]/g, ''));
      } else if (sortField === 'avgVolume') {
        aVal = aVal === 'N/A' ? -Infinity : parseFloat(aVal.replace(/[M]/g, ''));
        bVal = bVal === 'N/A' ? -Infinity : parseFloat(bVal.replace(/[M]/g, ''));
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

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden">
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
                className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => handleSort('sector')}
              >
                <div className="flex items-center gap-2">
                  Sector
                  <SortIcon field="sector" />
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
                  <div>
                    <div className="text-white font-bold text-lg">{stock.ticker}</div>
                    <div className="text-slate-400 text-sm mt-1">{stock.name}</div>
                  </div>
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
                  <span className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">
                    {stock.sector}
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
