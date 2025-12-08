// Default screening criteria
export interface ScreeningCriteria {
  maxPE: number;
  peEnabled: boolean;
  maxPB: number;
  pbEnabled: boolean;
  minMarketCap: number;
  maxMarketCap: number;
  marketCapEnabled: boolean;
  minBeta: number;
  maxBeta: number;
  betaEnabled: boolean;
  minROE: number;
  roeEnabled: boolean;
  minProfitMargin: number;
  profitMarginEnabled: boolean;
  minPriceToSales: number;
  maxPriceToSales: number;
  priceToSalesEnabled: boolean;
  minForwardPE: number;
  maxForwardPE: number;
  forwardPEEnabled: boolean;
  minPEGRatio: number;
  maxPEGRatio: number;
  pegRatioEnabled: boolean;
  minEnterpriseValue: number;
  maxEnterpriseValue: number;
  enterpriseValueEnabled: boolean;
  minEVRevenue: number;
  maxEVRevenue: number;
  evRevenueEnabled: boolean;
  minEVEBITDA: number;
  maxEVEBITDA: number;
  evEbitdaEnabled: boolean;
  minROA: number;
  roaEnabled: boolean;
  minQuarterlyRevenueGrowth: number;
  quarterlyRevenueGrowthEnabled: boolean;
  minQuarterlyEarningsGrowth: number;
  quarterlyEarningsGrowthEnabled: boolean;
  maxDebtToEquity: number;
  debtToEquityEnabled: boolean;
  minHeldByInsiders: number;
  maxHeldByInsiders: number;
  heldByInsidersEnabled: boolean;
  minHeldByInstitutions: number;
  maxHeldByInstitutions: number;
  heldByInstitutionsEnabled: boolean;
  minAvgDailyVolume: number;
  maxAvgDailyVolume: number;
  avgDailyVolumeEnabled: boolean;
  minAvgAnnualVolume10D: number;
  maxAvgAnnualVolume10D: number;
  avgAnnualVolume10DEnabled: boolean;
  minAvgAnnualVolume3M: number;
  maxAvgAnnualVolume3M: number;
  avgAnnualVolume3MEnabled: boolean;
  sentimentFilter: 'all' | 'positive' | 'neutral' | 'negative';
  sentimentEnabled: boolean;
  minRating: number;
  ratingEnabled: boolean;
  portfolioFilter: string[];
  portfolioFilterEnabled: boolean;
  excludeSectors: string[];
  sectorsEnabled: boolean;
  excludeCountries: string[];
  countriesEnabled: boolean;
}

export const DEFAULT_CRITERIA: ScreeningCriteria = {
  maxPE: 20,
  peEnabled: false,
  maxPB: 3,
  pbEnabled: false,
  minMarketCap: 0,
  maxMarketCap: 5000,
  marketCapEnabled: false,
  minBeta: 0,
  maxBeta: 2,
  betaEnabled: false,
  minROE: 15,
  roeEnabled: false,
  minProfitMargin: 10,
  profitMarginEnabled: false,
  minPriceToSales: 0,
  maxPriceToSales: 10,
  priceToSalesEnabled: false,
  minForwardPE: 5,
  maxForwardPE: 50,
  forwardPEEnabled: false,
  minPEGRatio: 0,
  maxPEGRatio: 3,
  pegRatioEnabled: false,
  minEnterpriseValue: 0,
  maxEnterpriseValue: 5000,
  enterpriseValueEnabled: false,
  minEVRevenue: 0,
  maxEVRevenue: 20,
  evRevenueEnabled: false,
  minEVEBITDA: 0,
  maxEVEBITDA: 30,
  evEbitdaEnabled: false,
  minROA: 5,
  roaEnabled: false,
  minQuarterlyRevenueGrowth: 0,
  quarterlyRevenueGrowthEnabled: false,
  minQuarterlyEarningsGrowth: 0,
  quarterlyEarningsGrowthEnabled: false,
  maxDebtToEquity: 100,
  debtToEquityEnabled: false,
  minHeldByInsiders: 0,
  maxHeldByInsiders: 100,
  heldByInsidersEnabled: false,
  minHeldByInstitutions: 0,
  maxHeldByInstitutions: 100,
  heldByInstitutionsEnabled: false,
  minAvgDailyVolume: 0,
  maxAvgDailyVolume: 1000,
  avgDailyVolumeEnabled: false,
  minAvgAnnualVolume10D: 0,
  maxAvgAnnualVolume10D: 5000,
  avgAnnualVolume10DEnabled: false,
  minAvgAnnualVolume3M: 0,
  maxAvgAnnualVolume3M: 5000,
  avgAnnualVolume3MEnabled: false,
  sentimentFilter: 'all',
  sentimentEnabled: false,
  minRating: 0,
  ratingEnabled: false,
  portfolioFilter: [],
  portfolioFilterEnabled: false,
  excludeSectors: ['Alcohol', 'Gambling'],
  sectorsEnabled: true,
  excludeCountries: [],
  countriesEnabled: false,
};

