import crypto from 'crypto';

// Secure buffer operations

export function safeBufferAlloc(size: number, fill?: string | number): Buffer {
  if (size < 0 || size > 1024 * 1024 * 10) { // Max 10MB
    throw new Error('Invalid buffer size');
  }
  
  return Buffer.alloc(size, fill);
}

export function safeBufferFrom(data: string | ArrayBuffer | Uint8Array, encoding?: BufferEncoding): Buffer {
  try {
    if (typeof data === 'string') {
      if (data.length > 1024 * 1024) { // Max 1MB string
        throw new Error('String too large');
      }
      return Buffer.from(data, encoding);
    }
    
    if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      if (data.byteLength > 1024 * 1024 * 10) { // Max 10MB
        throw new Error('Buffer too large');
      }
      return Buffer.from(data);
    }
    
    throw new Error('Invalid data type');
  } catch (error) {
    throw new Error('Failed to create buffer: ' + (error as Error).message);
  }
}

export function safeBufferConcat(buffers: Buffer[], totalLength?: number): Buffer {
  if (buffers.length === 0) {
    return Buffer.alloc(0);
  }
  
  const calculatedLength = totalLength ?? buffers.reduce((sum, buf) => sum + buf.length, 0);
  
  if (calculatedLength > 1024 * 1024 * 50) { // Max 50MB
    throw new Error('Concatenated buffer too large');
  }
  
  return Buffer.concat(buffers, totalLength);
}

export function secureBufferCompare(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function clearBuffer(buffer: Buffer): void {
  buffer.fill(0);
}