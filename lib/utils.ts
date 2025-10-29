import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { safeLength } from "./safe-array-utils"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utility
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}

// Currency formatting utility
export function formatCurrency(amount: number, currency = '₹') {
  return `${currency}${Number(amount || 0).toLocaleString()}`;
}

// Text truncation utility
export function truncateText(text: string, maxLength: number) {
  if (typeof text !== 'string') return '';
  if (safeLength(text) <= maxLength) return text;
  return `${text.substring(0, Math.max(0, maxLength))}...`;
}

// Email validation utility
export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email || ''));
}

// Password validation utility
export function isValidPassword(password: string) {
  return safeLength(String(password || '')) >= 6;
}

// Z-index constants - centralized to avoid conflicts
// Usage: className={`z-[${Z_INDEX.DROPDOWN_CONTENT}]`} or style={{ zIndex: Z_INDEX.DROPDOWN_CONTENT }}
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 50,
  STICKY: 50,
  BACKDROP: 9997,
  MODAL_BACKDROP: 9998,
  DROPDOWN_CONTENT: 9998,
  TOP_LEVEL_DROPDOWN: 9999,
  NOTIFICATION: 9999,
  MODAL: 10000,
} as const;
