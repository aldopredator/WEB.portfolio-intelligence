'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, TrendingUp, Ban, ArrowRight, Plus, Trash2, Save } from 'lucide-react';
import { DEFAULT_CRITERIA, buildCriteriaURL, type ScreeningCriteria } from '@/lib/screening-criteria';

const STORAGE_KEY = 'portfolio_screening_criteria';

// Common sectors for dropdown
const COMMON_SECTORS = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer Cyclical',
  'Consumer Defensive',
  'Communication Services',
  'Energy',
  'Utilities',
  'Real Estate',
  'Industrials',
  'Basic Materials',
  'Tobacco',
  'Weapons',
  'Gambling',
  'Alcohol'
].sort();

// Common countries for dropdown
// Country codes matching Finnhub API format (e.g., "US", "GB", "CN")
const COMMON_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'DE', name: 'Germany' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'CA', name: 'Canada' },
  { code: 'KR', name: 'South Korea' },
  { code: 'AU', name: 'Australia' },
  { code: 'RU', name: 'Russia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function CriteriaForm() {
  const router = useRouter();
  const [criteria, setCriteria] = useState<ScreeningCriteria>(DEFAULT_CRITERIA);
  const [newSector, setNewSector] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load saved criteria from localStorage on mount and auto-apply
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all fields exist (handles schema updates)
        const loadedCriteria = {
          ...DEFAULT_CRITERIA,
          ...parsed,
          // Ensure arrays exist
          excludeSectors: Array.isArray(parsed.excludeSectors) ? parsed.excludeSectors : DEFAULT_CRITERIA.excludeSectors,
          excludeCountries: Array.isArray(parsed.excludeCountries) ? parsed.excludeCountries : DEFAULT_CRITERIA.excludeCountries,
        };
        setCriteria(loadedCriteria);
        
        // Auto-apply the loaded criteria
        const url = buildCriteriaURL(loadedCriteria);
        router.push(url);
      } catch (e) {
        console.error('Failed to parse saved criteria:', e);
        // If parsing fails, use defaults
        setCriteria(DEFAULT_CRITERIA);
      }
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = buildCriteriaURL(criteria);
    router.push(url);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(criteria));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleReset = () => {
    setCriteria(DEFAULT_CRITERIA);
    setNewSector('');
    setNewCountry('');
    localStorage.removeItem(STORAGE_KEY);
  };

  const addSector = () => {
    if (newSector.trim() && !criteria.excludeSectors.includes(newSector.trim())) {
      setCriteria(prev => ({
        ...prev,
        excludeSectors: [...prev.excludeSectors, newSector.trim()],
      }));
      setNewSector('');
    }
  };

  const removeSector = (sector: string) => {
    setCriteria(prev => ({
      ...prev,
      excludeSectors: prev.excludeSectors.filter(s => s !== sector),
    }));
  };

  const addCountry = () => {
    if (newCountry.trim() && !criteria.excludeCountries.includes(newCountry.trim())) {
      setCriteria(prev => ({
        ...prev,
        excludeCountries: [...prev.excludeCountries, newCountry.trim()],
      }));
      setNewCountry('');
    }
  };

  const removeCountry = (country: string) => {
    setCriteria(prev => ({
      ...prev,
      excludeCountries: prev.excludeCountries.filter(c => c !== country),
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Action Buttons - Sticky at top */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm pb-4 mb-4 border-b border-slate-800/50">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 rounded-lg text-white font-medium text-sm transition-all"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saveSuccess ? 'Saved!' : 'Save'}
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-lg text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            Apply
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-4">
        {/* Financial Metrics - Merged Valuation and Additional Metrics */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-b border-emerald-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-slate-700/50">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Financial Metrics</h2>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* P/E Ratio */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, peEnabled: !criteria.peEnabled })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.peEnabled
                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.peEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-white font-semibold text-base">P/E</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-mono font-bold text-base">{criteria.maxPE.toFixed(1)}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        criteria.peEnabled
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {criteria.peEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Spectrum Slider for P/E */}
                  <div className="mt-1">
                    <div className="relative px-2">
                      {/* Spectrum Track */}
                      <div className="relative h-8 flex items-center">
                        {/* Background gradient track */}
                        <div
                          className="absolute left-0 right-0 h-3 rounded-full"
                          style={{
                            background: 'linear-gradient(to right, #10b981, #fbbf24, #ef4444)',
                            opacity: criteria.peEnabled ? 0.4 : 0.2,
                          }}
                        />
                        
                        {/* Current value cursor */}
                        <div
                          className="absolute"
                          style={{
                            left: `${(criteria.maxPE / 500) * 100}%`,
                            transform: 'translateX(-50%)',
                            zIndex: 10,
                          }}
                        >
                          <div className={`w-5 h-5 rounded-full border-3 shadow-lg transition-all ${
                            criteria.peEnabled
                              ? 'bg-blue-500 border-white'
                              : 'bg-slate-600 border-slate-400'
                          }`} />
                        </div>
                      </div>
                      
                      {/* Slider input */}
                      <input
                        type="range"
                        min="5"
                        max="500"
                        step="1"
                        value={criteria.maxPE}
                        onChange={(e) => setCriteria({ ...criteria, maxPE: parseFloat(e.target.value) })}
                        disabled={!criteria.peEnabled}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        style={{ zIndex: 20 }}
                      />
                      
                      {/* Scale markers */}
                      <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>5</span>
                        <span>125</span>
                        <span>250</span>
                        <span>375</span>
                        <span>500</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* P/S */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, priceToSalesEnabled: !criteria.priceToSalesEnabled })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.priceToSalesEnabled
                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.priceToSalesEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-white font-semibold text-base">P/S</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      criteria.priceToSalesEnabled
                        ? 'bg-purple-500/10 text-emerald-400 border border-purple-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {criteria.priceToSalesEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="mt-1 space-y-3">
                    {/* Min Price/Sales */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-xs font-medium">Minimum</span>
                        <span className="text-white font-mono font-bold text-sm">{criteria.minPriceToSales.toFixed(1)}</span>
                      </div>
                      <div className="relative px-2">
                        <div className="relative h-8 flex items-center">
                          <div
                            className="absolute left-0 right-0 h-3 rounded-full"
                            style={{
                              background: 'linear-gradient(to right, #ef4444, #fbbf24, #10b981)',
                              opacity: criteria.priceToSalesEnabled ? 0.4 : 0.2,
                            }}
                          />
                          <div
                            className="absolute"
                            style={{
                              left: `${(criteria.minPriceToSales / 20) * 100}%`,
                              transform: 'translateX(-50%)',
                              zIndex: 10,
                            }}
                          >
                            <div className={`w-5 h-5 rounded-full border-3 shadow-lg transition-all ${
                              criteria.priceToSalesEnabled ? 'bg-blue-500 border-white' : 'bg-slate-600 border-slate-400'
                            }`} />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="0.1"
                          value={criteria.minPriceToSales}
                          onChange={(e) => setCriteria({ ...criteria, minPriceToSales: parseFloat(e.target.value) })}
                          disabled={!criteria.priceToSalesEnabled}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          style={{ zIndex: 20 }}
                        />
                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                          <span>0</span>
                          <span>5</span>
                          <span>10</span>
                          <span>15</span>
                          <span>20</span>
                        </div>
                      </div>
                    </div>

                    {/* Max Price/Sales */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-xs font-medium">Maximum</span>
                        <span className="text-white font-mono font-bold text-sm">{criteria.maxPriceToSales.toFixed(1)}</span>
                      </div>
                      <div className="relative px-2">
                        <div className="relative h-8 flex items-center">
                          <div
                            className="absolute left-0 right-0 h-3 rounded-full"
                            style={{
                              background: 'linear-gradient(to right, #ef4444, #fbbf24, #10b981)',
                              opacity: criteria.priceToSalesEnabled ? 0.4 : 0.2,
                            }}
                          />
                          <div
                            className="absolute"
                            style={{
                              left: `${(criteria.maxPriceToSales / 20) * 100}%`,
                              transform: 'translateX(-50%)',
                              zIndex: 10,
                            }}
                          >
                            <div className={`w-5 h-5 rounded-full border-3 shadow-lg transition-all ${
                              criteria.priceToSalesEnabled ? 'bg-blue-500 border-white' : 'bg-slate-600 border-slate-400'
                            }`} />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="0.1"
                          value={criteria.maxPriceToSales}
                          onChange={(e) => setCriteria({ ...criteria, maxPriceToSales: parseFloat(e.target.value) })}
                          disabled={!criteria.priceToSalesEnabled}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          style={{ zIndex: 20 }}
                        />
                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                          <span>0</span>
                          <span>5</span>
                          <span>10</span>
                          <span>15</span>
                          <span>20</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* P/B Ratio */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, pbEnabled: !criteria.pbEnabled })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.pbEnabled
                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.pbEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-white font-semibold text-base">P/B</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-mono font-bold text-base">{criteria.maxPB.toFixed(1)}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        criteria.pbEnabled
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {criteria.pbEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Spectrum Slider for P/B */}
                  <div className="mt-1">
                    <div className="relative px-2">
                      {/* Spectrum Track */}
                      <div className="relative h-8 flex items-center">
                        {/* Background gradient track */}
                        <div
                          className="absolute left-0 right-0 h-3 rounded-full"
                          style={{
                            background: 'linear-gradient(to right, #10b981, #fbbf24, #ef4444)',
                            opacity: criteria.pbEnabled ? 0.4 : 0.2,
                          }}
                        />
                        
                        {/* Current value cursor */}
                        <div
                          className="absolute"
                          style={{
                            left: `${(criteria.maxPB / 100) * 100}%`,
                            transform: 'translateX(-50%)',
                            zIndex: 10,
                          }}
                        >
                          <div className={`w-5 h-5 rounded-full border-3 shadow-lg transition-all ${
                            criteria.pbEnabled
                              ? 'bg-blue-500 border-white'
                              : 'bg-slate-600 border-slate-400'
                          }`} />
                        </div>
                      </div>
                      
                      {/* Slider input */}
                      <input
                        type="range"
                        min="0.5"
                        max="100"
                        step="0.5"
                        value={criteria.maxPB}
                        onChange={(e) => setCriteria({ ...criteria, maxPB: parseFloat(e.target.value) })}
                        disabled={!criteria.pbEnabled}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        style={{ zIndex: 20 }}
                      />
                      
                      {/* Scale markers */}
                      <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>0.5</span>
                        <span>25</span>
                        <span>50</span>
                        <span>75</span>
                        <span>100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Avg Daily Volume */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, avgDailyVolumeEnabled: !criteria.avgDailyVolumeEnabled })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.avgDailyVolumeEnabled
                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.avgDailyVolumeEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-white font-semibold text-base">Avg Daily Volume</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      criteria.avgDailyVolumeEnabled
                        ? 'bg-purple-500/10 text-emerald-400 border border-purple-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {criteria.avgDailyVolumeEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="mt-1 space-y-3">
                    {/* Min Avg Daily Volume */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-xs font-medium">Minimum</span>
                        <span className="text-white font-mono font-bold text-sm">{criteria.minAvgDailyVolume.toFixed(0)}M</span>
                      </div>
                      <div className="relative px-2">
                        <div className="relative h-8 flex items-center">
                          <div
                            className="absolute left-0 right-0 h-3 rounded-full"
                            style={{
                              background: 'linear-gradient(to right, #ef4444, #fbbf24, #10b981)',
                              opacity: criteria.avgDailyVolumeEnabled ? 0.4 : 0.2,
                            }}
                          />
                          <div
                            className="absolute"
                            style={{
                              left: `${(criteria.minAvgDailyVolume / 1000) * 100}%`,
                              transform: 'translateX(-50%)',
                              zIndex: 10,
                            }}
                          >
                            <div className={`w-5 h-5 rounded-full border-3 shadow-lg transition-all ${
                              criteria.avgDailyVolumeEnabled ? 'bg-blue-500 border-white' : 'bg-slate-600 border-slate-400'
                            }`} />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="1"
                          value={criteria.minAvgDailyVolume}
                          onChange={(e) => setCriteria({ ...criteria, minAvgDailyVolume: parseFloat(e.target.value) })}
                          disabled={!criteria.avgDailyVolumeEnabled}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          style={{ zIndex: 20 }}
                        />
                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                          <span>0M</span>
                          <span>250M</span>
                          <span>500M</span>
                          <span>750M</span>
                          <span>1000M</span>
                        </div>
                      </div>
                    </div>

                    {/* Max Avg Daily Volume */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-xs font-medium">Maximum</span>
                        <span className="text-white font-mono font-bold text-sm">{criteria.maxAvgDailyVolume.toFixed(0)}M</span>
                      </div>
                      <div className="relative px-2">
                        <div className="relative h-8 flex items-center">
                          <div
                            className="absolute left-0 right-0 h-3 rounded-full"
                            style={{
                              background: 'linear-gradient(to right, #ef4444, #fbbf24, #10b981)',
                              opacity: criteria.avgDailyVolumeEnabled ? 0.4 : 0.2,
                            }}
                          />
                          <div
                            className="absolute"
                            style={{
                              left: `${(criteria.maxAvgDailyVolume / 1000) * 100}%`,
                              transform: 'translateX(-50%)',
                              zIndex: 10,
                            }}
                          >
                            <div className={`w-5 h-5 rounded-full border-3 shadow-lg transition-all ${
                              criteria.avgDailyVolumeEnabled ? 'bg-blue-500 border-white' : 'bg-slate-600 border-slate-400'
                            }`} />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="1"
                          value={criteria.maxAvgDailyVolume}
                          onChange={(e) => setCriteria({ ...criteria, maxAvgDailyVolume: parseFloat(e.target.value) })}
                          disabled={!criteria.avgDailyVolumeEnabled}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          style={{ zIndex: 20 }}
                        />
                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                          <span>0M</span>
                          <span>250M</span>
                          <span>500M</span>
                          <span>750M</span>
                          <span>1000M</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Cap */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, marketCapEnabled: !criteria.marketCapEnabled })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.marketCapEnabled
                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.marketCapEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-white font-semibold text-base">Market Cap</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      criteria.marketCapEnabled
                        ? 'bg-purple-500/10 text-emerald-400 border border-purple-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {criteria.marketCapEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="mt-1 space-y-4">
                    {/* Min Market Cap */}
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-sm text-slate-400">Minimum</span>
                        <span className="text-white font-mono font-bold text-base">${criteria.minMarketCap.toFixed(0)}B</span>
                      </div>
                      <div className="relative px-2">
                        <div className="relative h-8 flex items-center">
                          <div
                            className="absolute left-0 right-0 h-3 rounded-full"
                            style={{
                              background: 'linear-gradient(to right, #8b5cf6, #d946ef)',
                              opacity: criteria.marketCapEnabled ? 0.4 : 0.2,
                            }}
                          />
                          <div
                            className="absolute"
                            style={{
                              left: `${(criteria.minMarketCap / 5000) * 100}%`,
                              transform: 'translateX(-50%)',
                              zIndex: 10,
                            }}
                          >
                            <div className={`w-5 h-5 rounded-full border-3 shadow-lg transition-all ${
                              criteria.marketCapEnabled ? 'bg-blue-500 border-white' : 'bg-slate-600 border-slate-400'
                            }`} />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="5000"
                          step="10"
                          value={criteria.minMarketCap}
                          onChange={(e) => setCriteria({ ...criteria, minMarketCap: parseFloat(e.target.value) })}
                          disabled={!criteria.marketCapEnabled}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          style={{ zIndex: 20 }}
                        />
                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                          <span>0</span>
                          <span>1250B</span>
                          <span>2500B</span>
                          <span>3750B</span>
                          <span>5T</span>
                        </div>
                      </div>
                    </div>

                    {/* Max Market Cap */}
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-sm text-slate-400">Maximum</span>
                        <span className="text-white font-mono font-bold text-base">${criteria.maxMarketCap.toFixed(0)}B</span>
                      </div>
                      <div className="relative px-2">
                        <div className="relative h-8 flex items-center">
                          <div
                            className="absolute left-0 right-0 h-3 rounded-full"
                            style={{
                              background: 'linear-gradient(to right, #8b5cf6, #d946ef)',
                              opacity: criteria.marketCapEnabled ? 0.4 : 0.2,
                            }}
                          />
                          <div
                            className="absolute"
                            style={{
                              left: `${(criteria.maxMarketCap / 5000) * 100}%`,
                              transform: 'translateX(-50%)',
                              zIndex: 10,
                            }}
                          >
                            <div className={`w-5 h-5 rounded-full border-3 shadow-lg transition-all ${
                              criteria.marketCapEnabled ? 'bg-blue-500 border-white' : 'bg-slate-600 border-slate-400'
                            }`} />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="5000"
                          step="10"
                          value={criteria.maxMarketCap}
                          onChange={(e) => setCriteria({ ...criteria, maxMarketCap: parseFloat(e.target.value) })}
                          disabled={!criteria.marketCapEnabled}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          style={{ zIndex: 20 }}
                        />
                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                          <span>0</span>
                          <span>1250B</span>
                          <span>2500B</span>
                          <span>3750B</span>
                          <span>5T</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Debt/Equity */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, debtToEquityEnabled: !criteria.debtToEquityEnabled })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.debtToEquityEnabled
                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.debtToEquityEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-white font-semibold text-base">Debt/Equity</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-mono font-bold text-base">{criteria.maxDebtToEquity.toFixed(0)}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        criteria.debtToEquityEnabled
                          ? 'bg-purple-500/10 text-emerald-400 border border-purple-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {criteria.debtToEquityEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-1">
                    <div className="relative px-2">
                      <div className="relative h-8 flex items-center">
                        <div
                          className="absolute left-0 right-0 h-3 rounded-full"
                          style={{
                            background: 'linear-gradient(to right, #10b981, #fbbf24, #ef4444)',
                            opacity: criteria.debtToEquityEnabled ? 0.4 : 0.2,
                          }}
                        />
                        <div
                          className="absolute"
                          style={{
                            left: `${(criteria.maxDebtToEquity / 200) * 100}%`,
                            transform: 'translateX(-50%)',
                            zIndex: 10,
                          }}
                        >
                          <div className={`w-5 h-5 rounded-full border-3 shadow-lg transition-all ${
                            criteria.debtToEquityEnabled ? 'bg-blue-500 border-white' : 'bg-slate-600 border-slate-400'
                          }`} />
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        step="1"
                        value={criteria.maxDebtToEquity}
                        onChange={(e) => setCriteria({ ...criteria, maxDebtToEquity: parseFloat(e.target.value) })}
                        disabled={!criteria.debtToEquityEnabled}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        style={{ zIndex: 20 }}
                      />
                      <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>0</span>
                        <span>50</span>
                        <span>100</span>
                        <span>150</span>
                        <span>200</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Beta */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, betaEnabled: !criteria.betaEnabled })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.betaEnabled
                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.betaEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-white font-semibold text-base">Beta</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      criteria.betaEnabled
                        ? 'bg-purple-500/10 text-emerald-400 border border-purple-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {criteria.betaEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="mt-1 space-y-4">
                    {/* Min Beta */}
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-sm text-slate-400">Minimum</span>
                        <span className="text-white font-mono font-bold text-base">{criteria.minBeta.toFixed(2)}</span>
                      </div>
                      <div className="relative px-2">
                        <div className="relative h-8 flex items-center">
                          <div
                            className="absolute left-0 right-0 h-3 rounded-full"
                            style={{
                              background: 'linear-gradient(to right, #10b981, #fbbf24, #ef4444)',
                              opacity: criteria.betaEnabled ? 0.4 : 0.2,
                            }}
                          />
                          <div
                            className="absolute"
                            style={{
                              left: `${(criteria.minBeta / 3) * 100}%`,
                              transform: 'translateX(-50%)',
                              zIndex: 10,
                            }}
                          >
                            <div className={`w-5 h-5 rounded-full border-3 shadow-lg transition-all ${
                              criteria.betaEnabled ? 'bg-blue-500 border-white' : 'bg-slate-600 border-slate-400'
                            }`} />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          step="0.05"
                          value={criteria.minBeta}
                          onChange={(e) => setCriteria({ ...criteria, minBeta: parseFloat(e.target.value) })}
                          disabled={!criteria.betaEnabled}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          style={{ zIndex: 20 }}
                        />
                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                          <span>0</span>
                          <span>0.75</span>
                          <span>1.5</span>
                          <span>2.25</span>
                          <span>3</span>
                        </div>
                      </div>
                    </div>

                    {/* Max Beta */}
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-sm text-slate-400">Maximum</span>
                        <span className="text-white font-mono font-bold text-base">{criteria.maxBeta.toFixed(2)}</span>
                      </div>
                      <div className="relative px-2">
                        <div className="relative h-8 flex items-center">
                          <div
                            className="absolute left-0 right-0 h-3 rounded-full"
                            style={{
                              background: 'linear-gradient(to right, #10b981, #fbbf24, #ef4444)',
                              opacity: criteria.betaEnabled ? 0.4 : 0.2,
                            }}
                          />
                          <div
                            className="absolute"
                            style={{
                              left: `${(criteria.maxBeta / 3) * 100}%`,
                              transform: 'translateX(-50%)',
                              zIndex: 10,
                            }}
                          >
                            <div className={`w-5 h-5 rounded-full border-3 shadow-lg transition-all ${
                              criteria.betaEnabled ? 'bg-blue-500 border-white' : 'bg-slate-600 border-slate-400'
                            }`} />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          step="0.05"
                          value={criteria.maxBeta}
                          onChange={(e) => setCriteria({ ...criteria, maxBeta: parseFloat(e.target.value) })}
                          disabled={!criteria.betaEnabled}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          style={{ zIndex: 20 }}
                        />
                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                          <span>0</span>
                          <span>0.75</span>
                          <span>1.5</span>
                          <span>2.25</span>
                          <span>3</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROE */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, roeEnabled: !criteria.roeEnabled })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.roeEnabled
                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.roeEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-white font-semibold text-base">ROE</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-mono font-bold text-base">{criteria.minROE.toFixed(1)}%</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        criteria.roeEnabled
                          ? 'bg-purple-500/10 text-emerald-400 border border-purple-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {criteria.roeEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-1">
                    <div className="relative px-2">
                      <div className="relative h-8 flex items-center">
                        <div
                          className="absolute left-0 right-0 h-3 rounded-full"
                          style={{
                            background: 'linear-gradient(to right, #ef4444, #fbbf24, #10b981)',
                            opacity: criteria.roeEnabled ? 0.4 : 0.2,
                          }}
                        />
                        <div
                          className="absolute"
                          style={{
                            left: `${(criteria.minROE / 100) * 100}%`,
                            transform: 'translateX(-50%)',
                            zIndex: 10,
                          }}
                        >
                          <div className={`w-5 h-5 rounded-full border-3 shadow-lg transition-all ${
                            criteria.roeEnabled ? 'bg-blue-500 border-white' : 'bg-slate-600 border-slate-400'
                          }`} />
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={criteria.minROE}
                        onChange={(e) => setCriteria({ ...criteria, minROE: parseFloat(e.target.value) })}
                        disabled={!criteria.roeEnabled}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        style={{ zIndex: 20 }}
                      />
                      <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Margin */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, profitMarginEnabled: !criteria.profitMarginEnabled })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.profitMarginEnabled
                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.profitMarginEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-white font-semibold text-base">Profit Margin</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-mono font-bold text-base">{criteria.minProfitMargin.toFixed(1)}%</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        criteria.profitMarginEnabled
                          ? 'bg-purple-500/10 text-emerald-400 border border-purple-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {criteria.profitMarginEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-1">
                    <div className="relative px-2">
                      <div className="relative h-8 flex items-center">
                        <div
                          className="absolute left-0 right-0 h-3 rounded-full"
                          style={{
                            background: 'linear-gradient(to right, #ef4444, #fbbf24, #10b981)',
                            opacity: criteria.profitMarginEnabled ? 0.4 : 0.2,
                          }}
                        />
                        <div
                          className="absolute"
                          style={{
                            left: `${(criteria.minProfitMargin / 100) * 100}%`,
                            transform: 'translateX(-50%)',
                            zIndex: 10,
                          }}
                        >
                          <div className={`w-5 h-5 rounded-full border-3 shadow-lg transition-all ${
                            criteria.profitMarginEnabled ? 'bg-blue-500 border-white' : 'bg-slate-600 border-slate-400'
                          }`} />
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={criteria.minProfitMargin}
                        onChange={(e) => setCriteria({ ...criteria, minProfitMargin: parseFloat(e.target.value) })}
                        disabled={!criteria.profitMarginEnabled}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        style={{ zIndex: 20 }}
                      />
                      <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Sentiment */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, sentimentEnabled: !criteria.sentimentEnabled })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.sentimentEnabled
                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.sentimentEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-white font-semibold text-base">Social Sentiment</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      criteria.sentimentEnabled
                        ? 'bg-purple-500/10 text-emerald-400 border border-purple-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {criteria.sentimentEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="mt-1 grid grid-cols-2 gap-3">
                    {(['all', 'positive', 'neutral', 'negative'] as const).map((sentiment) => (
                      <button
                        key={sentiment}
                        type="button"
                        onClick={() => setCriteria({ ...criteria, sentimentFilter: sentiment })}
                        disabled={!criteria.sentimentEnabled}
                        className={`px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm ${
                          criteria.sentimentFilter === sentiment
                            ? sentiment === 'positive'
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                              : sentiment === 'negative'
                              ? 'bg-red-500/20 border-red-500 text-red-400'
                              : sentiment === 'neutral'
                              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                              : 'bg-blue-500/20 border-blue-500 text-blue-400'
                            : 'bg-slate-800/30 border-slate-700 text-slate-400 hover:bg-slate-800/50'
                        } ${!criteria.sentimentEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {sentiment === 'all' ? '🔄 All' : sentiment === 'positive' ? '😊 Positive' : sentiment === 'neutral' ? '😐 Neutral' : '😞 Negative'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sector Exclusions */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-slate-700/50">
                <Ban className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">Sector Exclusions</h2>
              </div>
              <button
                type="button"
                onClick={() => setCriteria({ ...criteria, sectorsEnabled: !criteria.sectorsEnabled })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  criteria.sectorsEnabled
                    ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20'
                }`}
              >
                {criteria.sectorsEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Add New Sector */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <select
                  value={newSector}
                  onChange={(e) => setNewSector(e.target.value)}
                  disabled={!criteria.sectorsEnabled}
                  className={`flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
                    !criteria.sectorsEnabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">Select a sector to exclude...</option>
                  {COMMON_SECTORS.map((sector) => (
                    <option key={sector} value={sector} disabled={criteria.excludeSectors.includes(sector)}>
                      {sector}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addSector}
                  disabled={!criteria.sectorsEnabled || !newSector.trim()}
                  className={`px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 font-medium transition-colors flex items-center gap-2 ${
                    (!criteria.sectorsEnabled || !newSector.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Excluded Sectors List */}
            {criteria.excludeSectors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {criteria.excludeSectors.map((sector) => (
                  <div key={sector} className="bg-slate-950/50 border border-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-white text-sm font-medium">Sector: {sector}</span>
                    <button
                      type="button"
                      onClick={() => removeSector(sector)}
                      disabled={!criteria.sectorsEnabled}
                      className={`p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors ${
                        !criteria.sectorsEnabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Country Exclusions */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-b border-orange-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-slate-700/50">
                <Ban className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">Country Exclusions</h2>
              </div>
              <button
                type="button"
                onClick={() => setCriteria({ ...criteria, countriesEnabled: !criteria.countriesEnabled })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  criteria.countriesEnabled
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20'
                }`}
              >
                {criteria.countriesEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Add New Country */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <select
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  disabled={!criteria.countriesEnabled}
                  className={`flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                    !criteria.countriesEnabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">Select a country to exclude...</option>
                  {COMMON_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code} disabled={criteria.excludeCountries.includes(country.code)}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addCountry}
                  disabled={!criteria.countriesEnabled || !newCountry.trim()}
                  className={`px-4 py-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg text-orange-400 font-medium transition-colors flex items-center gap-2 ${
                    (!criteria.countriesEnabled || !newCountry.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Excluded Countries List */}
            {criteria.excludeCountries.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {criteria.excludeCountries.map((countryCode) => {
                  const country = COMMON_COUNTRIES.find(c => c.code === countryCode);
                  const displayName = country ? country.name : countryCode;
                  return (
                    <div key={countryCode} className="bg-slate-950/50 border border-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-orange-400" />
                      <span className="text-white text-sm font-medium">{displayName}</span>
                      <button
                        type="button"
                        onClick={() => removeCountry(countryCode)}
                        disabled={!criteria.countriesEnabled}
                        className={`p-1 hover:bg-orange-500/20 rounded text-orange-400 transition-colors ${
                          !criteria.countriesEnabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action Buttons - Sticky at bottom for easy access while scrolling */}
      <div className="sticky bottom-0 z-20 bg-slate-950/95 backdrop-blur-sm pt-4 mt-6 mb-24 border-t border-slate-800/50">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 rounded-lg text-white font-medium text-sm transition-all"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saveSuccess ? 'Saved!' : 'Save'}
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-lg text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            Apply
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </form>
  );
}
