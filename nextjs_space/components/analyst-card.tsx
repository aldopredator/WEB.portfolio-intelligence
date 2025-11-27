
'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, TrendingUp } from 'lucide-react';
import type { AnalystData } from '@/lib/types';
import { formatPrice } from '@/lib/stock-utils';

interface AnalystCardProps {
  data: AnalystData;
  currentPrice: number;
}

export function AnalystCard({ data, currentPrice }: AnalystCardProps) {
  const latestRec = data?.recommendations?.[0];
  
  const chartData = [
    { name: 'Strong Buy', value: latestRec?.strongBuy ?? 0, color: '#10b981' },
    { name: 'Buy', value: latestRec?.buy ?? 0, color: '#34d399' },
    { name: 'Hold', value: latestRec?.hold ?? 0, color: '#f59e0b' },
    { name: 'Sell', value: latestRec?.sell ?? 0, color: '#f87171' },
    { name: 'Strong Sell', value: latestRec?.strongSell ?? 0, color: '#ef4444' },
  ]?.filter?.((item) => (item?.value ?? 0) > 0) ?? [];

  const upside = currentPrice > 0 && data?.target_price 
    ? (((data?.target_price ?? 0) - currentPrice) / currentPrice) * 100 
    : 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Analyst Recommendations</h3>
          <p className="text-slate-400 text-sm">Professional analyst ratings</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded border border-amber-500/30">Not Real-Time</span>
          <Target className="w-6 h-6 text-blue-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Consensus</p>
          <p className="text-emerald-400 font-bold text-lg capitalize">
            {data?.consensus?.replace?.('_', ' ') ?? 'N/A'}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Price Target</p>
          <p className="text-white font-bold text-lg">
            {formatPrice(data?.target_price ?? 0)}
          </p>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Upside Potential</p>
            <p className={`font-bold text-2xl ${upside > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {upside?.toFixed?.(1) ?? '0.0'}%
            </p>
          </div>
          <TrendingUp className={`w-8 h-8 ${upside > 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
          >
            <XAxis 
              dataKey="name" 
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              angle={-45}
              textAnchor="end"
              height={60}
              stroke="#334155"
            />
            <YAxis 
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              stroke="#334155"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: 11
              }}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData?.map?.((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry?.color ?? '#60B5FF'} />
              )) ?? null}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
