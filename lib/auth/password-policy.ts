import { z } from 'zod';

/** Minimum length for registration passwords (8–12+ recommended) */
export const PASSWORD_MIN_LENGTH = 8;

export type PasswordStrengthLabel = 'weak' | 'medium' | 'strong';

export type PasswordRuleKey =
  | 'length'
  | 'uppercase'
  | 'lowercase'
  | 'number'
  | 'special';

export type PasswordRuleStatus = {
  key: PasswordRuleKey;
  label: string;
  met: boolean;
};

const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

export function getPasswordRules(password: string): PasswordRuleStatus[] {
  return [
    { key: 'length', label: `At least ${PASSWORD_MIN_LENGTH} characters`, met: password.length >= PASSWORD_MIN_LENGTH },
    { key: 'uppercase', label: 'One uppercase letter (A–Z)', met: /[A-Z]/.test(password) },
    { key: 'lowercase', label: 'One lowercase letter (a–z)', met: /[a-z]/.test(password) },
    { key: 'number', label: 'One number (0–9)', met: /[0-9]/.test(password) },
    { key: 'special', label: 'One special symbol (!@#$…)', met: SPECIAL_CHAR_REGEX.test(password) },
  ];
}

export function isPasswordStrongEnough(password: string): boolean {
  return getPasswordRules(password).every((r) => r.met);
}

export function analyzePasswordStrength(password: string): {
  label: PasswordStrengthLabel;
  score: number;
  percent: number;
  rules: PasswordRuleStatus[];
} {
  const rules = getPasswordRules(password);
  const metCount = rules.filter((r) => r.met).length;
  const score = metCount;

  if (!password) {
    return { label: 'weak', score: 0, percent: 0, rules };
  }

  if (metCount < rules.length) {
    return {
      label: 'weak',
      score,
      percent: Math.round((metCount / rules.length) * 40),
      rules,
    };
  }

  if (password.length >= 12) {
    return { label: 'strong', score, percent: 100, rules };
  }

  return { label: 'medium', score, percent: 72, rules };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  const rules = getPasswordRules(password);
  const failed = rules.find((r) => !r.met);
  if (failed) {
    return { valid: false, error: `Password must include: ${failed.label.toLowerCase()}.` };
  }
  return { valid: true };
}

export function validatePasswordMatch(password: string, confirm: string): { valid: boolean; error?: string } {
  if (password !== confirm) {
    return { valid: false, error: 'Passwords do not match.' };
  }
  return { valid: true };
}

/** Shared Zod schema for registration / reset APIs */
export const strongPasswordZodSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(SPECIAL_CHAR_REGEX, 'Password must contain at least one special character');
