import crypto from 'crypto';
import { authenticator } from 'otplib';

// Store 2FA secrets (in production, use database)
const twoFactorStore = new Map<string, { secret: string; backupCodes: string[]; enabled: boolean }>();

export function generateTwoFactorSecret(userId: string): { secret: string; qrCode: string } {
  const secret = authenticator.generateSecret();
  const qrCode = authenticator.keyuri(userId, 'JobPortal', secret);
  
  twoFactorStore.set(userId, {
    secret,
    backupCodes: generateBackupCodes(),
    enabled: false
  });
  
  return { secret, qrCode }}

export function enableTwoFactor(userId: string, token: string): boolean {
  const userTwoFactor = twoFactorStore.get(userId);
  if (!userTwoFactor) return false;
  
  const isValid = authenticator.verify({ token, secret: userTwoFactor.secret });
  if (isValid) {
    userTwoFactor.enabled = true;
    return true}
  return false}

export function verifyTwoFactorToken(userId: string, token: string): boolean {
  const userTwoFactor = twoFactorStore.get(userId);
  if (!userTwoFactor?.enabled) return true; // 2FA not enabled
  
  // Check TOTP token
  if (authenticator.verify({ token, secret: userTwoFactor.secret })) {
    return true}
  
  // Check backup codes
  const codeIndex = userTwoFactor.backupCodes.indexOf(token);
  if (codeIndex !== -1) {
    userTwoFactor.backupCodes.splice(codeIndex, 1); // Use backup code once
    return true}
  
  return false}

export function disableTwoFactor(userId: string): void {
  twoFactorStore.delete(userId)}

function generateBackupCodes(): string[] {
  return Array.from({ length: 10 }, () => 
    crypto.randomBytes(4).toString('hex').toUpperCase())}