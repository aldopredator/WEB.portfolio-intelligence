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
  sentimentFilter: 'all' | 'positive' | 'neutral' | 'negative';
  sentimentEnabled: boolean;
  excludeSectors: string[];
  sectorsEnabled: boolean;
  excludeCountries: string[];
  countriesEnabled: boolean;
}

export const DEFAULT_CRITERIA: ScreeningCriteria = {
  maxPE: 20,
  peEnabled: true,
  maxPB: 3,
  pbEnabled: true,
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
  sentimentFilter: 'all',
  sentimentEnabled: false,
  excludeSectors: ['Alcohol', 'Gambling'],
  sectorsEnabled: true,
  excludeCountries: [],
  countriesEnabled: false,
};

// Parse criteria from URL search params
export function parseCriteriaFromParams(searchParams: URLSearchParams): ScreeningCriteria {
  return {
    maxPE: parseFloat(searchParams.get('maxPE') || String(DEFAULT_CRITERIA.maxPE)),
    peEnabled: searchParams.get('peEnabled') === 'true',
    maxPB: parseFloat(searchParams.get('maxPB') || String(DEFAULT_CRITERIA.maxPB)),
    pbEnabled: searchParams.get('pbEnabled') === 'true',
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
    sentimentFilter: (searchParams.get('sentimentFilter') as 'all' | 'positive' | 'neutral' | 'negative') || DEFAULT_CRITERIA.sentimentFilter,
    sentimentEnabled: searchParams.get('sentimentEnabled') === 'true',
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
    sentimentFilter: criteria.sentimentFilter,
    sentimentEnabled: String(criteria.sentimentEnabled),
    excludeSectors: criteria.excludeSectors.join(','),
    sectorsEnabled: String(criteria.sectorsEnabled),
    excludeCountries: criteria.excludeCountries.join(','),
    countriesEnabled: String(criteria.countriesEnabled),
  });
  return `/screening?${params.toString()}`;
}
