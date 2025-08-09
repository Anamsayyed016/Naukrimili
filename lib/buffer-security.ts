import crypto from 'crypto';

// Secure buffer operations
export function safeBufferAlloc(size: number, fill?: string | number): Buffer {
  if (size < 0 || size > 10 * 1024 * 1024) throw new Error('Invalid buffer size');
  return Buffer.alloc(size, fill as any);
}

export function safeBufferFrom(data: string | ArrayBuffer | Uint8Array, encoding?: BufferEncoding): Buffer {
  try {
    if (typeof data === 'string') {
      if (data.length > 1 * 1024 * 1024) throw new Error('String too large');
      return Buffer.from(data, encoding);
    }
    if (data instanceof Uint8Array) {
      if (data.byteLength > 10 * 1024 * 1024) throw new Error('Buffer too large');
      return Buffer.from(data);
    }
    if (data instanceof ArrayBuffer) {
      if (data.byteLength > 10 * 1024 * 1024) throw new Error('Buffer too large');
      return Buffer.from(new Uint8Array(data));
    }
    throw new Error('Invalid data type');
  } catch (error: any) {
    throw new Error('Failed to create buffer: ' + (error?.message || String(error)));
  }
}

export function safeBufferConcat(buffers: Buffer[], totalLength?: number): Buffer {
  if (buffers.length === 0) return Buffer.alloc(0);
  const calculated = totalLength ?? buffers.reduce((sum, b) => sum + b.length, 0);
  if (calculated > 50 * 1024 * 1024) throw new Error('Concatenated buffer too large');
  return Buffer.concat(buffers, totalLength);
}

export function secureBufferCompare(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function clearBuffer(buffer: Buffer): void {
  buffer.fill(0);
}