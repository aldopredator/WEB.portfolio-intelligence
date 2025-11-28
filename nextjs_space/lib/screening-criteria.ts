// Default screening criteria
export interface ScreeningCriteria {
  maxPE: number;
  maxPB: number;
  minYTD: number;
  minWeek52: number;
  excludeSectors: string[];
}

export const DEFAULT_CRITERIA: ScreeningCriteria = {
  maxPE: 20,
  maxPB: 3,
  minYTD: 0,
  minWeek52: 10,
  excludeSectors: ['Alcohol', 'Gambling'],
};

// Parse criteria from URL search params
export function parseCriteriaFromParams(searchParams: URLSearchParams): ScreeningCriteria {
  return {
    maxPE: parseFloat(searchParams.get('maxPE') || String(DEFAULT_CRITERIA.maxPE)),
    maxPB: parseFloat(searchParams.get('maxPB') || String(DEFAULT_CRITERIA.maxPB)),
    minYTD: parseFloat(searchParams.get('minYTD') || String(DEFAULT_CRITERIA.minYTD)),
    minWeek52: parseFloat(searchParams.get('minWeek52') || String(DEFAULT_CRITERIA.minWeek52)),
    excludeSectors: searchParams.get('excludeSectors')?.split(',') || DEFAULT_CRITERIA.excludeSectors,
  };
}

// Build URL with criteria parameters
export function buildCriteriaURL(criteria: ScreeningCriteria): string {
  const params = new URLSearchParams({
    maxPE: String(criteria.maxPE),
    maxPB: String(criteria.maxPB),
    minYTD: String(criteria.minYTD),
    minWeek52: String(criteria.minWeek52),
    excludeSectors: criteria.excludeSectors.join(','),
  });
  return `/screening?${params.toString()}`;
}
