/**
 * Currency formatting utilities for job portal
 */

// Currency symbol mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  'INR': '₹',
  'USD': '$',
  'GBP': '£',
  'EUR': '€',
  'AED': 'د.إ',
  'CAD': 'C$',
  'AUD': 'A$',
  'SGD': 'S$',
  'JPY': '¥',
  'CNY': '¥',
  'KRW': '₩',
  'THB': '฿',
  'MYR': 'RM',
  'PHP': '₱',
  'IDR': 'Rp',
  'VND': '₫',
  'HKD': 'HK$',
  'TWD': 'NT$',
  'NZD': 'NZ$',
  'CHF': 'CHF',
  'SEK': 'kr',
  'NOK': 'kr',
  'DKK': 'kr',
  'PLN': 'zł',
  'CZK': 'Kč',
  'HUF': 'Ft',
  'RON': 'lei',
  'BGN': 'лв',
  'HRK': 'kn',
  'RSD': 'дин',
  'UAH': '₴',
  'RUB': '₽',
  'TRY': '₺',
  'ILS': '₪',
  'EGP': 'E£',
  'ZAR': 'R',
  'NGN': '₦',
  'KES': 'KSh',
  'GHS': '₵',
  'MAD': 'MAD',
  'TND': 'DT',
  'BRL': 'R$',
  'ARS': '$',
  'CLP': '$',
  'COP': '$',
  'PEN': 'S/',
  'UYU': '$U',
  'MXN': '$',
  'VES': 'Bs',
  'GTQ': 'Q',
  'HNL': 'L',
  'NIO': 'C$',
  'CRC': '₡',
  'PAB': 'B/.',
  'DOP': 'RD$',
  'JMD': 'J$',
  'TTD': 'TT$',
  'BBD': 'Bds$',
  'XCD': 'EC$',
  'AWG': 'ƒ',
  'BSD': 'B$',
  'BZD': 'BZ$',
  'KYD': 'CI$',
  'BMD': 'BD$',
  'FJD': 'FJ$',
  'PGK': 'K',
  'SBD': 'SI$',
  'TOP': 'T$',
  'VUV': 'Vt',
  'WST': 'WS$',
  'NPR': '₨',
  'PKR': '₨',
  'LKR': '₨',
  'BDT': '৳',
  'AFN': '؋',
  'KZT': '₸',
  'UZS': 'лв',
  'KGS': 'лв',
  'TJS': 'SM',
  'TMT': 'T',
  'MNT': '₮',
  'KHR': '៛',
  'LAK': '₭',
  'MMK': 'K',
  'BND': 'B$',
  'BTN': 'Nu.',
  'MVR': '.ރ',
  'LBP': 'ل.ل',
  'JOD': 'د.ا',
  'KWD': 'د.ك',
  'BHD': 'د.ب',
  'QAR': 'ر.ق',
  'SAR': 'ر.س',
  'OMR': 'ر.ع.',
  'YER': '﷼',
  'IQD': 'د.ع',
  'IRR': '﷼',
  'AMD': '֏',
  'AZN': '₼',
  'GEL': '₾',
  'MDL': 'L',
  'BYN': 'Br',
  'LT': '€',
  'LV': '€',
  'EE': '€',
  'IE': '€',
  'IS': 'ISK',
  'LU': '€',
  'MT': '€',
  'CY': '€',
  'GR': '€',
  'PT': '€',
  'SK': '€',
  'SI': '€',
  'AL': 'ALL',
  'MK': 'MKD',
  'ME': '€',
  'BA': 'BAM',
  'XK': '€',
  'NZ': 'NZD'
};

