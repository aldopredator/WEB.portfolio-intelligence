'use client';

import { useState, useEffect } from 'react';
import { usePortfolio } from '@/lib/portfolio-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { THEME_PRESETS, type ThemePreset, type FactorWeights } from '@/lib/scoring-utils';
import { Download, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ScoredStock {
  ticker: string;
  company: string;
  portfolio: string;
  rating: number | null;
  sector: string;
  industry: string;
  country: string;
  finalScore: number;
  valueScore: number;
  qualityScore: number;
  growthScore: number;
  momentumScore: number;
  riskScore: number;
  pe?: number;
  pb?: number;
  ps?: number;
  roe?: number;
  roa?: number;
  profitMargin?: number;
  revenueGrowth?: number;
  return30d?: number;
  return60d?: number;
  beta?: number;
  marketCap?: string;
}

export default function InternalScoringPage() {
  const { selectedPortfolio } = usePortfolio();
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>('all-weather');
  const [weights, setWeights] = useState<FactorWeights>(THEME_PRESETS['all-weather'].weights);
  const [scoredStocks, setScoredStocks] = useState<ScoredStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof ScoredStock>('finalScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Update weights when theme changes
  useEffect(() => {
    if (selectedTheme !== 'custom') {
      setWeights(THEME_PRESETS[selectedTheme].weights);
    }
  }, [selectedTheme]);

  // Calculate scores when weights or portfolio changes
  useEffect(() => {
    calculateScores();
  }, [weights, selectedPortfolio]);

  const calculateScores = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/internal-scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId: selectedPortfolio || 'all',
          weights,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setScoredStocks(data.stocks);
      }
    } catch (error) {
      console.error('Failed to calculate scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (factor: keyof FactorWeights, value: number[]) => {
    setSelectedTheme('custom');
    setWeights(prev => ({ ...prev, [factor]: value[0] / 100 }));
  };

  const normalizeWeights = () => {
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (total === 0) return;
    
    const normalized = Object.fromEntries(
      Object.entries(weights).map(([key, value]) => [key, value / total])
    ) as FactorWeights;
    
    setWeights(normalized);
  };

  const handleSort = (column: keyof ScoredStock) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedStocks = [...scoredStocks].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    return sortDirection === 'asc' 
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const exportToExcel = () => {
    const exportData = sortedStocks.map(stock => ({
      Ticker: stock.ticker,
      Company: stock.company,
      Portfolio: stock.portfolio,
      'Final Score': stock.finalScore.toFixed(3),
      'Value Score': stock.valueScore.toFixed(3),
      'Quality Score': stock.qualityScore.toFixed(3),
      'Growth Score': stock.growthScore.toFixed(3),
      'Momentum Score': stock.momentumScore.toFixed(3),
      'Risk Score': stock.riskScore.toFixed(3),
      Sector: stock.sector,
      Industry: stock.industry,
      Country: stock.country,
      'P/E': stock.pe?.toFixed(2) || 'N/A',
      'P/B': stock.pb?.toFixed(2) || 'N/A',
      'P/S': stock.ps?.toFixed(2) || 'N/A',
      'ROE': stock.roe ? `${(stock.roe * 100).toFixed(2)}%` : 'N/A',
      'ROA': stock.roa ? `${(stock.roa * 100).toFixed(2)}%` : 'N/A',
      'Profit Margin': stock.profitMargin ? `${(stock.profitMargin * 100).toFixed(2)}%` : 'N/A',
      'Revenue Growth': stock.revenueGrowth ? `${(stock.revenueGrowth * 100).toFixed(2)}%` : 'N/A',
      '30d Return': stock.return30d ? `${(stock.return30d * 100).toFixed(2)}%` : 'N/A',
      '60d Return': stock.return60d ? `${(stock.return60d * 100).toFixed(2)}%` : 'N/A',
      Beta: stock.beta?.toFixed(2) || 'N/A',
      'Market Cap': stock.marketCap || 'N/A',
      Rating: stock.rating || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Internal Scoring');
    
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    XLSX.writeFile(wb, `internal_scoring_${date}.xlsx`);
  };

  const formatPercent = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatNumber = (value: number | undefined, decimals = 2) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(decimals);
  };

  const getScoreColor = (score: number) => {
    if (score > 1) return 'text-green-400';
    if (score > 0) return 'text-blue-400';
    if (score > -1) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Scoring"
        description="Multi-factor quantitative scoring model to rank stocks from highest to lowest priority"
      />

      {/* Theme Selection & Weight Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Scoring Theme</CardTitle>
            <CardDescription className="text-slate-400">
              Select a preset or customize factor weights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">Theme Preset</Label>
              <Select value={selectedTheme} onValueChange={(v) => setSelectedTheme(v as ThemePreset)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {Object.entries(THEME_PRESETS).map(([key, theme]) => (
                    <SelectItem key={key} value={key} className="text-slate-100">
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400 mt-1">
                {THEME_PRESETS[selectedTheme].description}
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              {Object.entries(weights).map(([factor, weight]) => (
                <div key={factor} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-slate-300 capitalize">{factor}</Label>
                    <span className="text-sm text-slate-400">{(weight * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[weight * 100]}
                    onValueChange={(v) => handleWeightChange(factor as keyof FactorWeights, v)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={normalizeWeights}
                variant="outline"
                size="sm"
                className="flex-1 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                Normalize
              </Button>
              <Button
                onClick={calculateScores}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Recalculate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Weight Summary */}
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-slate-100">Scoring Results</CardTitle>
                <CardDescription className="text-slate-400">
                  {sortedStocks.length} stocks ranked by {THEME_PRESETS[selectedTheme].name} model
                </CardDescription>
              </div>
              <Button
                onClick={exportToExcel}
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                disabled={sortedStocks.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(weights).map(([factor, weight]) => (
                <div key={factor} className="text-center p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 capitalize mb-1">{factor}</div>
                  <div className="text-lg font-semibold text-slate-100">{(weight * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium cursor-pointer hover:bg-slate-750" onClick={() => handleSort('ticker')}>
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium cursor-pointer hover:bg-slate-750" onClick={() => handleSort('ticker')}>
                    Ticker
                  </th>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium cursor-pointer hover:bg-slate-750" onClick={() => handleSort('company')}>
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium cursor-pointer hover:bg-slate-750" onClick={() => handleSort('finalScore')}>
                    Final Score
                  </th>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium cursor-pointer hover:bg-slate-750" onClick={() => handleSort('valueScore')}>
                    Value
                  </th>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium cursor-pointer hover:bg-slate-750" onClick={() => handleSort('qualityScore')}>
                    Quality
                  </th>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium cursor-pointer hover:bg-slate-750" onClick={() => handleSort('growthScore')}>
                    Growth
                  </th>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium cursor-pointer hover:bg-slate-750" onClick={() => handleSort('momentumScore')}>
                    Momentum
                  </th>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium cursor-pointer hover:bg-slate-750" onClick={() => handleSort('riskScore')}>
                    Risk
                  </th>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium cursor-pointer hover:bg-slate-750" onClick={() => handleSort('sector')}>
                    Sector
                  </th>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium cursor-pointer hover:bg-slate-750" onClick={() => handleSort('portfolio')}>
                    Portfolio
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Calculating scores...
                    </td>
                  </tr>
                ) : sortedStocks.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                      No stocks available for scoring
                    </td>
                  </tr>
                ) : (
                  sortedStocks.map((stock, index) => (
                    <tr key={stock.ticker} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-slate-400">
                        #{index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-100">
                        {stock.ticker}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {stock.company}
                      </td>
                      <td className={`px-4 py-3 font-semibold ${getScoreColor(stock.finalScore)}`}>
                        {stock.finalScore.toFixed(3)}
                      </td>
                      <td className={`px-4 py-3 ${getScoreColor(stock.valueScore)}`}>
                        {stock.valueScore.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 ${getScoreColor(stock.qualityScore)}`}>
                        {stock.qualityScore.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 ${getScoreColor(stock.growthScore)}`}>
                        {stock.growthScore.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 ${getScoreColor(stock.momentumScore)}`}>
                        {stock.momentumScore.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 ${getScoreColor(stock.riskScore)}`}>
                        {stock.riskScore.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {stock.sector}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {stock.portfolio}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
