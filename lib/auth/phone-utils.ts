/**
 * Indian mobile number normalization and validation.
 */

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

/** Strip non-digits and normalize to 10-digit Indian mobile or null */
export function normalizeIndianMobile(input: string): string | null {
  const digits = input.replace(/\D/g, '');

  if (digits.length === 10 && INDIAN_MOBILE_REGEX.test(digits)) {
    return digits;
  }

  if (digits.length === 12 && digits.startsWith('91') && INDIAN_MOBILE_REGEX.test(digits.slice(2))) {
    return digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith('0') && INDIAN_MOBILE_REGEX.test(digits.slice(1))) {
    return digits.slice(1);
  }

  return null;
}

/** E.164-style storage key: 91XXXXXXXXXX */
export function toE164Indian(mobile10: string): string {
  return `91${mobile10}`;
}

/** Display format: +91 XXXXX XXXXX */
export function formatIndianPhone(mobile10: string): string {
  return `+91 ${mobile10.slice(0, 5)} ${mobile10.slice(5)}`;
}

export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const last4 = digits.slice(-4);
    return `******${last4}`;
  }
  return phone;
}

export function validateIndianMobile(input: string): { valid: boolean; mobile: string | null; error?: string } {
  const mobile = normalizeIndianMobile(input);
  if (!mobile) {
    return { valid: false, mobile: null, error: 'Enter a valid 10-digit Indian mobile number' };
  }
  return { valid: true, mobile };
}
