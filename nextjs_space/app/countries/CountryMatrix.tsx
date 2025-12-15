'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { MASTER_COUNTRIES } from '@/lib/master-countries';

interface Stock {
  ticker: string;
  name: string;
  country: string;
  marketCap?: number;
  change?: number;
  changePercent?: number;
}

interface CountryMatrixProps {
  countryGroups: Record<string, Stock[]>;
}

const COUNTRY_COLORS: Record<string, string> = {
  'United States': 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  'China': 'from-red-500/20 to-orange-500/20 border-red-500/30',
  'Japan': 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
  'United Kingdom': 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30',
  'Germany': 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
  'France': 'from-blue-500/20 to-purple-500/20 border-blue-500/30',
  'India': 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
  'Canada': 'from-red-500/20 to-white/10 border-red-500/30',
  'South Korea': 'from-blue-500/20 to-red-500/20 border-blue-500/30',
  'Italy': 'from-green-500/20 to-red-500/20 border-green-500/30',
  'Brazil': 'from-green-500/20 to-yellow-500/20 border-green-500/30',
  'Australia': 'from-blue-500/20 to-yellow-500/20 border-blue-500/30',
};

const COUNTRY_TEXT_COLORS: Record<string, string> = {
  'United States': 'text-blue-400',
  'China': 'text-red-400',
  'Japan': 'text-pink-400',
  'United Kingdom': 'text-indigo-400',
  'Germany': 'text-yellow-400',
  'France': 'text-purple-400',
  'India': 'text-orange-400',
  'Canada': 'text-red-300',
  'South Korea': 'text-blue-300',
  'Italy': 'text-green-400',
  'Brazil': 'text-green-300',
  'Australia': 'text-cyan-400',
};

export default function CountryMatrix({ countryGroups }: CountryMatrixProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  const getCountrySize = (stocks: Stock[]) => {
    const stockCount = stocks.length;
    // Scale size based on number of stocks for optimal space utilization
    if (stockCount >= 40) return 'xlarge';
    if (stockCount >= 20) return 'large';
    if (stockCount >= 10) return 'medium';
    if (stockCount >= 1) return 'small';
    return 'tiny';
  };

  const getCountrySizeClass = (size: string) => {
    switch (size) {
      case 'xlarge': return 'col-span-2 row-span-2';
      case 'large': return 'col-span-2';
      case 'medium': return 'col-span-1 row-span-2';
      case 'small': return 'col-span-1';
      default: return 'col-span-1 h-24';
    }
  };

  // Geographic regions for better organization
  const GEOGRAPHIC_REGIONS = {
    'North America': ['United States', 'Canada', 'Mexico'],
    'Europe': ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Belgium', 'Sweden', 'Ireland', 'Norway', 'Denmark', 'Poland', 'Portugal', 'Finland', 'Greece', 'Czech Republic', 'Romania', 'Hungary', 'Austria'],
    'Asia Pacific': ['China', 'Japan', 'India', 'South Korea', 'Australia', 'Taiwan', 'Singapore', 'Hong Kong', 'Indonesia', 'Thailand', 'Malaysia', 'Philippines', 'Vietnam', 'New Zealand'],
    'Middle East': ['Saudi Arabia', 'Turkey', 'Israel', 'United Arab Emirates', 'Egypt'],
    'Latin America': ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru'],
    'Africa': ['South Africa', 'Egypt', 'Nigeria'],
    'Other': ['Pakistan']
  };

  // Create country-to-region mapping
  const countryToRegion = Object.entries(GEOGRAPHIC_REGIONS).reduce((acc, [region, countries]) => {
    countries.forEach(country => acc[country] = region);
    return acc;
  }, {} as Record<string, string>);

  // Create entries for all master countries, including empty ones
  const allCountries = MASTER_COUNTRIES.map(country => ([
    country,
    countryGroups[country] || [],
    countryToRegion[country] || 'Other'
  ] as [string, Stock[], string]));
  
  // Sort: countries with stocks first (by stock count desc), then by region and alphabetically
  const countries = allCountries.sort((a, b) => {
    const aCount = a[1].length;
    const bCount = b[1].length;
    
    // Both have stocks: sort by count descending
    if (aCount > 0 && bCount > 0) return bCount - aCount;
    
    // Both empty: sort by region, then alphabetically
    if (aCount === 0 && bCount === 0) {
      if (a[2] !== b[2]) return a[2].localeCompare(b[2]);
      return a[0].localeCompare(b[0]);
    }
    
    // Move empty countries to end
    if (aCount === 0) return 1;
    if (bCount === 0) return -1;
    
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
          <div className="text-slate-400 text-sm mb-1">Total Countries</div>
          <div className="text-white text-3xl font-bold">{countries.length}</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
          <div className="text-slate-400 text-sm mb-1">Total Stocks</div>
          <div className="text-white text-3xl font-bold">
            {Object.values(countryGroups).reduce((sum, stocks) => sum + stocks.length, 0)}
          </div>
        </div>
      </div>

      {/* Country Matrix - Cloud Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
        {countries.map(([country, stocks]) => {
          const size = getCountrySize(stocks);
          const sizeClass = getCountrySizeClass(size);
          const colorClass = COUNTRY_COLORS[country] || 'from-slate-500/20 to-gray-500/20 border-slate-500/30';
          const textColor = COUNTRY_TEXT_COLORS[country] || 'text-slate-400';

          return (
            <div
              key={country}
              className={`${sizeClass} bg-gradient-to-br ${colorClass} backdrop-blur-sm border rounded-xl p-6 hover:scale-105 transition-all cursor-pointer group`}
              onClick={() => setSelectedCountry(selectedCountry === country ? null : country)}
            >
              <div className="flex flex-col h-full">
                {/* Country Header */}
                <div className="mb-4">
                  <h3 className={`text-xl font-bold ${textColor} mb-1 group-hover:text-white transition-colors`}>
                    {country}
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

      {/* Selected Country Details */}
      {selectedCountry && countryGroups[selectedCountry] && countryGroups[selectedCountry].length > 0 && (
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">{selectedCountry} - Detailed View</h3>
            <button
              onClick={() => setSelectedCountry(null)}
              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countryGroups[selectedCountry].map((stock) => (
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
