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

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Market Cap</p>
          <p className="text-white font-bold text-lg">{formatMarketCap(stock?.market_cap ?? data?.analyst_recommendations?.price_target ?? 0, stock?.currency ?? '$')}</p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Volume</p>
          <p className="text-white font-bold text-lg">{formatLargeNumber(stock?.volume ?? 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Previous Close</p>
          <p className="text-white font-semibold text-lg">{formatPrice(stock?.previous_close ?? 0)}</p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Currency</p>
          <p className="text-white font-semibold text-lg">{stock?.currency ?? 'USD'}</p>
        </div>
      </div>
    </div>
  );
}
