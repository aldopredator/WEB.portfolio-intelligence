'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const STOCK_TICKERS = [
  { ticker: 'GOOG', change: -1.04 },
  { ticker: 'TSLA', change: 0.84 },
  { ticker: 'NVDA', change: -1.81 },
  { ticker: 'AMZN', change: -0.22 },
  { ticker: 'BRK-B', change: -0.22 },
  { ticker: 'ISRG', change: -0.60 },
  { ticker: 'NFLX', change: 1.36 },
  { ticker: 'IDXX', change: -1.45 },
  { ticker: 'III', change: 0.56 },
  { ticker: 'PLTR', change: 1.36 },
  { ticker: 'QBTS', change: -0.80 },
  { ticker: 'RGTI', change: 0.00 },
];

export function GlobalHeader() {
  const pathname = usePathname();
  const isDashboard = pathname === '/';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50 lg:left-72 lg:right-[540px]">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Portfolio Intelligence</h1>
            <p className="text-base text-blue-400 font-medium">Solutions</p>
          </div>
        </div>
        
        {/* Stock Tickers Row - Always visible */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {STOCK_TICKERS.map((stock) => (
            <Link
              key={stock.ticker}
              href={isDashboard ? `/?stock=${stock.ticker}` : `/`}
              className="flex-shrink-0 px-3 py-2 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 rounded-lg transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">{stock.ticker}</span>
                <span className={`text-xs font-semibold ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