// Parse criteria from URL search params
export function parseCriteriaFromParams(searchParams: URLSearchParams): ScreeningCriteria {
  return {
    maxPE: parseFloat(searchParams.get('maxPE') || String(DEFAULT_CRITERIA.maxPE)),
    peEnabled: searchParams.has('peEnabled') ? searchParams.get('peEnabled') === 'true' : DEFAULT_CRITERIA.peEnabled,
    maxPB: parseFloat(searchParams.get('maxPB') || String(DEFAULT_CRITERIA.maxPB)),
    pbEnabled: searchParams.has('pbEnabled') ? searchParams.get('pbEnabled') === 'true' : DEFAULT_CRITERIA.pbEnabled,
    minMarketCap: parseFloat(searchParams.get('minMarketCap') || String(DEFAULT_CRITERIA.minMarketCap)),
    maxMarketCap: parseFloat(searchParams.get('maxMarketCap') || String(DEFAULT_CRITERIA.maxMarketCap)),
    marketCapEnabled: searchParams.get('marketCapEnabled') === 'true',
    minBeta: parseFloat(searchParams.get('minBeta') || String(DEFAULT_CRITERIA.minBeta)),
    maxBeta: parseFloat(searchParams.get('maxBeta') || String(DEFAULT_CRITERIA.maxBeta)),
    betaEnabled: searchParams.get('betaEnabled') === 'true',
    minROE: parseFloat(searchParams.get('minROE') || String(DEFAULT_CRITERIA.minROE)),
    roeEnabled: searchParams.get('roeEnabled') === 'true',
    minProfitMargin: parseFloat(searchParams.get('minProfitMargin') || String(DEFAULT_CRITERIA.minProfitMargin)),
    profitMarginEnabled: searchParams.get('profitMarginEnabled') === 'true',
    minPriceToSales: parseFloat(searchParams.get('minPriceToSales') || String(DEFAULT_CRITERIA.minPriceToSales)),
    maxPriceToSales: parseFloat(searchParams.get('maxPriceToSales') || String(DEFAULT_CRITERIA.maxPriceToSales)),
    priceToSalesEnabled: searchParams.get('priceToSalesEnabled') === 'true',
    minForwardPE: parseFloat(searchParams.get('minForwardPE') || String(DEFAULT_CRITERIA.minForwardPE)),
    maxForwardPE: parseFloat(searchParams.get('maxForwardPE') || String(DEFAULT_CRITERIA.maxForwardPE)),
    forwardPEEnabled: searchParams.get('forwardPEEnabled') === 'true',
    minPEGRatio: parseFloat(searchParams.get('minPEGRatio') || String(DEFAULT_CRITERIA.minPEGRatio)),
    maxPEGRatio: parseFloat(searchParams.get('maxPEGRatio') || String(DEFAULT_CRITERIA.maxPEGRatio)),
    pegRatioEnabled: searchParams.get('pegRatioEnabled') === 'true',
    minEnterpriseValue: parseFloat(searchParams.get('minEnterpriseValue') || String(DEFAULT_CRITERIA.minEnterpriseValue)),
    maxEnterpriseValue: parseFloat(searchParams.get('maxEnterpriseValue') || String(DEFAULT_CRITERIA.maxEnterpriseValue)),
    enterpriseValueEnabled: searchParams.get('enterpriseValueEnabled') === 'true',
    minEVRevenue: parseFloat(searchParams.get('minEVRevenue') || String(DEFAULT_CRITERIA.minEVRevenue)),
    maxEVRevenue: parseFloat(searchParams.get('maxEVRevenue') || String(DEFAULT_CRITERIA.maxEVRevenue)),
    evRevenueEnabled: searchParams.get('evRevenueEnabled') === 'true',
    minEVEBITDA: parseFloat(searchParams.get('minEVEBITDA') || String(DEFAULT_CRITERIA.minEVEBITDA)),
    maxEVEBITDA: parseFloat(searchParams.get('maxEVEBITDA') || String(DEFAULT_CRITERIA.maxEVEBITDA)),
    evEbitdaEnabled: searchParams.get('evEbitdaEnabled') === 'true',
    minROA: parseFloat(searchParams.get('minROA') || String(DEFAULT_CRITERIA.minROA)),
    roaEnabled: searchParams.get('roaEnabled') === 'true',
    minQuarterlyRevenueGrowth: parseFloat(searchParams.get('minQuarterlyRevenueGrowth') || String(DEFAULT_CRITERIA.minQuarterlyRevenueGrowth)),
    quarterlyRevenueGrowthEnabled: searchParams.get('quarterlyRevenueGrowthEnabled') === 'true',
    minQuarterlyEarningsGrowth: parseFloat(searchParams.get('minQuarterlyEarningsGrowth') || String(DEFAULT_CRITERIA.minQuarterlyEarningsGrowth)),
    quarterlyEarningsGrowthEnabled: searchParams.get('quarterlyEarningsGrowthEnabled') === 'true',
    maxDebtToEquity: parseFloat(searchParams.get('maxDebtToEquity') || String(DEFAULT_CRITERIA.maxDebtToEquity)),
    debtToEquityEnabled: searchParams.get('debtToEquityEnabled') === 'true',
    minHeldByInsiders: parseFloat(searchParams.get('minHeldByInsiders') || String(DEFAULT_CRITERIA.minHeldByInsiders)),
    maxHeldByInsiders: parseFloat(searchParams.get('maxHeldByInsiders') || String(DEFAULT_CRITERIA.maxHeldByInsiders)),
    heldByInsidersEnabled: searchParams.get('heldByInsidersEnabled') === 'true',
    minHeldByInstitutions: parseFloat(searchParams.get('minHeldByInstitutions') || String(DEFAULT_CRITERIA.minHeldByInstitutions)),
    maxHeldByInstitutions: parseFloat(searchParams.get('maxHeldByInstitutions') || String(DEFAULT_CRITERIA.maxHeldByInstitutions)),
    heldByInstitutionsEnabled: searchParams.get('heldByInstitutionsEnabled') === 'true',
    minAvgDailyVolume: parseFloat(searchParams.get('minAvgDailyVolume') || String(DEFAULT_CRITERIA.minAvgDailyVolume)),
    maxAvgDailyVolume: parseFloat(searchParams.get('maxAvgDailyVolume') || String(DEFAULT_CRITERIA.maxAvgDailyVolume)),
    avgDailyVolumeEnabled: searchParams.get('avgDailyVolumeEnabled') === 'true',
    minAvgAnnualVolume10D: parseFloat(searchParams.get('minAvgAnnualVolume10D') || String(DEFAULT_CRITERIA.minAvgAnnualVolume10D)),
    maxAvgAnnualVolume10D: parseFloat(searchParams.get('maxAvgAnnualVolume10D') || String(DEFAULT_CRITERIA.maxAvgAnnualVolume10D)),
    avgAnnualVolume10DEnabled: searchParams.get('avgAnnualVolume10DEnabled') === 'true',
    minAvgAnnualVolume3M: parseFloat(searchParams.get('minAvgAnnualVolume3M') || String(DEFAULT_CRITERIA.minAvgAnnualVolume3M)),
    maxAvgAnnualVolume3M: parseFloat(searchParams.get('maxAvgAnnualVolume3M') || String(DEFAULT_CRITERIA.maxAvgAnnualVolume3M)),
    avgAnnualVolume3MEnabled: searchParams.get('avgAnnualVolume3MEnabled') === 'true',
    sentimentFilter: (searchParams.get('sentimentFilter') as 'all' | 'positive' | 'neutral' | 'negative') || DEFAULT_CRITERIA.sentimentFilter,
    sentimentEnabled: searchParams.get('sentimentEnabled') === 'true',
    minRating: parseFloat(searchParams.get('minRating') || String(DEFAULT_CRITERIA.minRating)),
    ratingEnabled: searchParams.get('ratingEnabled') === 'true',
    portfolioFilter: searchParams.get('portfolioFilter')?.split(',').filter(s => s) || DEFAULT_CRITERIA.portfolioFilter,
    portfolioFilterEnabled: searchParams.get('portfolioFilterEnabled') === 'true',
    excludeSectors: searchParams.get('excludeSectors')?.split(',').filter(s => s) || DEFAULT_CRITERIA.excludeSectors,
    sectorsEnabled: searchParams.get('sectorsEnabled') === 'true',
    excludeCountries: searchParams.get('excludeCountries')?.split(',').filter(s => s) || DEFAULT_CRITERIA.excludeCountries,
    countriesEnabled: searchParams.get('countriesEnabled') === 'true',
  };
}

