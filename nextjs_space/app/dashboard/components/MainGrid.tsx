'use client';

import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PriceHistoryChart from './PriceHistoryChart';
import StockDetailsCard from './StockDetailsCard';
import StockStatisticsCard from './StockStatisticsCard';
import ShareStatisticsCard from './ShareStatisticsCard';
import SocialSentimentCard from './SocialSentimentCard';
import CompanyInfoCard from './CompanyInfoCard';
import CompanyDescriptionCard from './CompanyDescriptionCard';
import MarketNewsCard from './MarketNewsCard';
import RecommendationTrendsCard from './RecommendationTrendsCard';
import EarningsCalendarCard from './EarningsCalendarCard';
import EarningsSurprisesCard from './EarningsSurprisesCard';
import type { StockInsightsData } from '@/lib/types';

interface MainGridProps {
  stockData: StockInsightsData;
  selectedStock: string;
  stocks?: Array<{ ticker: string; company: string; change_percent?: number; rating?: number; notes?: string; portfolioId?: string | null; isLocked?: boolean; ratingUpdatedAt?: Date | null }>;
  portfolios?: Array<{ id: string; name: string; description?: string | null }>;
  onRatingUpdate?: (ticker: string, rating: number) => void;
}

export default function MainGrid({ stockData, selectedStock, stocks = [], portfolios = [], onRatingUpdate }: MainGridProps) {
  const stockEntry = stockData[selectedStock];
  const currentStock = stocks.find(s => s.ticker === selectedStock);
  const currentRating = currentStock?.rating || 0;
  const currentPortfolioId = currentStock?.portfolioId;
  const isLocked = currentStock?.isLocked || false;
  
  // Debug logging
  console.log('[MainGrid] Selected stock:', selectedStock);
  console.log('[MainGrid] Stocks array:', stocks);
  console.log('[MainGrid] Current stock found:', currentStock);
  console.log('[MainGrid] Current rating:', currentRating);
  
  // Handle empty portfolio or no stock selected
  if (!selectedStock) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: 2
      }}>
        <Typography variant="h5" sx={{ color: '#94a3b8' }}>
          No stock selected
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Select a ticker from the list or add a new one to get started
        </Typography>
      </Box>
    );
  }
  
  if (!stockEntry || typeof stockEntry === 'string') {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px'
      }}>
        <Typography sx={{ color: '#94a3b8' }}>
          No data available for {selectedStock}
        </Typography>
      </Box>
    );
  }

  const stock = stockEntry.stock_data;
  if (!stock) {
    return <Typography>Stock data not available</Typography>;
  }

  // Debug: Log Polygon data
  console.log('[MainGrid] Stock data for', selectedStock, ':', {
    floatShares: stock.floatShares,
    sharesOutstanding: stock.sharesOutstanding,
    dailyVolume: stock.dailyVolume,
    totalEmployees: stock.totalEmployees,
  });

  // Get company name from stock config
  const companyNameMap: Record<string, string> = {
    'GOOG': 'Alphabet',
    'TSLA': 'Tesla',
    'NVDA': 'Nvidia',
    'AMZN': 'Amazon',
    'BRK-B': 'Berkshire Hathaway',
    'ISRG': 'Intuitive Surgical',
    'NFLX': 'Netflix',
    'IDXX': 'IDEXX Laboratories',
    'III': '3i Group',
    'PLTR': 'Palantir',
    'QBTS': 'D-Wave Quantum',
    'RGTI': 'Rigetti Computing',
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      {/* Top row: Company Info, Stock Fundamentals, and Stock Statistics */}
      {stockEntry.company_profile && (
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {stockEntry.company_profile && (
              <CompanyInfoCard
                key={selectedStock}
                ticker={selectedStock}
                companyName={stockEntry.company_profile.name}
                logo={stockEntry.company_profile.logo}
                industry={stockEntry.company_profile.industry}
                sector={stockEntry.company_profile.sector}
                subSector={stockEntry.company_profile.subSector}
                country={stockEntry.company_profile.country}
                marketCapitalization={stockEntry.company_profile.marketCapitalization}
                currency={stockEntry.company_profile.currency}
                weburl={stockEntry.company_profile.weburl}
                assets={stockEntry.company_profile.assets}
                liabilities={stockEntry.company_profile.liabilities}
                floatShares={stock.floatShares}
                averageVolume={stock.averageVolume}
                averageVolume10Day={stock.averageVolume10Day}
                sharesOutstanding={stock.sharesOutstanding}
                totalEmployees={stock.totalEmployees}
                heldPercentInsiders={stock.heldPercentInsiders}
                heldPercentInstitutions={stock.heldPercentInstitutions}
                fiftyTwoWeekHigh={stock.fiftyTwoWeekHigh}
                fiftyTwoWeekLow={stock.fiftyTwoWeekLow}
                fiftyDayAverage={stock.fiftyDayAverage}
                twoHundredDayAverage={stock.twoHundredDayAverage}
                enterpriseValue={stockEntry.company_profile.marketCapitalization}
                ipoDate={stockEntry.company_profile.ipoDate}
                initialRating={currentRating}
                initialNotes={currentStock?.notes}
                ratingUpdatedAt={currentStock?.ratingUpdatedAt}
                isLocked={isLocked}
                portfolios={portfolios}
                currentPortfolioId={currentPortfolioId}
                onRatingUpdate={onRatingUpdate}
              />
            )}
            <StockDetailsCard
              ticker={selectedStock}
              priceToSales={stock.priceToSales}
              enterpriseToRevenue={stock.enterpriseToRevenue}
              enterpriseToEbitda={stock.enterpriseToEbitda}
              trailingPE={stock.trailingPE}
              forwardPE={stock.forwardPE}
              priceToBook={stock.priceToBook}
              debtToEquity={stock.debtToEquity || stock.debt_to_equity}
            />
            <StockStatisticsCard
              ticker={selectedStock}
              roe={stock.roe}
              returnOnAssets={stock.returnOnAssets}
              profitMargin={stock.profit_margin}
              quarterlyRevenueGrowth={stock.quarterlyRevenueGrowth}
              quarterlyEarningsGrowth={stock.quarterlyEarningsGrowth}
              beta={stock.beta}
            />
          </Box>
        </Box>
      )}

      {/* Middle Section: Price Chart (left) and Stock Statistics (right) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '2fr 1fr',
          },
          gap: 2,
          mb: 2,
        }}
      >
        {/* Price Chart */}
        {stock.price_movement_90_days && stock.price_movement_90_days.length > 0 && (
          <PriceHistoryChart
            data={stock.price_movement_90_days}
            ticker={selectedStock}
            currentPrice={stock.current_price || 0}
            priceChange={stock.change || 0}
            priceChangePercent={stock.change_percent || 0}
            weekLow52={stock.fiftyTwoWeekLow || stock['52_week_low']}
            weekHigh52={stock.fiftyTwoWeekHigh || stock['52_week_high']}
            volume={stock.volume}
            fiftyDayAverage={stock.fiftyDayAverage}
            twoHundredDayAverage={stock.twoHundredDayAverage}
            stocks={stocks}
          />
        )}
        
        {/* Stock Statistics */}
        <ShareStatisticsCard
          ticker={selectedStock}
          sharesOutstanding={stock.sharesOutstanding}
          floatShares={stock.floatShares}
          averageVolume10Day={stock.averageVolume10Day}
          averageVolume={stock.averageVolume}
          heldPercentInsiders={stock.heldPercentInsiders}
          heldPercentInstitutions={stock.heldPercentInstitutions}
        />
      </Box>

      {/* Bottom Section: Earnings + Recommendations (left) and Social Sentiment (right) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '2fr 1fr',
          },
          gap: 2,
        }}
      >
        {/* Left: Earnings and Recommendations side by side */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
            },
            gap: 2,
          }}
        >
          <EarningsSurprisesCard
            ticker={selectedStock}
            surprises={stockEntry.earnings_surprises || []}
          />
          <RecommendationTrendsCard
            ticker={selectedStock}
            trends={stockEntry.recommendation_trends || []}
          />
        </Box>
        
        {/* Right: Social Sentiment */}
        <SocialSentimentCard
          ticker={selectedStock}
          sentiment={stockEntry.social_sentiment}
        />
      </Box>
      {/* Market News and Company Description Section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'repeat(2, 1fr)',
          },
          gap: 2,
          mt: 3,
        }}
      >
        <MarketNewsCard
          ticker={selectedStock}
          articles={stockEntry.latest_news || []}
        />
        {stockEntry.company_profile?.description && (
          <CompanyDescriptionCard
            ticker={selectedStock}
            companyName={stockEntry.company_profile.name}
            description={stockEntry.company_profile.description}
          />
        )}
      </Box>
    </Box>
  );
}
