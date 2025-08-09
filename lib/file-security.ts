import path from 'path';
import { promises as fs } from 'fs';

// Ensure filePath is inside allowedDir (no traversal, absolute path)
export function validateFilePath(filePath: string, allowedDir: string): boolean {
  try {
    const resolvedPath = path.resolve(filePath);
    const resolvedAllowedDir = path.resolve(allowedDir);
    // Ensure the file is within the allowed directory
    return (
      resolvedPath === resolvedAllowedDir ||
      resolvedPath.startsWith(resolvedAllowedDir + path.sep)
    );
  } catch {
    return false;
  }
}

export function hasPathTraversal(p: string): boolean {
  const normalized = path.normalize(p || '');
  // block attempts like ../, ~, absolute paths
  return normalized.includes('..') || normalized.includes('~') || path.isAbsolute(normalized);
}

export function sanitizeFilename(filename: string): string {
  const safe = (filename || '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 255);
  return safe || 'file';
}

export async function safeReadFile(filePath: string, allowedDir: string): Promise<Buffer | null> {
  if (!validateFilePath(filePath, allowedDir)) {
    throw new Error('Invalid file path');
  }
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

export async function safeWriteFile(filePath: string, data: Buffer | string, allowedDir: string): Promise<boolean> {
  if (!validateFilePath(filePath, allowedDir)) {
    throw new Error('Invalid file path');
  }
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
    return true;
  } catch {
    return false;
  }
}

export async function safeDeleteFile(filePath: string, allowedDir: string): Promise<boolean> {
  if (!validateFilePath(filePath, allowedDir)) {
    throw new Error('Invalid file path');
  }
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}