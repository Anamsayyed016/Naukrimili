/**
 * Phone lookup helpers — normalized variants and duplicate prevention.
 */

import { prisma } from '@/lib/prisma';
import { toE164Indian, validateIndianMobile } from '@/lib/auth/phone-utils';

/** All common stored formats for a 10-digit Indian mobile */
export function phoneLookupVariants(input: string): string[] {
  const validation = validateIndianMobile(input);
  if (!validation.valid || !validation.mobile) return [];

  const mobile10 = validation.mobile;
  const e164 = toE164Indian(mobile10);
  return [
    ...new Set([
      e164,
      mobile10,
      `+${e164}`,
      `+91${mobile10}`,
      `+91 ${mobile10}`,
      `+91 ${mobile10.slice(0, 5)} ${mobile10.slice(5)}`,
      `0${mobile10}`,
    ]),
  ];
}

export async function findUserByPhone(phone: string) {
  const variants = phoneLookupVariants(phone);
  if (variants.length === 0) return null;

  return prisma.user.findFirst({
    where: { phone: { in: variants } },
  });
}

export async function assertPhoneAvailable(
  phone: string,
  excludeUserId?: string
): Promise<{ available: boolean; error?: string; normalized?: string }> {
  const validation = validateIndianMobile(phone);
  if (!validation.valid || !validation.mobile) {
    return { available: false, error: validation.error || 'Invalid phone number' };
  }

  const normalized = toE164Indian(validation.mobile);
  const variants = phoneLookupVariants(validation.mobile);

  const existing = await prisma.user.findFirst({
    where: {
      phone: { in: variants },
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
  });

  if (existing) {
    return {
      available: false,
      error: 'This mobile number is already linked to another account.',
    };
  }

  return { available: true, normalized };
}

export function normalizePhoneForStorage(phone: string): string | null {
  const validation = validateIndianMobile(phone);
  if (!validation.valid || !validation.mobile) return null;
  return toE164Indian(validation.mobile);
}
