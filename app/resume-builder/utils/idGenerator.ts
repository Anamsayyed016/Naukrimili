/**
 * ID Generator Utility
 * Simple ID generation without external dependencies
 */

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

