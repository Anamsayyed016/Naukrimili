// Type guards for safe type assertions

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function hasProperty<T extends string>(
  obj: unknown,
  prop: T
): obj is Record<T, unknown> {
  return isObject(obj) && prop in obj;
}

// Safe property access
export function safeGet<T>(
  obj: unknown,
  path: string,
  defaultValue: T
): T {
  if (!isObject(obj)) return defaultValue;
  
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (!isObject(current) || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current as T;
}

// Safe API response parsing
export function parseApiResponse<T>(
  response: unknown,
  validator: (data: unknown) => data is T
): { success: true; data: T } | { success: false; error: string } {
  try {
    if (!isObject(response)) {
      return { success: false, error: 'Invalid response format' };
    }
    
    if (!hasProperty(response, 'success') || !hasProperty(response, 'data')) {
      return { success: false, error: 'Missing required response fields' };
    }
    
    if (response.success !== true) {
      return { success: false, error: 'API request failed' };
    }
    
    if (!validator(response.data)) {
      return { success: false, error: 'Invalid response data format' };
    }
    
    return { success: true, data: response.data };
  } catch {
    return { success: false, error: 'Failed to parse response' };
  }
}