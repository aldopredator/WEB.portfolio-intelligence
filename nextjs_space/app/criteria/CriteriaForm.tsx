'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, TrendingUp, DollarSign, Ban, ArrowRight } from 'lucide-react';
import { DEFAULT_CRITERIA, buildCriteriaURL, type ScreeningCriteria } from '@/lib/screening-criteria';

export default function CriteriaForm() {
  const router = useRouter();
  const [criteria, setCriteria] = useState<ScreeningCriteria>(DEFAULT_CRITERIA);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = buildCriteriaURL(criteria);
    router.push(url);
  };

  const handleReset = () => {
    setCriteria(DEFAULT_CRITERIA);
  };

  const toggleSector = (sector: string) => {
    setCriteria(prev => ({
      ...prev,
      excludeSectors: prev.excludeSectors.includes(sector)
        ? prev.excludeSectors.filter(s => s !== sector)
        : [...prev.excludeSectors, sector],
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Valuation Metrics */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-b border-emerald-500/30 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-slate-700/50">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Valuation Metrics</h2>
                <p className="text-slate-300 text-sm mt-1">Financial ratios to identify reasonably valued stocks</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* P/E Ratio */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg">Price-to-Earnings (P/E) Ratio</h3>
                      <p className="text-slate-400 text-sm mt-1">Ensures reasonable valuation relative to earnings</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-slate-400 text-sm">Less Than:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={criteria.maxPE}
                      onChange={(e) => setCriteria({ ...criteria, maxPE: parseFloat(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-32"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* P/B Ratio */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg">Price-to-Book (P/B) Ratio</h3>
                      <p className="text-slate-400 text-sm mt-1">Fair value relative to company assets</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-slate-400 text-sm">Less Than:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={criteria.maxPB}
                      onChange={(e) => setCriteria({ ...criteria, maxPB: parseFloat(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-32"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-b border-blue-500/30 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-slate-700/50">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Performance Metrics</h2>
                <p className="text-slate-300 text-sm mt-1">Growth and momentum indicators for strong performers</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* YTD Return */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg">Year-to-Date Return</h3>
                      <p className="text-slate-400 text-sm mt-1">Positive performance in current year</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-slate-400 text-sm">Greater Than:</span>
                    <input
                      type="number"
                      step="1"
                      value={criteria.minYTD}
                      onChange={(e) => setCriteria({ ...criteria, minYTD: parseFloat(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-32"
                    />
                    <span className="text-white font-mono">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 52-Week Return */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg">52-Week Performance</h3>
                      <p className="text-slate-400 text-sm mt-1">Strong annual growth trajectory</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-slate-400 text-sm">Greater Than:</span>
                    <input
                      type="number"
                      step="1"
                      value={criteria.minWeek52}
                      onChange={(e) => setCriteria({ ...criteria, minWeek52: parseFloat(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-32"
                    />
                    <span className="text-white font-mono">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sector Exclusions */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/30 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-slate-700/50">
                <Ban className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Sector Exclusions</h2>
                <p className="text-slate-300 text-sm mt-1">Industries excluded from investment consideration</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {['Alcohol', 'Gambling'].map((sector) => (
              <div key={sector} className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <button
                      type="button"
                      onClick={() => toggleSector(sector)}
                      className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20 hover:bg-red-500/20 transition-colors"
                    >
                      <XCircle className={`w-5 h-5 ${criteria.excludeSectors.includes(sector) ? 'text-red-400' : 'text-slate-600'}`} />
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-white font-semibold text-lg">Sector: {sector}</h3>
                        <p className="text-slate-400 text-sm mt-1">
                          {sector === 'Alcohol' ? 'Excludes alcohol beverage manufacturers' : 'Excludes gaming and casino operators'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        criteria.excludeSectors.includes(sector)
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {criteria.excludeSectors.includes(sector) ? 'Excluded' : 'Included'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 sticky bottom-6 z-10">
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 px-6 py-4 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 rounded-xl text-white font-semibold transition-all"
        >
          Reset to Defaults
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2"
        >
          Apply Criteria & Screen
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
