/**
 * Safe array utilities to prevent "Cannot read properties of undefined (reading 'length')" errors
 */

/**
 * Safely get the length of an array or array-like object
 * @param value - The value to check
 * @returns The length if it's an array, 0 otherwise
 */
export function safeLength(value: any): number {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value && typeof value === 'object' && typeof value.length === 'number') {
    return value.length;
  }
  return 0;
}

/**
 * Safely check if an array has items
 * @param value - The value to check
 * @returns True if it's an array with items, false otherwise
 */
export function hasItems(value: any): boolean {
  return safeLength(value) > 0;
}

/**
 * Safely get an array with fallback
 * @param value - The value to check
 * @param fallback - The fallback array (default: [])
 * @returns The array or fallback
 */
export function safeArray<T>(value: any, fallback: T[] = []): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return fallback;
}

/**
 * Safely filter an array
 * @param value - The value to filter
 * @param predicate - The filter function
 * @returns Filtered array or empty array
 */
export function safeFilter<T>(
  value: any,
  predicate: (item: T, index: number) => boolean
): T[] {
  const array = safeArray(value);
  return array.filter(predicate);
}

/**
 * Safely map an array
 * @param value - The value to map
 * @param mapper - The map function
 * @returns Mapped array or empty array
 */
export function safeMap<T, U>(
  value: any,
  mapper: (item: T, index: number) => U
): U[] {
  const array = safeArray(value);
  return array.map(mapper);
}

/**
 * Safely access array index
 * @param value - The array
 * @param index - The index to access
 * @param fallback - The fallback value
 * @returns The item at index or fallback
 */
export function safeGet<T>(value: any, index: number, fallback: T): T {
  const array = safeArray(value);
  return array[index] ?? fallback;
}

/**
 * Safely slice an array
 * @param value - The array to slice
 * @param start - Start index
 * @param end - End index
 * @returns Sliced array or empty array
 */
export function safeSlice<T>(value: any, start?: number, end?: number): T[] {
  const array = safeArray(value);
  return array.slice(start, end);
}
