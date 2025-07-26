import { encrypt, decrypt, secureCompare, generateSecureToken } from '@/lib/encryption';

describe('Encryption Security', () => {
  it('should encrypt and decrypt data correctly', () => {
    const plaintext = 'sensitive data';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    
    expect(decrypted).toBe(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.split(':').length).toBe(4); // salt:iv:tag:data
  });
  
  it('should produce different ciphertext for same plaintext', () => {
    const plaintext = 'test data';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    
    expect(encrypted1).not.toBe(encrypted2);
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
  });
  
  it('should fail on tampered ciphertext', () => {
    const plaintext = 'test data';
    const encrypted = encrypt(plaintext);
    const tampered = encrypted.replace(/.$/, '0'); // Change last character
    
    expect(() => decrypt(tampered)).toThrow();
  });
  
  it('should use secure comparison', () => {
    const str1 = 'secret123';
    const str2 = 'secret123';
    const str3 = 'secret124';
    
    expect(secureCompare(str1, str2)).toBe(true);
    expect(secureCompare(str1, str3)).toBe(false);
    expect(secureCompare('', '')).toBe(true);
  });
  
  it('should generate secure tokens', () => {
    const token1 = generateSecureToken(32);
    const token2 = generateSecureToken(32);
    
    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
    expect(/^[a-f0-9]+$/.test(token1)).toBe(true);
  });
});