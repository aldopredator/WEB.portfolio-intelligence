'use client';

import { useState, useEffect } from 'react';
import { Calculator, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SCORING_THEMES, createCustomTheme, type ScoringTheme } from '@/lib/scoring-config';
import { usePortfolio } from '@/lib/portfolio-context';
import * as XLSX from 'xlsx';

type ScoredStock = {
  ticker: string;
  company: string;
  sector: string | null;
  industry: string | null;
  country: string | null;
  portfolio: string;
  rating: number;
  currentPrice: number | null;
  marketCap: number | null;
  factorScores: {
    value: number | null;
    quality: number | null;
    growth: number | null;
    momentum: number | null;
    risk: number | null;
  };
  finalScore: number;
};

export default function ScoringClient() {
  const { selectedPortfolio, portfolios } = usePortfolio();
  const [selectedTheme, setSelectedTheme] = useState<ScoringTheme>(SCORING_THEMES[0]);
  const [customWeights, setCustomWeights] = useState(SCORING_THEMES[0].factors);
  const [scoredStocks, setScoredStocks] = useState<ScoredStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate scores whenever theme or weights change
  useEffect(() => {
    calculateScores();
  }, [selectedTheme, customWeights, selectedPortfolio]);
  
  const calculateScores = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/scoring/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId: selectedPortfolio?.id || 'all',
          themeFactors: selectedTheme.id === 'custom' ? customWeights : selectedTheme.factors,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate scores');
      }
      
      const data = await response.json();
      setScoredStocks(data.stocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleThemeChange = (themeId: string) => {
    const theme = SCORING_THEMES.find(t => t.id === themeId);
    if (theme) {
      setSelectedTheme(theme);
      setCustomWeights(theme.factors);
    }
  };
  
  const handleWeightChange = (factor: keyof ScoringTheme['factors'], value: number) => {
    const newWeights = { ...customWeights, [factor]: value };
    setCustomWeights(newWeights);
    setSelectedTheme(createCustomTheme(newWeights));
  };
  
  const exportToExcel = () => {
    const exportData = scoredStocks.map((stock, index) => ({
      'Rank': index + 1,
      'Ticker': stock.ticker,
      'Company': stock.company,
      'Portfolio': stock.portfolio,
      'Sector': stock.sector || 'N/A',
      'Industry': stock.industry || 'N/A',
      'Country': stock.country || 'N/A',
      'Rating': stock.rating,
      'Current Price': stock.currentPrice ? `$${stock.currentPrice.toFixed(2)}` : 'N/A',
      'Market Cap': stock.marketCap ? `$${(stock.marketCap / 1e9).toFixed(2)}B` : 'N/A',
      'Final Score': stock.finalScore.toFixed(3),
      'Value Score': stock.factorScores.value?.toFixed(3) || 'N/A',
      'Quality Score': stock.factorScores.quality?.toFixed(3) || 'N/A',
      'Growth Score': stock.factorScores.growth?.toFixed(3) || 'N/A',
      'Momentum Score': stock.factorScores.momentum?.toFixed(3) || 'N/A',
      'Risk Score': stock.factorScores.risk?.toFixed(3) || 'N/A',
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Scoring Results');
    
    const filename = `internal_scoring_${selectedTheme.name.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };
  
  const formatScore = (score: number | null) => {
    if (score === null) return 'N/A';
    return score.toFixed(2);
  };
  
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-500';
    if (score > 0.5) return 'text-green-400';
    if (score < -0.5) return 'text-red-400';
    return 'text-yellow-400';
  };
  
  const getScoreIcon = (score: number | null) => {
    if (score === null) return <Minus className="w-4 h-4" />;
    if (score > 0.5) return <TrendingUp className="w-4 h-4" />;
    if (score < -0.5) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };
  
  const totalWeight = Object.values(customWeights).reduce((sum, w) => sum + w, 0);
  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.01;
  
  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-400" />
          Select Scoring Theme
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {SCORING_THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedTheme.id === theme.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="text-3xl mb-2">{theme.emoji}</div>
              <div className="font-semibold text-white text-sm">{theme.name}</div>
              <div className="text-xs text-slate-400 mt-1">{theme.description}</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Weight Customization */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Factor Weights</h2>
          <div className={`text-sm ${isWeightValid ? 'text-green-400' : 'text-red-400'}`}>
            Total: {(totalWeight * 100).toFixed(0)}% {isWeightValid ? '✓' : '⚠️'}
          </div>
        </div>
        
        <div className="space-y-4">
          {(Object.keys(customWeights) as Array<keyof typeof customWeights>).map(factor => (
            <div key={factor} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300 capitalize">{factor}</label>
                <span className="text-sm text-slate-400">{(customWeights[factor] * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={customWeights[factor] * 100}
                onChange={(e) => handleWeightChange(factor, parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          ))}
        </div>
        
        {!isWeightValid && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
            ⚠️ Weights should sum to 100%. Adjust the sliders to balance your factor allocation.
          </div>
        )}
      </div>
      
      {/* Results Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Ranking Results</h2>
            <p className="text-sm text-slate-400 mt-1">
              {scoredStocks.length} stocks ranked by {selectedTheme.name} theme
            </p>
          </div>
          <button
            onClick={exportToExcel}
            disabled={scoredStocks.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Calculator className="w-12 h-12 mx-auto mb-4 animate-pulse" />
            <p>Calculating scores...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-400">
            <p>{error}</p>
          </div>
        ) : scoredStocks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p>No stocks found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Ticker</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Portfolio</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Final Score</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Value</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Quality</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Growth</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Momentum</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {scoredStocks.map((stock, index) => (
                  <tr key={stock.ticker} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-300">#{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-400">{stock.ticker}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{stock.company}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{stock.portfolio}</td>
                    <td className="px-4 py-3 text-center">
                      <div className={`flex items-center justify-center gap-1 font-semibold ${getScoreColor(stock.finalScore)}`}>
                        {getScoreIcon(stock.finalScore)}
                        {formatScore(stock.finalScore)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-400">{formatScore(stock.factorScores.value)}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-400">{formatScore(stock.factorScores.quality)}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-400">{formatScore(stock.factorScores.growth)}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-400">{formatScore(stock.factorScores.momentum)}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-400">{formatScore(stock.factorScores.risk)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