// Currency formatting with proper symbols and locale-specific formatting
export function formatSalary(
  salary: string | number | null | undefined,
  currency: string = 'USD',
  country: string = 'US'
): string {
  if (!salary) return 'Salary not specified';
  
  // Handle string salaries that might already have currency symbols
  if (typeof salary === 'string') {
    // If it already has a currency symbol, return as is
    if (salary.match(/[₹$£€د.إC$A$S$¥₩฿RM₱Rp₫HK$NT$NZ$CHFkrkrzłKčFtleilвknдин₴₽₺₪E£R₦KSh₵MADDTBsS/$URD$Bds$EC$ƒB$CI$BD$FJ$KSI$T$VtWS$₨৳؋₸лвSMT₮៛₭KBNu..ރل.لد.اد.كد.بر.قر.سر.عر.ع.﷼د.ع؋֏₼₾LBr₸лвSMT₮]/)) {
      return salary;
    }
    
    // Clean the string and extract numbers
    const cleanSalary = salary.replace(/[^\d,-]/g, '');
    if (!cleanSalary) return 'Salary not specified';
    
    // If it's a range (contains -)
    if (cleanSalary.includes('-')) {
      const [min, max] = cleanSalary.split('-').map(s => s.replace(/,/g, ''));
      const minNum = parseInt(min);
      const maxNum = parseInt(max);
      if (!isNaN(minNum) && !isNaN(maxNum)) {
        return formatSalaryRange(minNum, maxNum, currency, country);
      }
    }
    
    // Single salary value
    const salaryNum = parseInt(cleanSalary.replace(/,/g, ''));
    if (!isNaN(salaryNum)) {
      return formatSingleSalary(salaryNum, currency, country);
    }
    
    return salary; // Return original if we can't parse it
  }
  
  // Handle numeric salaries
  const salaryNum = typeof salary === 'number' ? salary : parseInt(String(salary));
  if (isNaN(salaryNum)) return 'Salary not specified';
  
  return formatSingleSalary(salaryNum, currency, country);
}

// Format salary range (min - max)
export function formatSalaryRange(
  min: number,
  max: number,
  currency: string = 'USD',
  country: string = 'US'
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  
  // Format numbers based on currency
  const formattedMin = formatNumber(min, currency, country);
  const formattedMax = formatNumber(max, currency, country);
  
  return `${symbol}${formattedMin} - ${symbol}${formattedMax}`;
}

// Format single salary value
export function formatSingleSalary(
  amount: number,
  currency: string = 'USD',
  country: string = 'US'
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  const formattedAmount = formatNumber(amount, currency, country);
  
  return `${symbol}${formattedAmount}`;
}

