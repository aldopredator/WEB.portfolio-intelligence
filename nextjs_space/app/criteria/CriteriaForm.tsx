'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, DollarSign, Ban, ArrowRight, Plus, Trash2, Save } from 'lucide-react';
import { DEFAULT_CRITERIA, buildCriteriaURL, type ScreeningCriteria } from '@/lib/screening-criteria';

const STORAGE_KEY = 'portfolio_screening_criteria';

export default function CriteriaForm() {
  const router = useRouter();
  const [criteria, setCriteria] = useState<ScreeningCriteria>(DEFAULT_CRITERIA);
  const [newSector, setNewSector] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load saved criteria from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCriteria(parsed);
      } catch (e) {
        console.error('Failed to parse saved criteria:', e);
      }
    }
  }, []);

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
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, peEnabled: !criteria.peEnabled })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.peEnabled
                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.peEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg">P/E Ratio</h3>
                      <p className="text-slate-400 text-sm mt-1">Ensures reasonable valuation relative to earnings</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      criteria.peEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {criteria.peEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  {/* Spectrum Slider for P/E */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Maximum P/E Ratio</span>
                      <span className="text-white font-mono font-bold text-lg">{criteria.maxPE.toFixed(1)}</span>
                    </div>
                    
                    <div className="relative px-2">
                      {/* Spectrum Track */}
                      <div className="relative h-12 flex items-center">
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
                            left: `${(criteria.maxPE / 50) * 100}%`,
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
                        max="50"
                        step="0.5"
                        value={criteria.maxPE}
                        onChange={(e) => setCriteria({ ...criteria, maxPE: parseFloat(e.target.value) })}
                        disabled={!criteria.peEnabled}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        style={{ zIndex: 20 }}
                      />
                      
                      {/* Scale markers */}
                      <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>5</span>
                        <span>15</span>
                        <span>25</span>
                        <span>35</span>
                        <span>50</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* P/B Ratio */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, pbEnabled: !criteria.pbEnabled })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.pbEnabled
                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.pbEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg">P/B Ratio</h3>
                      <p className="text-slate-400 text-sm mt-1">Fair value relative to company assets</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      criteria.pbEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {criteria.pbEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  {/* Spectrum Slider for P/B */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Maximum P/B Ratio</span>
                      <span className="text-white font-mono font-bold text-lg">{criteria.maxPB.toFixed(1)}</span>
                    </div>
                    
                    <div className="relative px-2">
                      {/* Spectrum Track */}
                      <div className="relative h-12 flex items-center">
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
                            left: `${(criteria.maxPB / 10) * 100}%`,
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
                        max="10"
                        step="0.1"
                        value={criteria.maxPB}
                        onChange={(e) => setCriteria({ ...criteria, maxPB: parseFloat(e.target.value) })}
                        disabled={!criteria.pbEnabled}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        style={{ zIndex: 20 }}
                      />
                      
                      {/* Scale markers */}
                      <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>0.5</span>
                        <span>2.5</span>
                        <span>5</span>
                        <span>7.5</span>
                        <span>10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Financial Metrics */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-purple-500/30 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-slate-700/50">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Additional Financial Metrics</h2>
                <p className="text-slate-300 text-sm mt-1">Growth, risk, and profitability indicators</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Market Cap */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, marketCapEnabled: !criteria.marketCapEnabled })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.marketCapEnabled
                        ? 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.marketCapEnabled ? 'text-purple-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg">Market Cap</h3>
                      <p className="text-slate-400 text-sm mt-1">Company size and market value range</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      criteria.marketCapEnabled
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {criteria.marketCapEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="mt-4 space-y-4">
                    {/* Min Market Cap */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">Minimum Market Cap (B)</span>
                        <span className="text-white font-mono font-bold text-lg">${criteria.minMarketCap.toFixed(0)}B</span>
                      </div>
                      <div className="relative px-2">
                        <div className="relative h-12 flex items-center">
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
                              criteria.marketCapEnabled ? 'bg-purple-500 border-white' : 'bg-slate-600 border-slate-400'
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
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">Maximum Market Cap (B)</span>
                        <span className="text-white font-mono font-bold text-lg">${criteria.maxMarketCap.toFixed(0)}B</span>
                      </div>
                      <div className="relative px-2">
                        <div className="relative h-12 flex items-center">
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
                              criteria.marketCapEnabled ? 'bg-purple-500 border-white' : 'bg-slate-600 border-slate-400'
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

            {/* Beta */}
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, betaEnabled: !criteria.betaEnabled })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.betaEnabled
                        ? 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.betaEnabled ? 'text-purple-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg">Beta</h3>
                      <p className="text-slate-400 text-sm mt-1">Stock volatility relative to market (lower = less risky)</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      criteria.betaEnabled
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {criteria.betaEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Beta Range: {criteria.minBeta.toFixed(2)} - {criteria.maxBeta.toFixed(2)}</span>
                    </div>
                    
                    {/* Min Beta */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">Minimum Beta</span>
                        <span className="text-white font-mono font-bold text-lg">{criteria.minBeta.toFixed(2)}</span>
                      </div>
                      <div className="relative px-2">
                        <div className="relative h-12 flex items-center">
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
                              criteria.betaEnabled ? 'bg-purple-500 border-white' : 'bg-slate-600 border-slate-400'
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
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">Maximum Beta</span>
                        <span className="text-white font-mono font-bold text-lg">{criteria.maxBeta.toFixed(2)}</span>
                      </div>
                      <div className="relative px-2">
                        <div className="relative h-12 flex items-center">
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
                              criteria.betaEnabled ? 'bg-purple-500 border-white' : 'bg-slate-600 border-slate-400'
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
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, roeEnabled: !criteria.roeEnabled })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.roeEnabled
                        ? 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.roeEnabled ? 'text-purple-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg">ROE (Return on Equity)</h3>
                      <p className="text-slate-400 text-sm mt-1">Profitability efficiency - higher is better</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      criteria.roeEnabled
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {criteria.roeEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Minimum ROE (%)</span>
                      <span className="text-white font-mono font-bold text-lg">{criteria.minROE.toFixed(1)}%</span>
                    </div>
                    <div className="relative px-2">
                      <div className="relative h-12 flex items-center">
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
                            criteria.roeEnabled ? 'bg-purple-500 border-white' : 'bg-slate-600 border-slate-400'
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
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, profitMarginEnabled: !criteria.profitMarginEnabled })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.profitMarginEnabled
                        ? 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.profitMarginEnabled ? 'text-purple-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg">Profit Margin</h3>
                      <p className="text-slate-400 text-sm mt-1">Percentage of revenue kept as profit</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      criteria.profitMarginEnabled
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {criteria.profitMarginEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Minimum Profit Margin (%)</span>
                      <span className="text-white font-mono font-bold text-lg">{criteria.minProfitMargin.toFixed(1)}%</span>
                    </div>
                    <div className="relative px-2">
                      <div className="relative h-12 flex items-center">
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
                            criteria.profitMarginEnabled ? 'bg-purple-500 border-white' : 'bg-slate-600 border-slate-400'
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
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <button
                    type="button"
                    onClick={() => setCriteria({ ...criteria, sentimentEnabled: !criteria.sentimentEnabled })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                      criteria.sentimentEnabled
                        ? 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${criteria.sentimentEnabled ? 'text-purple-400' : 'text-slate-600'}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg">Social Sentiment</h3>
                      <p className="text-slate-400 text-sm mt-1">Filter by news and social media sentiment</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      criteria.sentimentEnabled
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {criteria.sentimentEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-3">
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
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/30 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-slate-700/50">
                <Ban className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">Sector Exclusions</h2>
                <p className="text-slate-300 text-sm mt-1">Industries excluded from investment consideration</p>
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
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newSector}
                  onChange={(e) => setNewSector(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSector())}
                  placeholder="Enter sector name (e.g., Tobacco, Weapons)"
                  disabled={!criteria.sectorsEnabled}
                  className={`flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
                    !criteria.sectorsEnabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
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
              criteria.excludeSectors.map((sector) => (
                <div key={sector} className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20">
                        <XCircle className="w-5 h-5 text-red-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">Sector: {sector}</h3>
                      <p className="text-slate-400 text-sm mt-1">Excluded from screening results</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSector(sector)}
                      disabled={!criteria.sectorsEnabled}
                      className={`p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-colors ${
                        !criteria.sectorsEnabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-5 text-center">
                <p className="text-slate-400 text-sm">No sectors excluded. Add sectors above to filter them out.</p>
              </div>
            )}
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
          type="button"
          onClick={handleSave}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saveSuccess ? 'Saved!' : 'Save Criteria'}
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
