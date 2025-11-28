
import { ShoppingCart, Pause, TrendingDown, CheckCircle } from 'lucide-react';
import type { StockInfo } from '@/lib/types';
import { calculateRecommendation } from '@/lib/stock-utils';

interface RecommendationCardProps {
  stock: StockInfo;
  ticker: string;
}

export function RecommendationCard({ stock, ticker }: RecommendationCardProps) {
  const targetPrice = stock?.analyst_recommendations?.target_price ?? 0;

  // If we don't have a real target price, we can't make a valid recommendation
  if (targetPrice <= 0) return null;

  const rec = calculateRecommendation(stock ?? {} as StockInfo);

  const config = {
    BUY: {
      icon: ShoppingCart,
      color: 'emerald',
      bgGradient: 'from-emerald-500/20 to-emerald-600/10',
      borderColor: 'border-emerald-500/50',
      textColor: 'text-emerald-400',
      iconColor: 'text-emerald-400'
    },
    HOLD: {
      icon: Pause,
      color: 'amber',
      bgGradient: 'from-amber-500/20 to-amber-600/10',
      borderColor: 'border-amber-500/50',
      textColor: 'text-amber-400',
      iconColor: 'text-amber-400'
    },
    SELL: {
      icon: TrendingDown,
      color: 'rose',
      bgGradient: 'from-rose-500/20 to-rose-600/10',
      borderColor: 'border-rose-500/50',
      textColor: 'text-rose-400',
      iconColor: 'text-rose-400'
    }
  };

  const actionConfig = config?.[rec?.action] ?? config.HOLD;
  const Icon = actionConfig?.icon ?? Pause;

  return (
    <div className={`bg-gradient-to-br ${actionConfig?.bgGradient ?? 'from-slate-500/20'} rounded-xl p-6 shadow-xl border-2 ${actionConfig?.borderColor ?? 'border-slate-700'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Daily Recommendation</h3>
          <p className="text-slate-400 text-sm">{ticker ?? 'Stock'} Investment Suggestion</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded border border-amber-500/30">Not Real-Time</span>
          <CheckCircle className="w-6 h-6 text-blue-400" />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className={`w-16 h-16 rounded-full bg-slate-800 border-2 ${actionConfig?.borderColor ?? 'border-slate-700'} flex items-center justify-center`}>
          <Icon className={`w-8 h-8 ${actionConfig?.iconColor ?? 'text-slate-400'}`} />
        </div>
        <div>
          <p className="text-slate-400 text-sm mb-1">Our Recommendation</p>
          <p className={`text-4xl font-bold ${actionConfig?.textColor ?? 'text-white'}`}>
            {rec?.action ?? 'HOLD'}
          </p>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
        <p className="text-slate-300 text-sm leading-relaxed">
          {rec?.reasoning ?? 'No recommendation available at this time.'}
        </p>
      </div>
    </div>
  );
}
