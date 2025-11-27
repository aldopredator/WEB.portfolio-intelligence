
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Heart, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import type { SocialSentiment } from '@/lib/types';
import { getOverallSentiment } from '@/lib/stock-utils';

interface SentimentCardProps {
  sentiment: SocialSentiment;
  ticker: string;
}

export function SentimentCard({ sentiment, ticker }: SentimentCardProps) {
  const chartData = [
    { name: 'Positive', value: sentiment?.positive ?? 0, color: '#10b981' },
    { name: 'Neutral', value: sentiment?.neutral ?? 0, color: '#f59e0b' },
    { name: 'Negative', value: sentiment?.negative ?? 0, color: '#ef4444' },
  ];

  const overall = getOverallSentiment(sentiment ?? { positive: 0, neutral: 0, negative: 0 });

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Social Sentiment</h3>
          <p className="text-slate-400 text-sm">Community mood analysis</p>
        </div>
        <Heart className="w-6 h-6 text-pink-400" />
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700">
        <p className="text-slate-400 text-sm mb-2">Overall Sentiment</p>
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: overall?.color ?? '#6b7280' }}
          />
          <p className="text-white font-bold text-2xl">{overall?.label ?? 'Unknown'}</p>
        </div>
      </div>

      <div className="h-[240px] w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData?.map?.((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry?.color ?? '#6b7280'} />
              )) ?? null}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: 11
              }}
              formatter={(value: any) => `${value?.toFixed?.(1) ?? '0'}%`}
            />
            <Legend 
              verticalAlign="top"
              align="center"
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/30">
          <ThumbsUp className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-emerald-400 font-bold text-lg">
            {sentiment?.positive?.toFixed?.(0) ?? '0'}%
          </p>
          <p className="text-slate-400 text-xs">Positive</p>
        </div>
        <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
          <Minus className="w-5 h-5 text-amber-400 mb-2" />
          <p className="text-amber-400 font-bold text-lg">
            {sentiment?.neutral?.toFixed?.(0) ?? '0'}%
          </p>
          <p className="text-slate-400 text-xs">Neutral</p>
        </div>
        <div className="bg-rose-500/10 rounded-lg p-3 border border-rose-500/30">
          <ThumbsDown className="w-5 h-5 text-rose-400 mb-2" />
          <p className="text-rose-400 font-bold text-lg">
            {sentiment?.negative?.toFixed?.(0) ?? '0'}%
          </p>
          <p className="text-slate-400 text-xs">Negative</p>
        </div>
      </div>
    </div>
  );
}
