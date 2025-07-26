import crypto from 'crypto';
import { env } from './env';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Secure key derivation with random salt
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.scryptSync(password, salt, KEY_LENGTH);
}

export function encrypt(text: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(env.NEXTAUTH_SECRET, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const aad = Buffer.from('jobportal-v1', 'utf8');
  cipher.setAAD(aad);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return salt.toString('hex') + ':' + iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');
  
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }
  
  const salt = Buffer.from(parts[0], 'hex');
  const iv = Buffer.from(parts[1], 'hex');
  const tag = Buffer.from(parts[2], 'hex');
  const encrypted = parts[3];
  
  const key = deriveKey(env.NEXTAUTH_SECRET, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  const aad = Buffer.from('jobportal-v1', 'utf8');
  decipher.setAAD(aad);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Secure comparison to prevent timing attacks
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }
  
  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const middle = '*'.repeat(data.length - visibleChars * 2);
  
  return start + middle + end;
}

// PII encryption for database storage
export function encryptPII(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = ['email', 'phone', 'address', 'ssn', 'taxId'];
  const encrypted = { ...data };
  
  for (const field of sensitiveFields) {
    if (encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }
  
  return encrypted;
}

export function decryptPII(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = ['email', 'phone', 'address', 'ssn', 'taxId'];
  const decrypted = { ...data };
  
  for (const field of sensitiveFields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch {
        // Field might not be encrypted
      }
    }
  }
  
  return decrypted;
}