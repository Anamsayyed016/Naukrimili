import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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
  if (text.length <= maxLength) return text;
  return `${text.substring(0, Math.max(0, maxLength))}...`;
}

// Email validation utility
export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email || ''));
}

// Password validation utility
export function isValidPassword(password: string) {
  return String(password || '').length >= 6;
}
