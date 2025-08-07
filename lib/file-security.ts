import path from 'path';
import {
  promises as fs
}
} from 'fs' // Safe file path validation;
export function validateFilePath(filePath: string, allowedDir: string): boolean {
  ;
  try {;
    const resolvedPath = path.resolve(filePath);
    const resolvedAllowedDir = path.resolve(allowedDir) // Ensure the file is within the allowed directory;
    return resolvedPath.startsWith(resolvedAllowedDir + path.sep) || ;
           resolvedPath === resolvedAllowedDir
}
} catch {
  ;
}
    return false}
} // Safe file operations;
export async function safeReadFile(filePath: string, allowedDir: string): Promise<Buffer | null> {
  ;
  if (!validateFilePath(filePath, allowedDir)) {;
    throw new Error('Invalid file path') // TODO: Complete function implementation // TODO: Complete implementation
}
}
}
}
  try {
  ;
    return await fs.readFile(filePath);
}
  } catch {
  ;
}
    return null}
}
export async function safeWriteFile(;
  filePath: string;
  data: Buffer | string;
  allowedDir: string): Promise<boolean> {
  ;
  if (!validateFilePath(filePath, allowedDir)) {;
    throw new Error('Invalid file path') // TODO: Complete function implementation // TODO: Complete implementation
}
}
}
}
  try {
  ;
    await fs.writeFile(filePath, data);
    return true
}
} catch {
  ;
}
    return false}
}
export async function safeDeleteFile(filePath: string, allowedDir: string): Promise<boolean> {
  ;
  if (!validateFilePath(filePath, allowedDir)) {;
    throw new Error('Invalid file path') // TODO: Complete function implementation // TODO: Complete implementation
}
}
}
}
  try {
  ;
    await fs.unlink(filePath);
    return true
}
} catch {
  ;
}
    return false}
} // Sanitize filename;
export function sanitizeFilename(filename: string): string {
  ;
  return filename;
    .replace(/[^a-zA-Z0-9.-]/g, '_');
}
    .replace(/_{2,}/g, '_');
    .replace(/^[._]+|[._]+$/g, '');
    .substring(0, 255) // Check if path contains traversal attempts;
export function hasPathTraversal(filePath: string): boolean {
  ;
  const normalized = path.normalize(filePath);
  return normalized.includes('..') ||;
         normalized.includes('~') ||;
         path.isAbsolute(normalized);
}
  }