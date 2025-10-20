/**
 * Resume Storage Service
 * 
 * Specialized storage service for resume file operations
 * Integrates with Google Cloud Storage for scalable, secure file management
 * 
 * Features:
 * - Automatic folder organization (resumes/)
 * - File validation (type, size)
 * - Metadata tracking
 * - Signed URL generation
 * - Fallback to local storage if GCS is disabled
 */

import {
  uploadFileToGCS,
  downloadFileFromGCS,
  deleteFileFromGCS,
  getSignedUrl,
  fileExistsInGCS,
} from './google-cloud-storage';
import { writeFile, mkdir, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Configuration
const ENABLE_GCS = process.env.ENABLE_GCS_STORAGE === 'true';
const LOCAL_UPLOADS_DIR = join(process.cwd(), 'uploads', 'resumes');
const RESUMES_FOLDER = 'resumes';

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];

// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Resume upload result interface
 */
export interface ResumeUploadResult {
  success: boolean;
  fileName: string;
  fileUrl: string; // URL to access the file
  fileSize: number;
  storage: 'gcs' | 'local';
  gcsPath?: string; // Full GCS path (for GCS storage)
  error?: string;
}

/**
 * Validate resume file
 */
function validateResumeFile(file: File | { name: string; type: string; size: number }): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files.',
    };
  }

  // Check file extension
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'Invalid file extension. Allowed: PDF, DOC, DOCX, TXT',
    };
  }

  return { valid: true };
}

/**
 * Upload resume file with automatic GCS/local storage selection
 * 
 * @param fileBuffer - File buffer
 * @param fileName - Original file name
 * @param fileType - MIME type
 * @param fileSize - File size in bytes
 * @param userId - User ID for metadata
 * @returns Upload result with file URL
 */
