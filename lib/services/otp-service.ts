/**
 * OTP Service — Redis-backed active OTP with Prisma audit trail.
 * Purposes: login | register | signup | verify
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getRedisClient, isRedisAvailable, redisUtils } from '@/lib/redis';
import { authDebug } from '@/lib/auth-debug';
import { validateIndianMobile, toE164Indian, maskPhoneNumber } from '@/lib/auth/phone-utils';
import { assertPhoneAvailable, findUserByPhone } from '@/lib/auth/phone-lookup';
import { OTP_CONFIG, getOtpExpirySeconds, isOtpEnabled, isRedisRequiredForOtp } from '@/lib/auth/otp-config';
import { sendOtpSms } from '@/lib/services/msg91-service';
import { otpSocketService } from '@/lib/services/otp-socket-service';
import { linkPhoneToUser } from '@/lib/services/phone-link-service';

export type OtpPurpose = 'login' | 'register' | 'signup' | 'verify';

export interface SendOtpResult {
  success: boolean;
  message: string;
  otpId?: string;
  expiresIn?: number;
  resendAfter?: number;
  maskedPhone?: string;
  error?: string;
  code?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  sessionToken?: string;
  phoneVerificationToken?: string;
  phoneLinked?: boolean;
  isNewUser?: boolean;
  userId?: string;
  attemptsRemaining?: number;
  error?: string;
  code?: string;
}

interface ActiveOtpPayload {
  otpId: string;
  otpHash: string;
  attempts: number;
  maxAttempts: number;
  purpose: OtpPurpose;
  userId?: string;
  createdAt: number;
  expiresAt: number;
}

const memoryStore = new Map<string, { value: string; expiresAt: number }>();
const memoryLocks = new Map<string, number>();

function redisKeyActive(phoneE164: string) {
  return `otp:active:${phoneE164}`;
}
function redisKeyCooldown(phoneE164: string) {
  return `otp:cooldown:${phoneE164}`;
}
function redisKeySendLock(phoneE164: string) {
  return `otp:send-lock:${phoneE164}`;
}
export function redisKeySession(token: string) {
  return `otp:session:${token}`;
}
export function redisKeyPhoneVerified(token: string) {
  return `otp:phone-verified:${token}`;
}

function hashOtp(otp: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'otp-fallback-secret';
  return crypto.createHash('sha256').update(`${otp}:${secret}`).digest('hex');
}

function generateOtpCode(): string {
  const max = 10 ** OTP_CONFIG.length;
  return crypto.randomInt(0, max).toString().padStart(OTP_CONFIG.length, '0');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

async function ensureOtpStoreAvailable(): Promise<{ ok: boolean; message?: string; code?: string }> {
  if (!isRedisRequiredForOtp()) return { ok: true };

  if (!(await isRedisAvailable())) {
    return {
      ok: false,
      message: 'OTP service temporarily unavailable. Please try again shortly.',
      code: 'REDIS_UNAVAILABLE',
    };
  }
  return { ok: true };
}

async function setWithExpiry(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (await isRedisAvailable()) {
    await redisUtils.set(key, value, ttlSeconds);
    return;
  }
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

async function getValue(key: string): Promise<string | null> {
  if (await isRedisAvailable()) {
    return redisUtils.get(key);
  }
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

async function deleteKey(key: string): Promise<void> {
  if (await isRedisAvailable()) {
    await redisUtils.del(key);
    return;
  }
  memoryStore.delete(key);
}

async function acquireSendLock(phoneE164: string): Promise<boolean> {
  if (await isRedisAvailable()) {
    const client = getRedisClient();
    const result = await client.set(
      redisKeySendLock(phoneE164),
      '1',
      'EX',
      OTP_CONFIG.sendLockSeconds,
      'NX'
    );
    return result === 'OK';
  }
  const key = redisKeySendLock(phoneE164);
  const now = Date.now();
  const existing = memoryLocks.get(key);
  if (existing && existing > now) return false;
  memoryLocks.set(key, now + OTP_CONFIG.sendLockSeconds * 1000);
  return true;
}

async function getCooldownRemaining(phoneE164: string): Promise<number> {
  if (await isRedisAvailable()) {
    const ttl = await redisUtils.ttl(redisKeyCooldown(phoneE164));
    return ttl > 0 ? ttl : 0;
  }
  const entry = memoryStore.get(redisKeyCooldown(phoneE164));
  if (!entry) return 0;
  const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

async function invalidatePreviousOtps(phoneE164: string, phone10: string): Promise<void> {
  await deleteKey(redisKeyActive(phoneE164));

  await prisma.otpVerification.updateMany({
    where: {
      phoneNumber: phoneE164,
      isUsed: false,
      isVerified: false,
      expiresAt: { gt: new Date() },
    },
    data: { isUsed: true },
  });

  authDebug('otp-service', 'invalidated previous OTPs', { phone: maskPhoneNumber(phone10) });
}

export async function sendOtp(params: {
  phone: string;
  purpose?: OtpPurpose;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<SendOtpResult> {
  if (!isOtpEnabled()) {
    return { success: false, message: 'OTP authentication is disabled', code: 'OTP_DISABLED' };
  }

  const storeCheck = await ensureOtpStoreAvailable();
  if (!storeCheck.ok) {
    return { success: false, message: storeCheck.message!, code: storeCheck.code };
  }

  const validation = validateIndianMobile(params.phone);
  if (!validation.valid || !validation.mobile) {
    return { success: false, message: validation.error || 'Invalid phone number', code: 'INVALID_PHONE' };
  }

  const mobile10 = validation.mobile;
  const phoneE164 = toE164Indian(mobile10);
  const purpose = params.purpose || 'login';

  const cooldown = await getCooldownRemaining(phoneE164);
  if (cooldown > 0) {
    return {
      success: false,
      message: `Please wait ${cooldown} seconds before requesting a new OTP`,
      resendAfter: cooldown,
      code: 'COOLDOWN',
    };
  }

  const lockAcquired = await acquireSendLock(phoneE164);
  if (!lockAcquired) {
    return {
      success: false,
      message: 'OTP request already in progress. Please wait.',
      code: 'DUPLICATE_REQUEST',
    };
  }

  try {
    if (purpose === 'register' || purpose === 'signup') {
      const availability = await assertPhoneAvailable(phoneE164);
      if (!availability.available) {
        return {
          success: false,
          message:
            purpose === 'signup'
              ? 'This mobile number is already registered. Please sign in instead.'
              : availability.error || 'Phone already registered',
          code: 'PHONE_EXISTS',
        };
      }
    }

    if (purpose === 'login') {
      const user = await findUserByPhone(phoneE164);
      if (!user) {
        return {
          success: false,
          message: 'No account found with this mobile number. Please register first.',
          code: 'USER_NOT_FOUND',
        };
      }
      if (!user.isActive) {
        return { success: false, message: 'Account is inactive. Contact support.', code: 'INACTIVE' };
      }
    }

    if (purpose === 'verify') {
      if (!params.userId) {
        return { success: false, message: 'Authentication required', code: 'UNAUTHORIZED' };
      }
      const availability = await assertPhoneAvailable(phoneE164, params.userId);
      if (!availability.available) {
        return {
          success: false,
          message: availability.error || 'Phone number unavailable',
          code: 'PHONE_TAKEN',
        };
      }
    }

    await invalidatePreviousOtps(phoneE164, mobile10);

    const otpCode = generateOtpCode();
    const otpHash = hashOtp(otpCode);
    const expiresIn = getOtpExpirySeconds();
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const otpRecord = await prisma.otpVerification.create({
      data: {
        userId: params.userId,
        phoneNumber: phoneE164,
        otpCode: otpHash,
        otpType: purpose,
        purpose,
        expiresAt,
        maxAttempts: OTP_CONFIG.maxAttempts,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });

    const activePayload: ActiveOtpPayload = {
      otpId: otpRecord.id,
      otpHash,
      attempts: 0,
      maxAttempts: OTP_CONFIG.maxAttempts,
      purpose,
      userId: params.userId,
      createdAt: Date.now(),
      expiresAt: expiresAt.getTime(),
    };

    await setWithExpiry(redisKeyActive(phoneE164), JSON.stringify(activePayload), expiresIn);

    const smsResult = await sendOtpSms(mobile10, otpCode);

    if (!smsResult.success) {
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { isUsed: true, metadata: { smsError: smsResult.error, msg91: smsResult.rawResponse } },
      });
      await deleteKey(redisKeyActive(phoneE164));
      await deleteKey(redisKeyCooldown(phoneE164));
      return {
        success: false,
        message: smsResult.error || 'Failed to send OTP. Please try again.',
        code: 'SMS_FAILED',
      };
    }

    await setWithExpiry(redisKeyCooldown(phoneE164), '1', OTP_CONFIG.resendCooldownSeconds);

    if (params.userId) {
      await otpSocketService.notifyOTPSent(params.userId, phoneE164, otpRecord.id);
    }

    authDebug('otp-service', 'OTP sent', {
      phone: maskPhoneNumber(mobile10),
      purpose,
      otpId: otpRecord.id,
      simulated: smsResult.simulated,
    });

    return {
      success: true,
      message: `OTP sent to ${maskPhoneNumber(mobile10)}`,
      otpId: otpRecord.id,
      expiresIn,
      resendAfter: OTP_CONFIG.resendCooldownSeconds,
      maskedPhone: maskPhoneNumber(mobile10),
    };
  } finally {
    // send lock expires via TTL
  }
}

async function handleValidOtp(
  active: ActiveOtpPayload,
  phoneE164: string,
  mobile10: string,
  purpose: OtpPurpose,
  name?: string
): Promise<VerifyOtpResult> {
  await deleteKey(redisKeyActive(phoneE164));

  await prisma.otpVerification.update({
    where: { id: active.otpId },
    data: { isUsed: true, isVerified: true, verifiedAt: new Date() },
  });

  if (purpose === 'verify' && active.userId) {
    const linkResult = await linkPhoneToUser(active.userId, mobile10, active.otpId);
    if (!linkResult.success) {
      return {
        success: false,
        message: linkResult.message,
        code: linkResult.code || 'LINK_FAILED',
      };
    }

    return {
      success: true,
      message: linkResult.message,
      phoneLinked: true,
      userId: active.userId,
    };
  }

  if (purpose === 'signup') {
    const phoneVerificationToken = generateToken();
    await setWithExpiry(
      redisKeyPhoneVerified(phoneVerificationToken),
      JSON.stringify({ phone: phoneE164, verifiedAt: Date.now() }),
      OTP_CONFIG.phoneVerificationTokenTtlSeconds
    );

    authDebug('otp-service', 'signup phone verified', { phone: maskPhoneNumber(mobile10) });

    return {
      success: true,
      message: 'Phone number verified successfully',
      phoneVerificationToken,
    };
  }

  let user = await findUserByPhone(phoneE164);
  let isNewUser = false;

  if (!user && purpose === 'register') {
    const nameParts = (name || 'User').trim().split(/\s+/);
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';
    const placeholderEmail = `${phoneE164}@phone.naukrimili.local`;

    const existingEmail = await prisma.user.findUnique({ where: { email: placeholderEmail } });
    if (existingEmail) {
      return { success: false, message: 'Account already exists for this number.', code: 'DUPLICATE_USER' };
    }

    user = await prisma.user.create({
      data: {
        email: placeholderEmail,
        firstName,
        lastName,
        phone: phoneE164,
        phoneVerified: true,
        role: null,
        isActive: true,
        isVerified: true,
      },
    });
    isNewUser = true;
  } else if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true, phone: phoneE164 },
    });
  } else {
    return {
      success: false,
      message: 'No account found. Please register with this mobile number.',
      code: 'USER_NOT_FOUND',
    };
  }

  const sessionToken = generateToken();
  await setWithExpiry(
    redisKeySession(sessionToken),
    JSON.stringify({ phone: phoneE164, userId: user.id, purpose }),
    OTP_CONFIG.sessionTokenTtlSeconds
  );

  await otpSocketService.notifyOTPVerified(user.id, phoneE164, active.otpId);
  authDebug('otp-service', 'OTP verified', { userId: user.id, isNewUser, purpose });

  return {
    success: true,
    message: isNewUser ? 'Account created successfully' : 'OTP verified successfully',
    sessionToken,
    isNewUser,
    userId: user.id,
  };
}

export async function verifyOtp(params: {
  phone: string;
  otp: string;
  purpose?: OtpPurpose;
  name?: string;
  userId?: string;
}): Promise<VerifyOtpResult> {
  const storeCheck = await ensureOtpStoreAvailable();
  if (!storeCheck.ok) {
    return { success: false, message: storeCheck.message!, code: storeCheck.code };
  }

  const validation = validateIndianMobile(params.phone);
  if (!validation.valid || !validation.mobile) {
    return { success: false, message: validation.error || 'Invalid phone number', code: 'INVALID_PHONE' };
  }

  const mobile10 = validation.mobile;
  const phoneE164 = toE164Indian(mobile10);
  const purpose = params.purpose || 'login';
  const submittedHash = hashOtp(params.otp.trim());

  if (purpose === 'verify' && params.userId) {
    // ensure session user matches OTP owner intent
  }

  const activeRaw = await getValue(redisKeyActive(phoneE164));
  if (!activeRaw) {
    return {
      success: false,
      message: 'OTP expired or not found. Please request a new one.',
      code: 'OTP_EXPIRED',
    };
  }

  let active: ActiveOtpPayload;
  try {
    active = JSON.parse(activeRaw) as ActiveOtpPayload;
  } catch {
    await deleteKey(redisKeyActive(phoneE164));
    return { success: false, message: 'Invalid OTP session. Please request a new OTP.', code: 'INVALID_SESSION' };
  }

  if (Date.now() > active.expiresAt) {
    await deleteKey(redisKeyActive(phoneE164));
    await prisma.otpVerification.update({ where: { id: active.otpId }, data: { isUsed: true } });
    return { success: false, message: 'OTP has expired. Please request a new one.', code: 'OTP_EXPIRED' };
  }

  if (active.purpose !== purpose) {
    return { success: false, message: 'OTP purpose mismatch.', code: 'PURPOSE_MISMATCH' };
  }

  if (purpose === 'verify' && params.userId && active.userId !== params.userId) {
    return { success: false, message: 'Verification session mismatch.', code: 'SESSION_MISMATCH' };
  }

  if (active.otpHash !== submittedHash) {
    active.attempts += 1;
    const attemptsRemaining = active.maxAttempts - active.attempts;

    await prisma.otpVerification.update({
      where: { id: active.otpId },
      data: { attempts: active.attempts },
    });

    if (active.attempts >= active.maxAttempts) {
      await deleteKey(redisKeyActive(phoneE164));
      await prisma.otpVerification.update({ where: { id: active.otpId }, data: { isUsed: true } });

      if (active.userId) {
        await otpSocketService.notifyOTPFailed(active.userId, phoneE164, 'Max attempts exceeded', 0);
      }

      return {
        success: false,
        message: 'Maximum attempts exceeded. Please request a new OTP.',
        attemptsRemaining: 0,
        code: 'MAX_ATTEMPTS',
      };
    }

    await setWithExpiry(
      redisKeyActive(phoneE164),
      JSON.stringify(active),
      Math.ceil((active.expiresAt - Date.now()) / 1000)
    );

    if (active.userId) {
      await otpSocketService.notifyOTPFailed(active.userId, phoneE164, 'Invalid OTP', attemptsRemaining);
    }

    return {
      success: false,
      message: `Invalid OTP. ${attemptsRemaining} attempt(s) remaining.`,
      attemptsRemaining,
      code: 'INVALID_OTP',
    };
  }

  return handleValidOtp(active, phoneE164, mobile10, purpose, params.name);
}

/** Consumes one-time session token for NextAuth phone-otp provider */
export async function consumeOtpSessionToken(
  sessionToken: string,
  phone: string
): Promise<{ userId: string; phone: string } | null> {
  const validation = validateIndianMobile(phone);
  if (!validation.valid || !validation.mobile) return null;

  const phoneE164 = toE164Indian(validation.mobile);
  const raw = await getValue(redisKeySession(sessionToken));
  if (!raw) return null;

  await deleteKey(redisKeySession(sessionToken));

  try {
    const payload = JSON.parse(raw) as { phone: string; userId: string };
    if (payload.phone !== phoneE164) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Validates signup phone verification token for registration APIs */
export async function consumePhoneVerificationToken(
  token: string,
  phone: string
): Promise<{ phone: string } | null> {
  const validation = validateIndianMobile(phone);
  if (!validation.valid || !validation.mobile) return null;

  const phoneE164 = toE164Indian(validation.mobile);
  const raw = await getValue(redisKeyPhoneVerified(token));
  if (!raw) return null;

  await deleteKey(redisKeyPhoneVerified(token));

  try {
    const payload = JSON.parse(raw) as { phone: string };
    if (payload.phone !== phoneE164) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getResendCooldown(phone: string): Promise<number> {
  const validation = validateIndianMobile(phone);
  if (!validation.valid || !validation.mobile) return 0;
  return getCooldownRemaining(toE164Indian(validation.mobile));
}
