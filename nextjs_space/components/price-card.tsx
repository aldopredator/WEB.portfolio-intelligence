
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { StockData } from '@/lib/types';
import { formatPrice, formatPercent } from '@/lib/stock-utils';

interface PriceCardProps {
  stock: StockData;
}

export function PriceCard({ stock }: PriceCardProps) {
  const isPositive = (stock?.change ?? 0) >= 0;
  
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-3xl font-bold text-white mb-1">
            {stock?.ticker ?? 'N/A'}
          </h3>
          <p className="text-slate-400 text-sm">Current Price</p>
        </div>
        {isPositive ? (
          <TrendingUp className="w-8 h-8 text-emerald-500" />
        ) : (
          <TrendingDown className="w-8 h-8 text-rose-500" />
        )}
      </div>
      
      <div className="mb-6">
        <div className="text-5xl font-bold text-white mb-2">
          {formatPrice(stock?.current_price ?? 0)}
        </div>
        <div className={`text-xl font-semibold flex items-center gap-2 ${
          isPositive ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          <span>{formatPrice(stock?.change ?? 0)}</span>
          <span>({formatPercent(stock?.change_percent ?? 0)})</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
        <div>
          <p className="text-slate-400 text-sm mb-1">52-Week High</p>
          <p className="text-white font-semibold text-lg">
            {formatPrice(stock?.['52_week_high'] ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-sm mb-1">52-Week Low</p>
          <p className="text-white font-semibold text-lg">
            {formatPrice(stock?.['52_week_low'] ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
