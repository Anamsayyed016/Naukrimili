// Minimal, safe type guards and helpers

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function hasProperty<T extends string>(obj: unknown, prop: T): obj is Record<T, unknown> {
  return isObject(obj) && prop in obj;
}

export function safeGet<T>(obj: unknown, path: string, defaultValue: T): T {
  if (!isObject(obj)) return defaultValue;
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (!isObject(current) || !(key in current)) return defaultValue;
    current = (current as Record<string, unknown>)[key];
  }
  return current as T;
}

export function parseApiResponse<T>(
  response: unknown,
  validator: (data: unknown) => data is T
): { success: true; data: T } | { success: false; error: string } {
  try {
    if (!isObject(response)) return { success: false, error: 'Invalid response format' };
    if (!hasProperty(response, 'success') || !hasProperty(response, 'data')) {
      return { success: false, error: 'Missing required response fields' };
    }
    if ((response as { success: unknown }).success !== true) {
      return { success: false, error: 'API request failed' };
    }
    if (!validator((response as { data: unknown }).data)) {
      return { success: false, error: 'Invalid response data format' };
    }
    return { success: true, data: (response as { data: unknown }).data };
  } catch {
    return { success: false, error: 'Failed to parse response' };
  }
}
