'use client';

import { RefreshCw } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  lastUpdated?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, lastUpdated, action }: PageHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-slate-900/50 to-slate-900/30 border-b border-slate-800/50 backdrop-blur-sm">
      <div className="px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
            <p className="text-slate-400">{description}</p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50">
                <RefreshCw className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Last Updated</p>
                  <p className="text-white text-sm font-semibold whitespace-nowrap">{lastUpdated}</p>
                </div>
              </div>
            )}
            {action}
          </div>
        </div>
      </div>
    </div>
  );
}