// Build URL with criteria parameters
export function buildCriteriaURL(criteria: ScreeningCriteria): string {
  const params = new URLSearchParams({
    maxPE: String(criteria.maxPE),
    peEnabled: String(criteria.peEnabled),
    maxPB: String(criteria.maxPB),
    pbEnabled: String(criteria.pbEnabled),
    minMarketCap: String(criteria.minMarketCap),
    maxMarketCap: String(criteria.maxMarketCap),
    marketCapEnabled: String(criteria.marketCapEnabled),
    minBeta: String(criteria.minBeta),
    maxBeta: String(criteria.maxBeta),
    betaEnabled: String(criteria.betaEnabled),
    minROE: String(criteria.minROE),
    roeEnabled: String(criteria.roeEnabled),
    minProfitMargin: String(criteria.minProfitMargin),
    profitMarginEnabled: String(criteria.profitMarginEnabled),
    minPriceToSales: String(criteria.minPriceToSales),
    maxPriceToSales: String(criteria.maxPriceToSales),
    priceToSalesEnabled: String(criteria.priceToSalesEnabled),
    minForwardPE: String(criteria.minForwardPE),
    maxForwardPE: String(criteria.maxForwardPE),
    forwardPEEnabled: String(criteria.forwardPEEnabled),
    minPEGRatio: String(criteria.minPEGRatio),
    maxPEGRatio: String(criteria.maxPEGRatio),
    pegRatioEnabled: String(criteria.pegRatioEnabled),
    minEnterpriseValue: String(criteria.minEnterpriseValue),
    maxEnterpriseValue: String(criteria.maxEnterpriseValue),
    enterpriseValueEnabled: String(criteria.enterpriseValueEnabled),
    minEVRevenue: String(criteria.minEVRevenue),
    maxEVRevenue: String(criteria.maxEVRevenue),
    evRevenueEnabled: String(criteria.evRevenueEnabled),
    minEVEBITDA: String(criteria.minEVEBITDA),
    maxEVEBITDA: String(criteria.maxEVEBITDA),
    evEbitdaEnabled: String(criteria.evEbitdaEnabled),
    minROA: String(criteria.minROA),
    roaEnabled: String(criteria.roaEnabled),
    minQuarterlyRevenueGrowth: String(criteria.minQuarterlyRevenueGrowth),
    quarterlyRevenueGrowthEnabled: String(criteria.quarterlyRevenueGrowthEnabled),
    minQuarterlyEarningsGrowth: String(criteria.minQuarterlyEarningsGrowth),
    quarterlyEarningsGrowthEnabled: String(criteria.quarterlyEarningsGrowthEnabled),
    maxDebtToEquity: String(criteria.maxDebtToEquity),
    debtToEquityEnabled: String(criteria.debtToEquityEnabled),
    minHeldByInsiders: String(criteria.minHeldByInsiders),
    maxHeldByInsiders: String(criteria.maxHeldByInsiders),
    heldByInsidersEnabled: String(criteria.heldByInsidersEnabled),
    minHeldByInstitutions: String(criteria.minHeldByInstitutions),
    maxHeldByInstitutions: String(criteria.maxHeldByInstitutions),
    heldByInstitutionsEnabled: String(criteria.heldByInstitutionsEnabled),
    minAvgDailyVolume: String(criteria.minAvgDailyVolume),
    maxAvgDailyVolume: String(criteria.maxAvgDailyVolume),
    avgDailyVolumeEnabled: String(criteria.avgDailyVolumeEnabled),
    minAvgAnnualVolume10D: String(criteria.minAvgAnnualVolume10D),
    maxAvgAnnualVolume10D: String(criteria.maxAvgAnnualVolume10D),
    avgAnnualVolume10DEnabled: String(criteria.avgAnnualVolume10DEnabled),
    minAvgAnnualVolume3M: String(criteria.minAvgAnnualVolume3M),
    maxAvgAnnualVolume3M: String(criteria.maxAvgAnnualVolume3M),
    avgAnnualVolume3MEnabled: String(criteria.avgAnnualVolume3MEnabled),
    sentimentFilter: criteria.sentimentFilter,
    sentimentEnabled: String(criteria.sentimentEnabled),
    minRating: String(criteria.minRating),
    ratingEnabled: String(criteria.ratingEnabled),
    portfolioFilter: criteria.portfolioFilter.join(','),
    portfolioFilterEnabled: String(criteria.portfolioFilterEnabled),
    excludeSectors: criteria.excludeSectors.join(','),
    sectorsEnabled: String(criteria.sectorsEnabled),
    excludeCountries: criteria.excludeCountries.join(','),
    countriesEnabled: String(criteria.countriesEnabled),
  });
  return `/screening?${params.toString()}`;
}
