export interface CurrencyInfo {
  symbol: string;
  code: string;
  format: (n: number) => string;
  step: number;
  min: number;
  max: number;
  locale: string;
}

export const currencyMap: Record<string, CurrencyInfo> = {
  US: {
    symbol: '$',
    code: 'USD',
    format: (n) => `$${n.toLocaleString('en-US')}`,
    step: 5000,
    min: 30000,
    max: 300000,
    locale: 'en-US',
  },
  IN: {
    symbol: '₹',
    code: 'INR',
    format: (n) => `₹${n.toLocaleString('en-IN')}`,
    step: 50000,
    min: 300000,
    max: 5000000,
    locale: 'en-IN',
  },
  DE: {
    symbol: '€',
    code: 'EUR',
    format: (n) => `${n.toLocaleString('de-DE')}€`,
    step: 5000,
    min: 40000,
    max: 150000,
    locale: 'de-DE',
  },
  GB: {
    symbol: '£',
    code: 'GBP',
    format: (n) => `£${n.toLocaleString('en-GB')}`,
    step: 5000,
    min: 25000,
    max: 200000,
    locale: 'en-GB',
  },
  EU: {
    symbol: '€',
    code: 'EUR',
    format: (n) => `${n.toLocaleString('en-IE')}€`,
    step: 5000,
    min: 35000,
    max: 180000,
    locale: 'en-IE',
  },
};

export function getCurrencyInfo(countryCode: string | undefined): CurrencyInfo {
  if (!countryCode) return currencyMap.US;
  return currencyMap[countryCode] || currencyMap.US;
}
