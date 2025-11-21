
'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import type { PriceMovement } from '@/lib/types';

interface PriceChartProps {
  data: PriceMovement[];
  ticker: string;
}

export function PriceChart({ data, ticker }: PriceChartProps) {
  const chartData = (data ?? [])?.map?.((item) => ({
    date: new Date(item?.Date ?? '')?.toLocaleDateString?.('en-US', { month: 'short', day: 'numeric' }) ?? '',
    price: item?.Close ?? 0,
  })) ?? [];

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-1">30-Day Price Movement</h3>
        <p className="text-slate-400 text-sm">{ticker ?? 'Stock'} Historical Performance</p>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`colorPrice${ticker ?? ''}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60B5FF" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#60B5FF" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              interval="preserveStartEnd"
              stroke="#334155"
            />
            <YAxis 
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value?.toFixed?.(0) ?? '0'}`}
              stroke="#334155"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: 11
              }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value: any) => [`$${value?.toFixed?.(2) ?? '0.00'}`, 'Price']}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#60B5FF" 
              strokeWidth={3}
              fill={`url(#colorPrice${ticker ?? ''})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
