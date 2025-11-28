// Default screening criteria
export interface ScreeningCriteria {
  maxPE: number;
  peEnabled: boolean;
  maxPB: number;
  pbEnabled: boolean;
  excludeSectors: string[];
  sectorsEnabled: boolean;
}

export const DEFAULT_CRITERIA: ScreeningCriteria = {
  maxPE: 20,
  peEnabled: true,
  maxPB: 3,
  pbEnabled: true,
  excludeSectors: ['Alcohol', 'Gambling'],
  sectorsEnabled: true,
};

// Parse criteria from URL search params
export function parseCriteriaFromParams(searchParams: URLSearchParams): ScreeningCriteria {
  return {
    maxPE: parseFloat(searchParams.get('maxPE') || String(DEFAULT_CRITERIA.maxPE)),
    peEnabled: searchParams.get('peEnabled') === 'true',
    maxPB: parseFloat(searchParams.get('maxPB') || String(DEFAULT_CRITERIA.maxPB)),
    pbEnabled: searchParams.get('pbEnabled') === 'true',
    excludeSectors: searchParams.get('excludeSectors')?.split(',').filter(s => s) || DEFAULT_CRITERIA.excludeSectors,
    sectorsEnabled: searchParams.get('sectorsEnabled') === 'true',
  };
}

// Build URL with criteria parameters
export function buildCriteriaURL(criteria: ScreeningCriteria): string {
  const params = new URLSearchParams({
    maxPE: String(criteria.maxPE),
    peEnabled: String(criteria.peEnabled),
    maxPB: String(criteria.maxPB),
    pbEnabled: String(criteria.pbEnabled),
    excludeSectors: criteria.excludeSectors.join(','),
    sectorsEnabled: String(criteria.sectorsEnabled),
  });
  return `/screening?${params.toString()}`;
}
