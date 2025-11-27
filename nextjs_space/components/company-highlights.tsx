import { Sparkles } from 'lucide-react';
import type { StockInfo } from '@/lib/types';
import { formatPrice, formatLargeNumber, formatMarketCap } from '@/lib/stock-utils';

interface CompanyHighlightsProps {
  data: StockInfo;
  ticker: string;
}

export function CompanyHighlights({ data, ticker }: CompanyHighlightsProps) {
  const stock = data?.stock_data ?? {};

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Company Highlights</h3>
          <p className="text-slate-400 text-sm">Key live company metrics</p>
        </div>
        <Sparkles className="w-6 h-6 text-blue-400" />
      </div>

      {/* Market Data Section */}
      <div className="mb-6">
        <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Market Data</h4>
        <div className="grid grid-cols-2 gap-4">
          {stock?.market_cap ? (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm mb-1">Market Cap</p>
              <p className="text-white font-bold text-lg">{formatMarketCap(stock.market_cap, stock?.currency ?? '$')}</p>
            </div>
          ) : null}

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">Volume</p>
            <p className="text-white font-bold text-lg">{formatLargeNumber(stock?.volume ?? 0)}</p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">Currency</p>
            <p className="text-white font-semibold text-lg">{stock?.currency ?? 'USD'}</p>
          </div>
        </div>
      </div>

      {/* Valuation Metrics Section */}
      {(stock?.pe_ratio || stock?.pb_ratio || stock?.dividend_yield) ? (
        <div className="mb-6">
          <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Valuation</h4>
          <div className="grid grid-cols-2 gap-4">
            {stock?.pe_ratio ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">P/E Ratio</p>
                <p className="text-white font-bold text-lg">{stock.pe_ratio.toFixed(2)}</p>
              </div>
            ) : null}

            {stock?.pb_ratio ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">P/B Ratio</p>
                <p className="text-white font-bold text-lg">{stock.pb_ratio.toFixed(2)}</p>
              </div>
            ) : null}

            {stock?.dividend_yield ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Dividend Yield</p>
                <p className="text-white font-bold text-lg">{stock.dividend_yield.toFixed(2)}%</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Profitability Metrics Section */}
      {(stock?.roe || stock?.debt_to_equity) ? (
        <div>
          <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Profitability</h4>
          <div className="grid grid-cols-2 gap-4">
            {stock?.roe ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">ROE</p>
                <p className="text-white font-bold text-lg">{stock.roe.toFixed(2)}%</p>
              </div>
            ) : null}

            {stock?.debt_to_equity ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Debt-to-Equity</p>
                <p className="text-white font-bold text-lg">{stock.debt_to_equity.toFixed(2)}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
