// Mock implementation without crypto
export function encrypt(text: string): string {
  return `encrypted_${text}`;
}

export function decrypt(encryptedText: string): string {
  return encryptedText.replace('encrypted_', '');
}
