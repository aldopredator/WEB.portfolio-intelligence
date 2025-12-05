'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { usePortfolio } from '@/lib/portfolio-context';
import { Search, Package } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface Stock {
  ticker: string;
  change_percent?: number;
}

function GlobalHeaderContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDashboard = pathname === '/' || pathname === '/dashboard';
  const { selectedPortfolio, portfolios } = usePortfolio();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch stocks based on selected portfolio
  useEffect(() => {
    const fetchStocks = async () => {
      setLoading(true);
      try {
        const portfolioId = selectedPortfolio?.id || searchParams.get('portfolio');
        console.log('[GlobalHeader] Fetching stocks for portfolio:', portfolioId || 'ALL');
        const response = await fetch(`/api/stock-list${portfolioId ? `?portfolio=${portfolioId}` : ''}`);
        const data = await response.json();
        console.log('[GlobalHeader] API response:', data);
        if (data.success && data.stocks) {
          console.log('[GlobalHeader] Setting stocks:', data.stocks.length);
          setStocks(data.stocks);
        } else {
          console.warn('[GlobalHeader] No stocks in response or failed:', data);
          setStocks([]);
        }
      } catch (error) {
        console.error('[GlobalHeader] Error fetching stocks:', error);
        setStocks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStocks();
  }, [searchParams, selectedPortfolio]);

  const handlePortfolioChange = (value: string) => {
    if (value === 'all') {
      router.push('/');
    } else {
      router.push(`/?portfolio=${value}`);
    }
  };

  const filteredStocks = stocks.filter(stock => 
    searchQuery === '' || 
    stock.ticker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50 lg:left-72 lg:right-[540px]">
      <div className="w-full px-4 py-4">
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

        {/* Portfolio Filter and Search */}
        <div className="hidden flex gap-3 mb-3">
          <Select
            value={selectedPortfolio?.id || 'all'}
            onValueChange={handlePortfolioChange}
          >
            <SelectTrigger className="w-[200px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-400" />
                  <span>{selectedPortfolio?.name || 'All Portfolios'}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  All Portfolios
                </div>
              </SelectItem>
              {portfolios.map((portfolio) => (
                <SelectItem key={portfolio.id} value={portfolio.id}>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {portfolio.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search tickers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>
        </div>
        
        {/* Stock Tickers Row - Dynamically filtered */}
        <div className="hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {loading ? (
            <div className="text-slate-400 text-sm">Loading...</div>
          ) : filteredStocks.length === 0 ? (
            <div className="text-slate-400 text-sm">No tickers found</div>
          ) : (
            filteredStocks.map((stock) => (
              <Link
                key={stock.ticker}
                href={isDashboard ? `/?stock=${stock.ticker}${searchParams.get('portfolio') ? `&portfolio=${searchParams.get('portfolio')}` : ''}` : `/`}
                className="flex-shrink-0 px-3 py-2 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 rounded-lg transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm">{stock.ticker}</span>
                  {stock.change_percent !== undefined && (
                    <span className={`text-xs font-semibold ${stock.change_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </header>
  );
}

export function GlobalHeader() {
  return (
    <Suspense fallback={
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50 lg:left-72 lg:right-[540px]">
        <div className="w-full px-4 py-4">
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
          <div className="text-slate-400 text-sm">Loading...</div>
        </div>
      </header>
    }>
      <GlobalHeaderContent />
    </Suspense>
  );
}