// Format numbers with proper locale formatting
function formatNumber(amount: number, currency: string, country: string): string {
  // Define locale based on country
  const locales: Record<string, string> = {
    'IN': 'en-IN',  // India
    'US': 'en-US',  // United States
    'GB': 'en-GB',  // United Kingdom
    'AE': 'en-AE',  // UAE
    'CA': 'en-CA',  // Canada
    'AU': 'en-AU',  // Australia
    'SG': 'en-SG',  // Singapore
    'DE': 'de-DE',  // Germany
    'FR': 'fr-FR',  // France
    'IT': 'it-IT',  // Italy
    'ES': 'es-ES',  // Spain
    'NL': 'nl-NL',  // Netherlands
    'BE': 'nl-BE',  // Belgium
    'CH': 'de-CH',  // Switzerland
    'AT': 'de-AT',  // Austria
    'SE': 'sv-SE',  // Sweden
    'NO': 'nb-NO',  // Norway
    'DK': 'da-DK',  // Denmark
    'FI': 'fi-FI',  // Finland
    'PL': 'pl-PL',  // Poland
    'CZ': 'cs-CZ',  // Czech Republic
    'HU': 'hu-HU',  // Hungary
    'RO': 'ro-RO',  // Romania
    'BG': 'bg-BG',  // Bulgaria
    'HR': 'hr-HR',  // Croatia
    'RS': 'sr-RS',  // Serbia
    'UA': 'uk-UA',  // Ukraine
    'RU': 'ru-RU',  // Russia
    'TR': 'tr-TR',  // Turkey
    'IL': 'he-IL',  // Israel
    'EG': 'ar-EG',  // Egypt
    'ZA': 'en-ZA',  // South Africa
    'NG': 'en-NG',  // Nigeria
    'KE': 'sw-KE',  // Kenya
    'GH': 'en-GH',  // Ghana
    'MA': 'ar-MA',  // Morocco
    'TN': 'ar-TN',  // Tunisia
    'BR': 'pt-BR',  // Brazil
    'AR': 'es-AR',  // Argentina
    'CL': 'es-CL',  // Chile
    'CO': 'es-CO',  // Colombia
    'PE': 'es-PE',  // Peru
    'UY': 'es-UY',  // Uruguay
    'MX': 'es-MX',  // Mexico
    'VE': 'es-VE',  // Venezuela
    'GT': 'es-GT',  // Guatemala
    'HN': 'es-HN',  // Honduras
    'NI': 'es-NI',  // Nicaragua
    'CR': 'es-CR',  // Costa Rica
    'PA': 'es-PA',  // Panama
    'DO': 'es-DO',  // Dominican Republic
    'JM': 'en-JM',  // Jamaica
    'TT': 'en-TT',  // Trinidad and Tobago
    'BB': 'en-BB',  // Barbados
    'AG': 'en-AG',  // Antigua and Barbuda
    'BS': 'en-BS',  // Bahamas
    'BZ': 'en-BZ',  // Belize
    'DM': 'en-DM',  // Dominica
    'GD': 'en-GD',  // Grenada
    'KN': 'en-KN',  // Saint Kitts and Nevis
    'LC': 'en-LC',  // Saint Lucia
    'VC': 'en-VC',  // Saint Vincent and the Grenadines
    'SR': 'nl-SR',  // Suriname
    'GY': 'en-GY',  // Guyana
    'FJ': 'en-FJ',  // Fiji
    'PG': 'en-PG',  // Papua New Guinea
    'SB': 'en-SB',  // Solomon Islands
    'TO': 'en-TO',  // Tonga
    'VU': 'en-VU',  // Vanuatu
    'WS': 'en-WS',  // Samoa
    'NP': 'ne-NP',  // Nepal
    'PK': 'ur-PK',  // Pakistan
    'LK': 'si-LK',  // Sri Lanka
    'BD': 'bn-BD',  // Bangladesh
    'AF': 'fa-AF',  // Afghanistan
    'KZ': 'kk-KZ',  // Kazakhstan
    'UZ': 'uz-UZ',  // Uzbekistan
    'KG': 'ky-KG',  // Kyrgyzstan
    'TJ': 'tg-TJ',  // Tajikistan
    'TM': 'tk-TM',  // Turkmenistan
    'MN': 'mn-MN',  // Mongolia
    'KH': 'km-KH',  // Cambodia
    'LA': 'lo-LA',  // Laos
    'MM': 'my-MM',  // Myanmar
    'BN': 'ms-BN',  // Brunei
    'BT': 'dz-BT',  // Bhutan
    'MV': 'dv-MV',  // Maldives
    'LB': 'ar-LB',  // Lebanon
    'JO': 'ar-JO',  // Jordan
    'KW': 'ar-KW',  // Kuwait
    'BH': 'ar-BH',  // Bahrain
    'QA': 'ar-QA',  // Qatar
    'SA': 'ar-SA',  // Saudi Arabia
    'OM': 'ar-OM',  // Oman
    'YE': 'ar-YE',  // Yemen
    'IQ': 'ar-IQ',  // Iraq
    'IR': 'fa-IR',  // Iran
    'AM': 'hy-AM',  // Armenia
    'AZ': 'az-AZ',  // Azerbaijan
    'GE': 'ka-GE',  // Georgia
    'MD': 'ro-MD',  // Moldova
    'BY': 'be-BY',  // Belarus
    'LT': 'lt-LT',  // Lithuania
    'LV': 'lv-LV',  // Latvia
    'EE': 'et-EE',  // Estonia
    'IE': 'en-IE',  // Ireland
    'IS': 'is-IS',  // Iceland
    'LU': 'lb-LU',  // Luxembourg
    'MT': 'mt-MT',  // Malta
    'CY': 'el-CY',  // Cyprus
    'GR': 'el-GR',  // Greece
    'PT': 'pt-PT',  // Portugal
    'SK': 'sk-SK',  // Slovakia
    'SI': 'sl-SI',  // Slovenia
    'AL': 'sq-AL',  // Albania
    'MK': 'mk-MK',  // North Macedonia
    'ME': 'sr-ME',  // Montenegro
    'BA': 'bs-BA',  // Bosnia and Herzegovina
    'XK': 'sq-XK',  // Kosovo
    'JP': 'ja-JP',  // Japan
    'KR': 'ko-KR',  // South Korea
    'CN': 'zh-CN',  // China
    'TW': 'zh-TW',  // Taiwan
    'HK': 'zh-HK',  // Hong Kong
    'MO': 'zh-MO',  // Macau
    'TH': 'th-TH',  // Thailand
    'MY': 'ms-MY',  // Malaysia
    'PH': 'en-PH',  // Philippines
    'ID': 'id-ID',  // Indonesia
    'VN': 'vi-VN',  // Vietnam
    'NZ': 'en-NZ'   // New Zealand
  };
  
  const locale = locales[country] || 'en-US';
  
  try {
    return new Intl.NumberFormat(locale).format(amount);
    } catch {
    // Fallback to simple formatting
    return amount.toLocaleString();
  }
}

