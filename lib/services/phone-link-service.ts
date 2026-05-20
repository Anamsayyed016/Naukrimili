/**
 * Phone linking — attach verified mobile to authenticated user accounts.
 */

import { prisma } from '@/lib/prisma';
import { assertPhoneAvailable, normalizePhoneForStorage } from '@/lib/auth/phone-lookup';
import { authDebug } from '@/lib/auth-debug';
import { maskPhoneNumber } from '@/lib/auth/phone-utils';
import { otpSocketService } from '@/lib/services/otp-socket-service';

export interface LinkPhoneResult {
  success: boolean;
  message: string;
  phone?: string;
  error?: string;
  code?: string;
}

export async function linkPhoneToUser(
  userId: string,
  phone: string,
  otpId?: string
): Promise<LinkPhoneResult> {
  const availability = await assertPhoneAvailable(phone, userId);
  if (!availability.available || !availability.normalized) {
    return {
      success: false,
      message: availability.error || 'Phone number unavailable',
      code: 'PHONE_TAKEN',
    };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      phone: availability.normalized,
      phoneVerified: true,
    },
  });

  await otpSocketService.notifyOTPVerified(userId, availability.normalized, otpId || 'link');

  authDebug('phone-link', 'phone linked', {
    userId,
    phone: maskPhoneNumber(availability.normalized),
  });

  return {
    success: true,
    message: 'Mobile number linked successfully',
    phone: availability.normalized,
  };
}

export async function validatePhoneForRegistration(phone: string): Promise<LinkPhoneResult> {
  const normalized = normalizePhoneForStorage(phone);
  if (!normalized) {
    return { success: false, message: 'Invalid phone number', code: 'INVALID_PHONE' };
  }

  const availability = await assertPhoneAvailable(normalized);
  if (!availability.available) {
    return {
      success: false,
      message: availability.error || 'Phone already registered',
      code: 'PHONE_EXISTS',
    };
  }

  return { success: true, message: 'Phone available', phone: normalized };
}
