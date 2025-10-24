// Lightweight, SSR-safe utilities; not suitable for sensitive data at rest.

function toBase64(input: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'utf8').toString('base64');
  }
  // Browser fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = globalThis as any;
  return win.btoa(unescape(encodeURIComponent(input)));
}

function fromBase64(b64: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf8');
  }
  // Browser fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = globalThis as any;
  return decodeURIComponent(escape(win.atob(b64)));
}

export function encrypt(text: string): string {
  return `enc:${toBase64(text)}`;
}

export function decrypt(encryptedText: string): string {
  const val = encryptedText.startsWith('enc:') ? encryptedText.slice(4) : encryptedText;
  try {
    return fromBase64(val);
  } catch {
    return val;
  }
}

export function secureCompare(a: string, b: string): boolean {
  // Constant-time-ish compare for short strings
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function generateSecureToken(length: number = 32): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = new Uint8Array(length);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Fallback
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
