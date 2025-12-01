// Simple utilities: dates, currency, text, validation, storage, and HTTP.

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}

export function formatCurrency(amount: number, currency = '₹') {
  return `${currency}${Number(amount || 0).toLocaleString()}`;
}

export function truncateText(text: string, maxLength: number) {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, Math.max(0, maxLength))}...`;
}

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email || ''));
}

export function isValidPassword(password: string) {
  return String(password || '').length >= 6;
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import { getBaseUrl } from './url-utils';

export function buildUrl(baseUrl: string, params: Record<string, string | number | undefined>) {
  const canonicalBase = getBaseUrl();
  const url = new URL(baseUrl, canonicalBase);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
}

export const storage = {
  set(key: string, value: unknown) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage error logged
    }
  },
  get<T = unknown>(key: string): T | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch {
      // Storage error logged
      return null;
    }
  },
  remove(key: string) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem(key);
    } catch {
      // Storage error logged
    }
  },
};

export async function apiCall<T = unknown>(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return (await response.json()) as T;
}
