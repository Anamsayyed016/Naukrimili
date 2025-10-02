/**
 * Safe array utilities to prevent "Cannot read properties of undefined (reading 'length')" errors
 * Enhanced with additional safety checks and performance optimizations
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
  if (typeof value === 'string') {
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

/**
 * Safely check if a string has content
 * @param value - The string to check
 * @param minLength - Minimum length to consider as "has content"
 * @returns True if string has content, false otherwise
 */
export function hasContent(value: any, minLength: number = 1): boolean {
  if (typeof value === 'string') {
    return value.trim().length >= minLength;
  }
  return false;
}

/**
 * Safely join array elements with a separator
 * @param value - The array to join
 * @param separator - The separator to use
 * @returns Joined string or empty string
 */
export function safeJoin(value: any, separator: string = ', '): string {
  const array = safeArray(value);
  return array.join(separator);
}

/**
 * Safely find an element in an array
 * @param value - The array to search
 * @param predicate - The search function
 * @returns Found element or undefined
 */
export function safeFind<T>(
  value: any,
  predicate: (item: T, index: number) => boolean
): T | undefined {
  const array = safeArray(value);
  return array.find(predicate);
}

/**
 * Safely check if array includes an element
 * @param value - The array to check
 * @param searchElement - The element to search for
 * @returns True if found, false otherwise
 */
export function safeIncludes<T>(value: any, searchElement: T): boolean {
  const array = safeArray(value);
  return array.includes(searchElement);
}

/**
 * Safely reduce an array
 * @param value - The array to reduce
 * @param reducer - The reducer function
 * @param initialValue - The initial value
 * @returns Reduced value or initial value
 */
export function safeReduce<T, U>(
  value: any,
  reducer: (accumulator: U, currentValue: T, currentIndex: number, array: T[]) => U,
  initialValue: U
): U {
  const array = safeArray(value);
  return array.reduce(reducer, initialValue);
}

/**
 * Safely sort an array
 * @param value - The array to sort
 * @param compareFn - Optional compare function
 * @returns Sorted array or empty array
 */
export function safeSort<T>(value: any, compareFn?: (a: T, b: T) => number): T[] {
  const array = safeArray(value);
  return [...array].sort(compareFn);
}

/**
 * Safely reverse an array
 * @param value - The array to reverse
 * @returns Reversed array or empty array
 */
export function safeReverse<T>(value: any): T[] {
  const array = safeArray(value);
  return [...array].reverse();
}

/**
 * Safely get unique values from an array
 * @param value - The array to deduplicate
 * @returns Array with unique values
 */
export function safeUnique<T>(value: any): T[] {
  const array = safeArray(value);
  return [...new Set(array)];
}

/**
 * Safely flatten an array
 * @param value - The array to flatten
 * @param depth - Flattening depth
 * @returns Flattened array
 */
export function safeFlatten<T>(value: any, depth: number = 1): T[] {
  const array = safeArray(value);
  return array.flat(depth);
}

/**
 * Safe string utilities
 */
export const safeString = {
  /**
   * Safely get string length
   */
  length: (value: any): number => safeLength(value),
  
  /**
   * Safely check if string is empty
   */
  isEmpty: (value: any): boolean => !hasContent(value),
  
  /**
   * Safely trim a string
   */
  trim: (value: any): string => typeof value === 'string' ? value.trim() : '',
  
  /**
   * Safely convert to string
   */
  toString: (value: any): string => value != null ? String(value) : '',
  
  /**
   * Safely slice a string
   */
  slice: (value: any, start?: number, end?: number): string => 
    typeof value === 'string' ? value.slice(start, end) : '',
};
