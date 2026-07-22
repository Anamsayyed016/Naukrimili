/**
 * Account profile picture storage — reuses Google Cloud Storage + local fallback
 * (same pattern as lib/storage/resume-storage.ts).
 */

import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import {
  uploadFileToGCS,
  deleteFileFromGCS,
} from '@/lib/storage/google-cloud-storage';
import {
  toProfilePictureAssetUrl,
  localProfilePictureRelativePath,
} from '@/lib/user/profile-picture-url';

export {
  normalizeStoredProfilePictureUrl,
  toProfilePictureAssetUrl,
  PROFILE_PICTURE_ASSET_PREFIX,
  PROFILE_PICTURE_LEGACY_PREFIX,
} from '@/lib/user/profile-picture-url';

const ENABLE_GCS = process.env.ENABLE_GCS_STORAGE === 'true';
const LOCAL_UPLOADS_DIR = join(process.cwd(), 'uploads', 'profile-pictures');
const PROFILE_PICTURES_FOLDER = 'profile-pictures';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const SAFE_USER_ID = /^[a-zA-Z0-9_-]+$/;
const SAFE_FILENAME = /^[a-zA-Z0-9._-]+$/;

export function resolveLocalProfilePictureFilePath(relativePath: string): string {
  if (!relativePath || relativePath.includes('..')) {
    throw new Error('Invalid profile picture path');
  }
  const segments = relativePath.split('/').filter(Boolean);
  if (segments.length !== 2) {
    throw new Error('Invalid profile picture path');
  }
  const [userId, fileName] = segments;
  if (!SAFE_USER_ID.test(userId) || !SAFE_FILENAME.test(fileName)) {
    throw new Error('Invalid profile picture path');
  }
  return join(LOCAL_UPLOADS_DIR, userId, fileName);
}

export function contentTypeForProfilePictureFilename(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export interface ProfilePictureUploadResult {
  success: boolean;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  storage: 'gcs' | 'local';
  gcsPath?: string;
  error?: string;
}

export function validateProfilePictureFile(file: {
  name: string;
  type: string;
  size: number;
}): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Image must be 5MB or smaller.',
    };
  }

  const normalizedType = file.type.toLowerCase();
  if (!ALLOWED_TYPES.has(normalizedType)) {
    return {
      valid: false,
      error: 'Unsupported format. Use JPG, PNG, or WebP.',
    };
  }

  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );
  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'Unsupported file extension. Use JPG, PNG, or WebP.',
    };
  }

  return { valid: true };
}

export async function uploadProfilePicture(
  fileBuffer: Buffer,
  fileName: string,
  fileType: string,
  fileSize: number,
  userId: string
): Promise<ProfilePictureUploadResult> {
  const validation = validateProfilePictureFile({
    name: fileName,
    type: fileType,
    size: fileSize,
  });

  if (!validation.valid) {
    return {
      success: false,
      fileName,
      fileUrl: '',
      fileSize,
      storage: 'local',
      error: validation.error,
    };
  }

  if (ENABLE_GCS) {
    return uploadToGCS(fileBuffer, fileName, fileType, fileSize, userId);
  }
  return uploadToLocal(fileBuffer, fileName, fileType, fileSize, userId);
}

async function uploadToGCS(
  fileBuffer: Buffer,
  fileName: string,
  fileType: string,
  fileSize: number,
  userId: string
): Promise<ProfilePictureUploadResult> {
  try {
    const folder = `${PROFILE_PICTURES_FOLDER}/${userId}`;
    const result = await uploadFileToGCS(fileBuffer, fileName, {
      folder,
      contentType: fileType,
      metadata: {
        userId,
        uploadedAt: new Date().toISOString(),
        originalName: fileName,
      },
      makePublic: true,
    });

    if (!result.success || !result.publicUrl) {
      return uploadToLocal(fileBuffer, fileName, fileType, fileSize, userId);
    }

    return {
      success: true,
      fileName: result.fileName,
      fileUrl: result.publicUrl,
      fileSize: result.size || fileSize,
      storage: 'gcs',
      gcsPath: result.filePath,
    };
  } catch {
    return uploadToLocal(fileBuffer, fileName, fileType, fileSize, userId);
  }
}

async function uploadToLocal(
  fileBuffer: Buffer,
  fileName: string,
  fileType: string,
  fileSize: number,
  userId: string
): Promise<ProfilePictureUploadResult> {
  const userDir = join(LOCAL_UPLOADS_DIR, userId);
  await mkdir(userDir, { recursive: true });

  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const localFileName = `${timestamp}_${safeName}`;
  const filepath = join(userDir, localFileName);

  await writeFile(filepath, fileBuffer);

  return {
    success: true,
    fileName: localFileName,
    fileUrl: toProfilePictureAssetUrl(userId, localFileName),
    fileSize,
    storage: 'local',
    gcsPath: `${userId}/${localFileName}`,
  };
}

/** Best-effort delete of a previously stored account profile picture. */
export async function deleteStoredProfilePicture(
  storedUrl: string | null | undefined,
  userId: string
): Promise<void> {
  if (!storedUrl?.trim()) return;

  const url = storedUrl.trim().split('?')[0];

  const relative = localProfilePictureRelativePath(url);
  if (relative) {
    try {
      const filepath = resolveLocalProfilePictureFilePath(relative);
      await unlink(filepath);
    } catch {
      // File may already be gone
    }
    return;
  }

  const bucket = process.env.GCS_BUCKET_NAME || 'naukrimili';
  const prefix = `https://storage.googleapis.com/${bucket}/`;
  if (url.startsWith(prefix)) {
    const filePath = url.slice(prefix.length);
    if (filePath.startsWith(`${PROFILE_PICTURES_FOLDER}/${userId}/`)) {
      try {
        await deleteFileFromGCS(filePath);
      } catch {
        // Best effort
      }
    }
  }
}
