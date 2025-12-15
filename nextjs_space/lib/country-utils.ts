// Country name normalization for consistent display across the app
// Maps various country codes and names to standardized full names

export const COUNTRY_NORMALIZATION: Record<string, string> = {
  // ISO codes to full names
  'US': 'United States',
  'USA': 'United States',
  'CN': 'China',
  'JP': 'Japan',
  'GB': 'United Kingdom',
  'UK': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'IN': 'India',
  'CA': 'Canada',
  'KR': 'South Korea',
  'IT': 'Italy',
  'BR': 'Brazil',
  'AU': 'Australia',
  'ES': 'Spain',
  'MX': 'Mexico',
  'ID': 'Indonesia',
  'NL': 'Netherlands',
  'SA': 'Saudi Arabia',
  'CH': 'Switzerland',
  'TR': 'Turkey',
  'TW': 'Taiwan',
  'PL': 'Poland',
  'BE': 'Belgium',
  'TH': 'Thailand',
  'AR': 'Argentina',
  'SE': 'Sweden',
  'IE': 'Ireland',
  'NO': 'Norway',
  'IL': 'Israel',
  'SG': 'Singapore',
  'DK': 'Denmark',
  'AE': 'United Arab Emirates',
  'HK': 'Hong Kong',
  'MY': 'Malaysia',
  'PH': 'Philippines',
  'ZA': 'South Africa',
  'EG': 'Egypt',
  'PK': 'Pakistan',
  'CL': 'Chile',
  'FI': 'Finland',
  'CO': 'Colombia',
  'RO': 'Romania',
  'CZ': 'Czech Republic',
  'PT': 'Portugal',
  'NZ': 'New Zealand',
  'GR': 'Greece',
  'PE': 'Peru',
  'VN': 'Vietnam',
  'HU': 'Hungary',
  'LU': 'Luxembourg',
  'AT': 'Austria',
  
  // Alternative spellings
  'Korea, South': 'South Korea',
  'Russian Federation': 'Russia',
};

/**
 * Normalize country name to match master countries list
 */
export function normalizeCountry(country: string | undefined | null): string {
  if (!country) return 'Unknown';
  
  // Check if it's already a full name we recognize
  const normalized = COUNTRY_NORMALIZATION[country];
  if (normalized) return normalized;
  
  // Return as-is if not in mapping (already full name)
  return country;
}