export async function uploadResume(
  fileBuffer: Buffer,
  fileName: string,
  fileType: string,
  fileSize: number,
  userId?: string
): Promise<ResumeUploadResult> {
  try {
    // Validate file
    const validation = validateResumeFile({
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

    console.log(`📤 [Resume Storage] Uploading: ${fileName} (${fileSize} bytes)`);
    console.log(`🔧 [Resume Storage] GCS Enabled: ${ENABLE_GCS}`);

    // Use GCS if enabled, otherwise fall back to local storage
    if (ENABLE_GCS) {
      return await uploadToGCS(fileBuffer, fileName, fileType, fileSize, userId);
    } else {
      return await uploadToLocal(fileBuffer, fileName, fileType, fileSize);
    }
  } catch (error) {
    console.error('❌ [Resume Storage] Upload failed:', error);
    return {
      success: false,
      fileName,
      fileUrl: '',
      fileSize,
      storage: 'local',
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Upload to Google Cloud Storage
 */
async function uploadToGCS(
  fileBuffer: Buffer,
  fileName: string,
  fileType: string,
  fileSize: number,
  userId?: string
): Promise<ResumeUploadResult> {
  try {
    console.log('☁️ [Resume Storage] Uploading to Google Cloud Storage...');

    const result = await uploadFileToGCS(fileBuffer, fileName, {
      folder: RESUMES_FOLDER,
      contentType: fileType,
      metadata: {
        userId: userId || 'unknown',
        uploadedAt: new Date().toISOString(),
        originalName: fileName,
      },
      makePublic: false, // Keep resumes private by default
    });

    if (!result.success) {
      // Fallback to local storage on GCS failure
      console.warn('⚠️ [Resume Storage] GCS upload failed, falling back to local storage');
      return await uploadToLocal(fileBuffer, fileName, fileType, fileSize);
    }

    // Generate signed URL for secure access
    const signedUrl = await getSignedUrl(
      result.filePath,
      parseInt(process.env.GCS_SIGNED_URL_EXPIRATION_MINUTES || '60', 10)
    );

    return {
      success: true,
      fileName: result.fileName,
      fileUrl: signedUrl,
      fileSize: result.size || fileSize,
      storage: 'gcs',
      gcsPath: result.filePath,
    };
  } catch (error) {
    console.error('❌ [Resume Storage] GCS upload error:', error);
    // Fallback to local storage
    console.warn('⚠️ [Resume Storage] Falling back to local storage');
    return await uploadToLocal(fileBuffer, fileName, fileType, fileSize);
  }
}

/**
 * Upload to local filesystem (fallback)
 */
async function uploadToLocal(
  fileBuffer: Buffer,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<ResumeUploadResult> {
  try {
    console.log('💾 [Resume Storage] Uploading to local filesystem...');

    // Ensure upload directory exists
    await mkdir(LOCAL_UPLOADS_DIR, { recursive: true });

    // Generate safe filename
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const localFileName = `${timestamp}_${safeName}`;
    const filepath = join(LOCAL_UPLOADS_DIR, localFileName);

    // Write file
    await writeFile(filepath, fileBuffer);

    console.log(`✅ [Resume Storage] Local upload successful: ${filepath}`);

    return {
      success: true,
      fileName: localFileName,
      fileUrl: `/uploads/resumes/${localFileName}`,
      fileSize,
      storage: 'local',
    };
  } catch (error) {
    console.error('❌ [Resume Storage] Local upload error:', error);
    throw error;
  }
}

/**
 * Get resume file URL (handles both GCS and local storage)
 * 
 * @param filePath - File path (GCS path or local path)
 * @param storage - Storage type
 * @returns Accessible URL
 */
export async function getResumeUrl(
  filePath: string,
  storage: 'gcs' | 'local'
): Promise<string> {
  try {
    if (storage === 'gcs' && ENABLE_GCS) {
      // Generate fresh signed URL
      return await getSignedUrl(
        filePath.startsWith(RESUMES_FOLDER) ? filePath : `${RESUMES_FOLDER}/${filePath}`,
        parseInt(process.env.GCS_SIGNED_URL_EXPIRATION_MINUTES || '60', 10)
      );
    } else {
      // Return local URL
      return filePath.startsWith('/uploads') ? filePath : `/uploads/resumes/${filePath}`;
    }
  } catch (error) {
    console.error('❌ [Resume Storage] Failed to get resume URL:', error);
    throw error;
  }
}

/**
 * Delete resume file
 * 
 * @param filePath - File path
 * @param storage - Storage type
 * @returns Success boolean
 */
export async function deleteResume(
  filePath: string,
  storage: 'gcs' | 'local'
): Promise<boolean> {
  try {
    console.log(`🗑️ [Resume Storage] Deleting resume: ${filePath}`);

    if (storage === 'gcs' && ENABLE_GCS) {
      const gcsPath = filePath.startsWith(RESUMES_FOLDER) 
        ? filePath 
        : `${RESUMES_FOLDER}/${filePath}`;
      return await deleteFileFromGCS(gcsPath);
    } else {
      const localPath = join(LOCAL_UPLOADS_DIR, filePath.replace('/uploads/resumes/', ''));
      if (existsSync(localPath)) {
        await unlink(localPath);
        console.log(`✅ [Resume Storage] Local file deleted: ${localPath}`);
        return true;
      } else {
        console.warn(`⚠️ [Resume Storage] File not found: ${localPath}`);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ [Resume Storage] Delete failed:', error);
    return false;
  }
}

/**
 * Download resume file
 * 
 * @param filePath - File path
 * @param storage - Storage type
 * @returns File buffer
 */
export async function downloadResume(
  filePath: string,
  storage: 'gcs' | 'local'
): Promise<Buffer> {
  try {
    console.log(`📥 [Resume Storage] Downloading resume: ${filePath}`);

    if (storage === 'gcs' && ENABLE_GCS) {
      const gcsPath = filePath.startsWith(RESUMES_FOLDER) 
        ? filePath 
        : `${RESUMES_FOLDER}/${filePath}`;
      return await downloadFileFromGCS(gcsPath);
    } else {
      const localPath = join(LOCAL_UPLOADS_DIR, filePath.replace('/uploads/resumes/', ''));
      return await readFile(localPath);
    }
  } catch (error) {
    console.error('❌ [Resume Storage] Download failed:', error);
    throw error;
  }
}

/**
 * Check if resume file exists
 * 
 * @param filePath - File path
 * @param storage - Storage type
 * @returns Existence boolean
 */
export async function resumeExists(
  filePath: string,
  storage: 'gcs' | 'local'
): Promise<boolean> {
  try {
    if (storage === 'gcs' && ENABLE_GCS) {
      const gcsPath = filePath.startsWith(RESUMES_FOLDER) 
        ? filePath 
        : `${RESUMES_FOLDER}/${filePath}`;
      return await fileExistsInGCS(gcsPath);
    } else {
      const localPath = join(LOCAL_UPLOADS_DIR, filePath.replace('/uploads/resumes/', ''));
      return existsSync(localPath);
    }
  } catch (error) {
    console.error('❌ [Resume Storage] Existence check failed:', error);
    return false;
  }
}

export default {
  uploadResume,
  getResumeUrl,
  deleteResume,
  downloadResume,
  resumeExists,
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
};

