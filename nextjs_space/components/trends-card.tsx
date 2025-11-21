
import { Sparkles, TrendingUp } from 'lucide-react';

interface TrendsCardProps {
  trends: string[];
  ticker: string;
}

const trendIcons: Record<string, any> = {
  'AI Developments': '🤖',
  'Earnings Reports': '📊',
  'Regulatory Issues': '⚖️',
  'Market Volatility': '📈',
  'Innovation': '💡',
};

export function TrendsCard({ trends, ticker }: TrendsCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Emerging Trends</h3>
          <p className="text-slate-400 text-sm">Key factors affecting {ticker ?? 'stock'}</p>
        </div>
        <Sparkles className="w-6 h-6 text-purple-400" />
      </div>

      <div className="space-y-3">
        {(trends ?? [])?.length > 0 ? (
          trends?.map?.((trend, index) => (
            <div 
              key={index}
              className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-purple-500/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{trendIcons?.[trend] ?? '🔍'}</span>
                <div>
                  <p className="text-white font-semibold">{trend ?? 'Unknown Trend'}</p>
                  <p className="text-slate-400 text-sm">Impacting market dynamics</p>
                </div>
              </div>
            </div>
          )) ?? null
        ) : (
          <div className="text-center py-8 text-slate-400">
            No emerging trends data available
          </div>
        )}
      </div>
    </div>
  );
}
