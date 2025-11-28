import { Sparkles } from 'lucide-react';
import type { StockInfo } from '@/lib/types';
import { formatPrice, formatLargeNumber, formatMarketCap } from '@/lib/stock-utils';

interface CompanyHighlightsProps {
  data: StockInfo;
  ticker: string;
}

export function CompanyHighlights({ data, ticker }: CompanyHighlightsProps) {
  const stock = data?.stock_data ?? {};

  // Debug: log what data we have
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${ticker}] stock data:`, stock);
  }

  const hasMarketData = stock?.market_cap || stock?.volume || stock?.beta;
  const hasValuation = stock?.pe_ratio || stock?.pb_ratio || stock?.ps_ratio || stock?.pcf_ratio;
  const hasProfitability = stock?.roe || stock?.roa || stock?.roi || stock?.gross_margin || stock?.operating_margin || stock?.profit_margin;
  const hasFinancialHealth = stock?.debt_to_equity || stock?.current_ratio || stock?.quick_ratio;
  const hasGrowth = stock?.revenue_growth || stock?.earnings_growth;
  const hasDividend = stock?.dividend_yield || stock?.payout_ratio;
  const hasPerShare = stock?.eps || stock?.book_value_per_share;

  // If no data at all, don't show the card
  if (!hasMarketData && !hasValuation && !hasProfitability && !hasFinancialHealth && !hasGrowth && !hasDividend && !hasPerShare) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Financial Metrics</h3>
          <p className="text-slate-400 text-sm">Key company fundamentals</p>
        </div>
        <Sparkles className="w-6 h-6 text-blue-400" />
      </div>

      {/* Market Data Section */}
      {hasMarketData && (
        <div className="mb-6">
          <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Market Data</h4>
          <div className="grid grid-cols-2 gap-4">
            {stock?.market_cap ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Market Cap</p>
                <p className="text-white font-bold text-lg">{formatMarketCap(stock.market_cap, stock?.currency ?? '$')}</p>
              </div>
            ) : null}

            {stock?.volume ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Volume</p>
                <p className="text-white font-bold text-lg">{formatLargeNumber(stock.volume)}</p>
              </div>
            ) : null}

            {stock?.beta ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Beta</p>
                <p className="text-white font-bold text-lg">{stock.beta.toFixed(2)}</p>
              </div>
            ) : null}

            {stock?.currency ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Currency</p>
                <p className="text-white font-semibold text-lg">{stock.currency}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Valuation Metrics Section */}
      {hasValuation && (
        <div className="mb-6">
          <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Valuation</h4>
          <div className="grid grid-cols-2 gap-4">
            {stock?.pe_ratio ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">P/E Ratio</p>
                <p className="text-white font-bold text-lg">{stock.pe_ratio.toFixed(2)}</p>
              </div>
            ) : null}

            {stock?.pb_ratio ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">P/B Ratio</p>
                <p className="text-white font-bold text-lg">{stock.pb_ratio.toFixed(2)}</p>
              </div>
            ) : null}

            {stock?.ps_ratio ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">P/S Ratio</p>
                <p className="text-white font-bold text-lg">{stock.ps_ratio.toFixed(2)}</p>
              </div>
            ) : null}

            {stock?.pcf_ratio ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">P/CF Ratio</p>
                <p className="text-white font-bold text-lg">{stock.pcf_ratio.toFixed(2)}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Profitability Metrics Section */}
      {hasProfitability && (
        <div className="mb-6">
          <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Profitability</h4>
          <div className="grid grid-cols-2 gap-4">
            {stock?.roe ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">ROE</p>
                <p className={`font-bold text-lg ${stock.roe < 0 ? 'text-rose-400' : 'text-white'}`}>{stock.roe.toFixed(2)}%</p>
              </div>
            ) : null}

            {stock?.roa ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">ROA</p>
                <p className={`font-bold text-lg ${stock.roa < 0 ? 'text-rose-400' : 'text-white'}`}>{stock.roa.toFixed(2)}%</p>
              </div>
            ) : null}

            {stock?.roi ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">ROI</p>
                <p className={`font-bold text-lg ${stock.roi < 0 ? 'text-rose-400' : 'text-white'}`}>{stock.roi.toFixed(2)}%</p>
              </div>
            ) : null}

            {stock?.gross_margin ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Gross Margin</p>
                <p className={`font-bold text-lg ${stock.gross_margin < 0 ? 'text-rose-400' : 'text-white'}`}>{stock.gross_margin.toFixed(2)}%</p>
              </div>
            ) : null}

            {stock?.operating_margin ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Operating Margin</p>
                <p className={`font-bold text-lg ${stock.operating_margin < 0 ? 'text-rose-400' : 'text-white'}`}>{stock.operating_margin.toFixed(2)}%</p>
              </div>
            ) : null}

            {stock?.profit_margin ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Profit Margin</p>
                <p className={`font-bold text-lg ${stock.profit_margin < 0 ? 'text-rose-400' : 'text-white'}`}>{stock.profit_margin.toFixed(2)}%</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Financial Health Section */}
      {hasFinancialHealth && (
        <div className="mb-6">
          <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Financial Health</h4>
          <div className="grid grid-cols-2 gap-4">
            {stock?.debt_to_equity ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Debt-to-Equity</p>
                <p className="text-white font-bold text-lg">{stock.debt_to_equity.toFixed(2)}</p>
              </div>
            ) : null}

            {stock?.current_ratio ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Current Ratio</p>
                <p className="text-white font-bold text-lg">{stock.current_ratio.toFixed(2)}</p>
              </div>
            ) : null}

            {stock?.quick_ratio ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Quick Ratio</p>
                <p className="text-white font-bold text-lg">{stock.quick_ratio.toFixed(2)}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Growth Metrics Section */}
      {hasGrowth && (
        <div className="mb-6">
          <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Growth</h4>
          <div className="grid grid-cols-2 gap-4">
            {stock?.revenue_growth ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Revenue Growth</p>
                <p className={`font-bold text-lg ${stock.revenue_growth > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stock.revenue_growth > 0 ? '+' : ''}{stock.revenue_growth.toFixed(2)}%
                </p>
              </div>
            ) : null}

            {stock?.earnings_growth ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Earnings Growth</p>
                <p className={`font-bold text-lg ${stock.earnings_growth > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stock.earnings_growth > 0 ? '+' : ''}{stock.earnings_growth.toFixed(2)}%
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Dividend Metrics Section */}
      {hasDividend && (
        <div className="mb-6">
          <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Dividends</h4>
          <div className="grid grid-cols-2 gap-4">
            {stock?.dividend_yield ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Dividend Yield</p>
                <p className={`font-bold text-lg ${stock.dividend_yield < 0 ? 'text-rose-400' : 'text-white'}`}>{stock.dividend_yield.toFixed(2)}%</p>
              </div>
            ) : null}

            {stock?.payout_ratio ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Payout Ratio</p>
                <p className={`font-bold text-lg ${stock.payout_ratio < 0 ? 'text-rose-400' : 'text-white'}`}>{stock.payout_ratio.toFixed(2)}%</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Per Share Metrics Section */}
      {hasPerShare && (
        <div>
          <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Per Share</h4>
          <div className="grid grid-cols-2 gap-4">
            {stock?.eps ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">EPS</p>
                <p className="text-white font-bold text-lg">${stock.eps.toFixed(2)}</p>
              </div>
            ) : null}

            {stock?.book_value_per_share ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Book Value/Share</p>
                <p className="text-white font-bold text-lg">${stock.book_value_per_share.toFixed(2)}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
