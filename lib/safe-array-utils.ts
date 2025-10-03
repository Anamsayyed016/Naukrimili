// Safe array utilities
export function safeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

export function safeArrayLength(value: unknown): number {
  return safeArray(value).length;
}

export function safeArrayFirst<T>(value: unknown): T | undefined {
  const arr = safeArray<T>(value);
  return arr.length > 0 ? arr[0] : undefined;
}

export function safeArrayLast<T>(value: unknown): T | undefined {
  const arr = safeArray<T>(value);
  return arr.length > 0 ? arr[arr.length - 1] : undefined;
}