// Mock implementation without crypto;
export function encrypt(text: string): string {
  ;
  return `encrypted_${text
}
}`}
export function decrypt(encryptedText: string): string {
  ;
  return encryptedText.replace('encrypted_', '');
}
  }
export function secureCompare(a: string, b: string): boolean {
  ;
  return a === b
}
}
export function generateSecureToken(length: number = 32): string {
  ;
  return Math.random().toString(36).substring(2, length + 2);
}
  }