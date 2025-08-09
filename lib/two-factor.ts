import crypto from 'crypto';
import { authenticator } from 'otplib';

// In-memory store (replace with DB in production)
type TwoFARecord = { secret: string; backupCodes: string[]; enabled: boolean };
const twoFactorStore = new Map<string, TwoFARecord>();

export function generateTwoFactorSecret(userId: string): { secret: string; qrCode: string } {
  const secret = authenticator.generateSecret();
  const qrCode = authenticator.keyuri(userId, 'JobPortal', secret);
  twoFactorStore.set(userId, { secret, backupCodes: generateBackupCodes(), enabled: false });
  return { secret, qrCode };
}

export function enableTwoFactor(userId: string, token: string): boolean {
  const userTwoFactor = twoFactorStore.get(userId);
  if (!userTwoFactor) return false;
  const isValid = authenticator.verify({ token, secret: userTwoFactor.secret });
  if (isValid) {
    userTwoFactor.enabled = true;
    return true;
  }
  return false;
}

export function verifyTwoFactorToken(userId: string, token: string): boolean {
  const userTwoFactor = twoFactorStore.get(userId);
  if (!userTwoFactor?.enabled) return true; // Not enabled → allow
  if (authenticator.verify({ token, secret: userTwoFactor.secret })) return true;
  const idx = userTwoFactor.backupCodes.indexOf(token);
  if (idx !== -1) {
    userTwoFactor.backupCodes.splice(idx, 1);
    return true;
  }
  return false;
}

export function disableTwoFactor(userId: string): void {
  twoFactorStore.delete(userId);
}

function generateBackupCodes(): string[] {
  return Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
}