// Get currency symbol for a given currency code
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || '$';
}

// Get currency code based on country
export function getCurrencyForCountry(country: string): string {
  const currencyMap: Record<string, string> = {
    'IN': 'INR',  // India
    'US': 'USD',  // United States
    'GB': 'GBP',  // United Kingdom
    'AE': 'AED',  // UAE
    'CA': 'CAD',  // Canada
    'AU': 'AUD',  // Australia
    'SG': 'SGD',  // Singapore
    'DE': 'EUR',  // Germany
    'FR': 'EUR',  // France
    'IT': 'EUR',  // Italy
    'ES': 'EUR',  // Spain
    'NL': 'EUR',  // Netherlands
    'BE': 'EUR',  // Belgium
    'CH': 'CHF',  // Switzerland
    'AT': 'EUR',  // Austria
    'SE': 'SEK',  // Sweden
    'NO': 'NOK',  // Norway
    'DK': 'DKK',  // Denmark
    'FI': 'EUR',  // Finland
    'PL': 'PLN',  // Poland
    'CZ': 'CZK',  // Czech Republic
    'HU': 'HUF',  // Hungary
    'RO': 'RON',  // Romania
    'BG': 'BGN',  // Bulgaria
    'HR': 'HRK',  // Croatia
    'RS': 'RSD',  // Serbia
    'UA': 'UAH',  // Ukraine
    'RU': 'RUB',  // Russia
    'TR': 'TRY',  // Turkey
    'IL': 'ILS',  // Israel
    'EG': 'EGP',  // Egypt
    'ZA': 'ZAR',  // South Africa
    'NG': 'NGN',  // Nigeria
    'KE': 'KES',  // Kenya
    'GH': 'GHS',  // Ghana
    'MA': 'MAD',  // Morocco
    'TN': 'TND',  // Tunisia
    'BR': 'BRL',  // Brazil
    'AR': 'ARS',  // Argentina
    'CL': 'CLP',  // Chile
    'CO': 'COP',  // Colombia
    'PE': 'PEN',  // Peru
    'UY': 'UYU',  // Uruguay
    'MX': 'MXN',  // Mexico
    'VE': 'VES',  // Venezuela
    'GT': 'GTQ',  // Guatemala
    'HN': 'HNL',  // Honduras
    'NI': 'NIO',  // Nicaragua
    'CR': 'CRC',  // Costa Rica
    'PA': 'PAB',  // Panama
    'DO': 'DOP',  // Dominican Republic
    'JM': 'JMD',  // Jamaica
    'TT': 'TTD',  // Trinidad and Tobago
    'BB': 'BBD',  // Barbados
    'AG': 'XCD',  // Antigua and Barbuda
    'BS': 'BSD',  // Bahamas
    'BZ': 'BZD',  // Belize
    'DM': 'XCD',  // Dominica
    'GD': 'XCD',  // Grenada
    'KN': 'XCD',  // Saint Kitts and Nevis
    'LC': 'XCD',  // Saint Lucia
    'VC': 'XCD',  // Saint Vincent and the Grenadines
    'SR': 'SRD',  // Suriname
    'GY': 'GYD',  // Guyana
    'FJ': 'FJD',  // Fiji
    'PG': 'PGK',  // Papua New Guinea
    'SB': 'SBD',  // Solomon Islands
    'TO': 'TOP',  // Tonga
    'VU': 'VUV',  // Vanuatu
    'WS': 'WST',  // Samoa
    'NP': 'NPR',  // Nepal
    'PK': 'PKR',  // Pakistan
    'LK': 'LKR',  // Sri Lanka
    'BD': 'BDT',  // Bangladesh
    'AF': 'AFN',  // Afghanistan
    'KZ': 'KZT',  // Kazakhstan
    'UZ': 'UZS',  // Uzbekistan
    'KG': 'KGS',  // Kyrgyzstan
    'TJ': 'TJS',  // Tajikistan
    'TM': 'TMT',  // Turkmenistan
    'MN': 'MNT',  // Mongolia
    'KH': 'KHR',  // Cambodia
    'LA': 'LAK',  // Laos
    'MM': 'MMK',  // Myanmar
    'BN': 'BND',  // Brunei
    'BT': 'BTN',  // Bhutan
    'MV': 'MVR',  // Maldives
    'LB': 'LBP',  // Lebanon
    'JO': 'JOD',  // Jordan
    'KW': 'KWD',  // Kuwait
    'BH': 'BHD',  // Bahrain
    'QA': 'QAR',  // Qatar
    'SA': 'SAR',  // Saudi Arabia
    'OM': 'OMR',  // Oman
    'YE': 'YER',  // Yemen
    'IQ': 'IQD',  // Iraq
    'IR': 'IRR',  // Iran
    'AM': 'AMD',  // Armenia
    'AZ': 'AZN',  // Azerbaijan
    'GE': 'GEL',  // Georgia
    'MD': 'MDL',  // Moldova
    'BY': 'BYN',  // Belarus
    'LT': 'EUR',  // Lithuania
    'LV': 'EUR',  // Latvia
    'EE': 'EUR',  // Estonia
    'IE': 'EUR',  // Ireland
    'IS': 'ISK',  // Iceland
    'LU': 'EUR',  // Luxembourg
    'MT': 'EUR',  // Malta
    'CY': 'EUR',  // Cyprus
    'GR': 'EUR',  // Greece
    'PT': 'EUR',  // Portugal
    'SK': 'EUR',  // Slovakia
    'SI': 'EUR',  // Slovenia
    'AL': 'ALL',  // Albania
    'MK': 'MKD',  // North Macedonia
    'ME': 'EUR',  // Montenegro
    'BA': 'BAM',  // Bosnia and Herzegovina
    'XK': 'EUR',  // Kosovo
    'JP': 'JPY',  // Japan
    'KR': 'KRW',  // South Korea
    'CN': 'CNY',  // China
    'TW': 'TWD',  // Taiwan
    'HK': 'HKD',  // Hong Kong
    'MO': 'MOP',  // Macau
    'TH': 'THB',  // Thailand
    'MY': 'MYR',  // Malaysia
    'PH': 'PHP',  // Philippines
    'ID': 'IDR',  // Indonesia
    'VN': 'VND',  // Vietnam
    'NZ': 'NZD'   // New Zealand
  };
  
  return currencyMap[country] || 'INR';
}

