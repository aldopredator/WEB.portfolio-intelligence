'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { MASTER_SECTORS } from '@/lib/master-sectors';

interface Stock {
  ticker: string;
  name: string;
  sector: string;
  marketCap?: number;
  change?: number;
  changePercent?: number;
}

interface SectorMatrixProps {
  sectorGroups: Record<string, Stock[]>;
}

const SECTOR_COLORS: Record<string, string> = {
  'Technology': 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  'Consumer Cyclical': 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  'Financial Services': 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
  'Healthcare': 'from-red-500/20 to-rose-500/20 border-red-500/30',
  'Communication Services': 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
  'Industrials': 'from-slate-500/20 to-gray-500/20 border-slate-500/30',
  'Energy': 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  'Consumer Defensive': 'from-green-500/20 to-lime-500/20 border-green-500/30',
  'Real Estate': 'from-indigo-500/20 to-violet-500/20 border-indigo-500/30',
  'Utilities': 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  'Basic Materials': 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
};

const SECTOR_TEXT_COLORS: Record<string, string> = {
  'Technology': 'text-blue-400',
  'Consumer Cyclical': 'text-purple-400',
  'Financial Services': 'text-emerald-400',
  'Healthcare': 'text-red-400',
  'Communication Services': 'text-orange-400',
  'Industrials': 'text-slate-400',
  'Energy': 'text-yellow-400',
  'Consumer Defensive': 'text-green-400',
  'Real Estate': 'text-indigo-400',
  'Utilities': 'text-cyan-400',
  'Basic Materials': 'text-amber-400',
};

export default function SectorMatrix({ sectorGroups }: SectorMatrixProps) {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  const getSectorSize = (stocks: Stock[]) => {
    const stockCount = stocks.length;
    // Scale size based on number of stocks for optimal space utilization
    if (stockCount >= 40) return 'xlarge';
    if (stockCount >= 20) return 'large';
    if (stockCount >= 10) return 'medium';
    return 'small';
  };

  const getSectorSizeClass = (size: string) => {
    switch (size) {
      case 'xlarge': return 'col-span-2 row-span-2';
      case 'large': return 'col-span-2';
      case 'medium': return 'col-span-1 row-span-2';
      default: return 'col-span-1';
    }
  };

  // Create entries for all master sectors, including empty ones
  const allSectors = MASTER_SECTORS.map(sector => [
    sector,
    sectorGroups[sector] || []
  ] as [string, Stock[]]);
  
  // Sort: sectors with stocks first (by stock count desc), then empty ones alphabetically
  const sectors = allSectors.sort((a, b) => {
    const aCount = a[1].length;
    const bCount = b[1].length;
    if (aCount === 0 && bCount === 0) return a[0].localeCompare(b[0]); // Both empty: alphabetical
    if (aCount === 0) return 1; // a is empty: move to end
    if (bCount === 0) return -1; // b is empty: move to end
    return bCount - aCount; // Both have stocks: sort by count descending
  });

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
          <div className="text-slate-400 text-sm mb-1">Total Sectors</div>
          <div className="text-white text-3xl font-bold">{sectors.length}</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
          <div className="text-slate-400 text-sm mb-1">Total Stocks</div>
          <div className="text-white text-3xl font-bold">
            {Object.values(sectorGroups).reduce((sum, stocks) => sum + stocks.length, 0)}
          </div>
        </div>
      </div>

      {/* Sector Matrix - Cloud Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
        {sectors.map(([sector, stocks]) => {
          const size = getSectorSize(stocks);
          const sizeClass = getSectorSizeClass(size);
          const colorClass = SECTOR_COLORS[sector] || 'from-slate-500/20 to-gray-500/20 border-slate-500/30';
          const textColor = SECTOR_TEXT_COLORS[sector] || 'text-slate-400';
          const totalMarketCap = stocks.reduce((sum, s) => sum + (s.marketCap || 0), 0);
          const avgChange = stocks.reduce((sum, s) => sum + (s.changePercent || 0), 0) / stocks.length;

          return (
            <div
              key={sector}
              className={`${sizeClass} bg-gradient-to-br ${colorClass} backdrop-blur-sm border rounded-xl p-6 hover:scale-105 transition-all cursor-pointer group`}
              onClick={() => setSelectedSector(selectedSector === sector ? null : sector)}
            >
              <div className="flex flex-col h-full">
                {/* Sector Header */}
                <div className="mb-4">
                  <h3 className={`text-xl font-bold ${textColor} mb-1 group-hover:text-white transition-colors`}>
                    {sector}
                  </h3>
                  <div className="text-slate-400 text-sm">{stocks.length} stocks</div>
                </div>

                {/* Stock Chips - Compact Cloud */}
                <div className="flex-1 flex flex-wrap gap-2 content-start">
                  {stocks.length === 0 ? (
                    <div className="text-slate-600 text-sm italic">No stocks yet - opportunity for diversification</div>
                  ) : (
                    stocks.map((stock) => (
                    <Link
                      key={stock.ticker}
                      href={`/dashboard?ticker=${stock.ticker}`}
                      onClick={(e) => e.stopPropagation()}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 bg-slate-950/50 hover:bg-slate-950/80 border border-slate-700/50 hover:border-slate-600 rounded-lg transition-all group/chip ${textColor}`}
                    >
                      <span className="font-mono font-semibold text-sm">{stock.ticker}</span>
                      {stock.changePercent !== undefined && (
                        <span className={`text-xs font-mono ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%
                        </span>
                      )}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover/chip:opacity-100 transition-opacity" />
                    </Link>
                  ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Sector Details */}
      {selectedSector && (
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">{selectedSector} - Detailed View</h3>
            <button
              onClick={() => setSelectedSector(null)}
              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectorGroups[selectedSector].map((stock) => (
              <Link
                key={stock.ticker}
                href={`/dashboard?ticker=${stock.ticker}`}
                className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5 hover:border-slate-700/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">
                      {stock.ticker}
                    </h4>
                    <p className="text-slate-400 text-sm mt-1">{stock.name}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="text-slate-500 text-xs">Market Cap</div>
                    <div className="text-white font-mono font-semibold">{formatMarketCap(stock.marketCap)}</div>
                  </div>
                  {stock.changePercent !== undefined && (
                    <div>
                      <div className="text-slate-500 text-xs">Change</div>
                      <div className={`flex items-center gap-1 font-mono font-semibold ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stock.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