// Format salary for display in job cards
export function formatJobSalary(
  job: {
    salary?: string | number | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryCurrency?: string | null;
    country?: string;
    source?: string | null;
    isExternal?: boolean;
  }
): string {
  const { salary, salaryMin, salaryMax, salaryCurrency, country, source, isExternal } = job;

  const normalizeCountryCode = (c?: string | null): string => {
    if (!c) return 'IN';
    const s = String(c).trim();
    if (!s) return 'IN';
    if (s.length === 2) return s.toUpperCase();
    const lower = s.toLowerCase();
    if (lower === 'india') return 'IN';
    if (lower === 'united states' || lower === 'united states of america' || lower === 'usa') return 'US';
    if (lower === 'united kingdom' || lower === 'uk') return 'GB';
    if (lower === 'uae' || lower.includes('united arab emirates')) return 'AE';
    return s.toUpperCase().slice(0, 2);
  };

  const normalizeCurrencyCode = (cur?: string | null, countryCode?: string): string | null => {
    if (!cur) return null;
    const raw = String(cur).trim();
    if (!raw) return null;
    const upper = raw.toUpperCase();

    // Already a known ISO code in our mapping
    if (CURRENCY_SYMBOLS[upper]) return upper;

    // Common symbols -> best-effort mapping (use country to disambiguate '$')
    const symbolMap: Record<string, string> = {
      '₹': 'INR',
      'RS': 'INR',
      '₨': countryCode === 'PK' ? 'PKR' : countryCode === 'LK' ? 'LKR' : 'INR',
      '£': 'GBP',
      '€': 'EUR',
      '¥': countryCode === 'JP' ? 'JPY' : 'CNY',
      '₩': 'KRW',
      '₦': 'NGN',
      '₱': 'PHP',
      'R$': 'BRL',
      'AED': 'AED',
      'د.إ': 'AED',
      '$': countryCode === 'CA' ? 'CAD' : countryCode === 'AU' ? 'AUD' : countryCode === 'NZ' ? 'NZD' : 'USD',
    };
    if (symbolMap[raw]) return symbolMap[raw];
    if (symbolMap[upper]) return symbolMap[upper];

    return null;
  };

  const hasExplicitCurrencyInSalaryString = (s?: string | number | null): boolean => {
    if (!s || typeof s !== 'string') return false;
    const text = s.toUpperCase();
    // If salary string contains any explicit currency code/symbol, treat it as authoritative
    return (
      /(\bINR\b|\bUSD\b|\bEUR\b|\bGBP\b|\bAED\b|\bCAD\b|\bAUD\b|\bSGD\b|\bNZD\b|\bJPY\b|\bCNY\b|\bKRW\b|\bPHP\b|\bNGN\b)/.test(text) ||
      /[₹$£€¥₩₦₱]/.test(text) ||
      /د\.إ/.test(text)
    );
  };

  const countryCode = normalizeCountryCode(country);
  const countryDefaultCurrency = getCurrencyForCountry(countryCode);
  let currency = normalizeCurrencyCode(salaryCurrency, countryCode) || countryDefaultCurrency;

  // Guardrail: Many external sources default salary currency to USD even for non‑US jobs.
  // If we don't see explicit currency in the salary text, prefer the country's currency.
  if (
    currency === 'USD' &&
    countryDefaultCurrency !== 'USD' &&
    !hasExplicitCurrencyInSalaryString(salary) &&
    (isExternal === true || (source && source !== 'manual' && source !== 'sample'))
  ) {
    currency = countryDefaultCurrency;
  }
  
  // If we have a formatted salary string, try to parse it and format with proper currency
  if (salary && typeof salary === 'string') {
    // Check if it's a range (contains dash)
    if (salary.includes('-')) {
      const [minStr, maxStr] = salary.split('-');
      const min = parseFloat(minStr.trim());
      const max = parseFloat(maxStr.trim());
      if (!isNaN(min) && !isNaN(max)) {
        return formatSalaryRange(min, max, currency, countryCode);
      }
    }
    // If it's a single number string
    const numSalary = parseFloat(salary);
    if (!isNaN(numSalary)) {
      return formatSingleSalary(numSalary, currency, countryCode);
    }
    // If we can't parse it, return as-is
    return salary;
  }
  
  // If we have min and max, format as range
  if (salaryMin && salaryMax) {
    return formatSalaryRange(salaryMin, salaryMax, currency, countryCode);
  }
  
  // If we have just min or max, format as single value
  if (salaryMin || salaryMax) {
    const amount = salaryMin || salaryMax || 0;
    return formatSingleSalary(amount, currency, countryCode);
  }
  
  // If we have a numeric salary, format it
  if (salary && (typeof salary === 'number' || !isNaN(Number(salary)))) {
    return formatSingleSalary(Number(salary), currency, countryCode);
  }
  
  return 'Salary not specified';
}