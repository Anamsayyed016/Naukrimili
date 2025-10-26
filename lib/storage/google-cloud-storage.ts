/**
 * Google Cloud Storage Service
 * 
 * Secure, keyless integration with Google Cloud Storage using Workload Identity Federation
 * Bucket: naukrimili
 * Project: naukrimili-474709
 * 
 * Features:
 * - Upload files with custom metadata
 * - Download files (URL generation)
 * - Delete files
 * - List files with pagination
 * - Automatic retry logic
 * - Error handling
 * - Support for both local dev and production environments
 */

import { Storage, Bucket } from '@google-cloud/storage';
import { Readable } from 'stream';

// Environment configuration
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || 'naukrimili-474709';
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'naukrimili';
const GCP_IDENTITY_POOL = process.env.GCP_IDENTITY_POOL || 'naukrimili-job-portal';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Storage client configuration interface
interface StorageClientConfig {
  projectId: string;
  // In production with Workload Identity, credentials are automatically detected
  // In development, you can optionally provide a service account key path
  keyFilename?: string;
}

/**
 * Initialize Google Cloud Storage client
 * Uses Workload Identity Federation in production (keyless)
 * Can use service account key in development (optional)
 */
function initializeStorageClient(): Storage {
  const config: StorageClientConfig = {
    projectId: GCP_PROJECT_ID,
  };

  // In development, optionally use service account key
  // In production, Workload Identity Federation handles authentication automatically
  if (NODE_ENV === 'development' && process.env.GCP_SERVICE_ACCOUNT_KEY) {
    config.keyFilename = process.env.GCP_SERVICE_ACCOUNT_KEY;
    console.log('🔧 [GCS] Using service account key for development');
  } else {
    console.log('🔐 [GCS] Using Workload Identity Federation (keyless authentication)');
  }

  return new Storage(config);
}

// Singleton storage client
let storageClient: Storage | null = null;
let bucketInstance: Bucket | null = null;

/**
 * Get or create storage client instance
 */
function getStorageClient(): Storage {
  if (!storageClient) {
    storageClient = initializeStorageClient();
    console.log('✅ [GCS] Storage client initialized');
  }
  return storageClient;
}

/**
 * Get bucket instance
 */
function getBucket(): Bucket {
  if (!bucketInstance) {
    const storage = getStorageClient();
    bucketInstance = storage.bucket(GCS_BUCKET_NAME);
    console.log(`✅ [GCS] Connected to bucket: ${GCS_BUCKET_NAME}`);
  }
  return bucketInstance;
}

/**
 * Upload options interface
 */
interface UploadOptions {
  folder?: string; // e.g., 'resumes', 'profile-pictures', 'company-logos'
  metadata?: {
    [key: string]: string;
  };
  makePublic?: boolean; // Whether to make the file publicly accessible
  contentType?: string; // MIME type
}

/**
 * Upload result interface
 */
interface UploadResult {
  success: boolean;
  fileName: string;
  filePath: string;
  publicUrl?: string;
  gsUrl: string; // gs://bucket-name/path/to/file
  size?: number;
  error?: string;
}

/**
 * Upload a file to Google Cloud Storage
 * 
 * @param fileBuffer - File buffer or readable stream
 * @param originalFileName - Original file name
 * @param options - Upload options
 * @returns Upload result with URLs and metadata
 */
export async function uploadFileToGCS(
  fileBuffer: Buffer | Readable,
  originalFileName: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    console.log(`📤 [GCS] Starting upload: ${originalFileName}`);
    
    const bucket = getBucket();
    
    // Generate safe filename with timestamp
    const timestamp = Date.now();
    const safeName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${safeName}`;
    
    // Construct file path with folder
    const filePath = options.folder 
      ? `${options.folder}/${fileName}` 
      : fileName;
    
    const file = bucket.file(filePath);
    
    // Prepare upload options
    const uploadOptions: {
      metadata: {
        contentType: string;
        metadata: Record<string, string>;
      };
      resumable?: boolean;
      validation?: string;
    } = {
      metadata: {
        contentType: options.contentType || 'application/octet-stream',
        metadata: {
          originalName: originalFileName,
          uploadedAt: new Date().toISOString(),
          ...options.metadata,
        },
      },
      resumable: true, // Use resumable upload for reliability
      timeout: 60000, // 60 second timeout
    };
    
    // Upload file
    if (Buffer.isBuffer(fileBuffer)) {
      await file.save(fileBuffer, uploadOptions);
    } else {
      // Handle readable stream
      await new Promise<void>((resolve, reject) => {
        fileBuffer
          .pipe(file.createWriteStream(uploadOptions))
          .on('finish', resolve)
          .on('error', reject);
      });
    }
    
    console.log(`✅ [GCS] Upload successful: ${filePath}`);
    
    // Get file metadata
    const [metadata] = await file.getMetadata();
    
    // Make public if requested
    let publicUrl: string | undefined;
    if (options.makePublic) {
      await file.makePublic();
      publicUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${filePath}`;
      console.log(`🌐 [GCS] File made public: ${publicUrl}`);
    }
    
    // Parse size with proper type handling
    const fileSize = typeof metadata.size === 'string' 
      ? parseInt(metadata.size, 10) 
      : typeof metadata.size === 'number' 
        ? metadata.size 
        : 0;
    
    return {
      success: true,
      fileName,
      filePath,
      publicUrl,
      gsUrl: `gs://${GCS_BUCKET_NAME}/${filePath}`,
      size: fileSize,
    };
  } catch (error) {
    console.error('❌ [GCS] Upload failed:', error);
    return {
      success: false,
      fileName: originalFileName,
      filePath: '',
      gsUrl: '',
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Generate a signed URL for temporary file access
 * 
 * @param filePath - Path to file in bucket
 * @param expirationMinutes - URL expiration time in minutes (default: 60)
 * @returns Signed URL string
 */
export async function getSignedUrl(
  filePath: string,
  expirationMinutes: number = 60
): Promise<string> {
  try {
    const bucket = getBucket();
    const file = bucket.file(filePath);
    
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expirationMinutes * 60 * 1000,
    });
    
    console.log(`🔗 [GCS] Generated signed URL for: ${filePath}`);
    return url;
  } catch (error) {
    console.error('❌ [GCS] Failed to generate signed URL:', error);
    throw error;
  }
}

/**
 * Download a file from Google Cloud Storage
 * 
 * @param filePath - Path to file in bucket
 * @returns File buffer
 */
export async function downloadFileFromGCS(filePath: string): Promise<Buffer> {
  try {
    console.log(`📥 [GCS] Downloading file: ${filePath}`);
    
    const bucket = getBucket();
    const file = bucket.file(filePath);
    
    const [buffer] = await file.download();
    
    console.log(`✅ [GCS] Download successful: ${filePath}`);
    return buffer;
  } catch (error) {
    console.error('❌ [GCS] Download failed:', error);
    throw error;
  }
}

/**
 * Delete a file from Google Cloud Storage
 * 
 * @param filePath - Path to file in bucket
 * @returns Success boolean
 */
export async function deleteFileFromGCS(filePath: string): Promise<boolean> {
  try {
    console.log(`🗑️ [GCS] Deleting file: ${filePath}`);
    
    const bucket = getBucket();
    const file = bucket.file(filePath);
    
    await file.delete();
    
    console.log(`✅ [GCS] Delete successful: ${filePath}`);
    return true;
  } catch (error) {
    console.error('❌ [GCS] Delete failed:', error);
    return false;
  }
}

/**
 * Check if a file exists in Google Cloud Storage
 * 
 * @param filePath - Path to file in bucket
 * @returns Existence boolean
 */
export async function fileExistsInGCS(filePath: string): Promise<boolean> {
  try {
    const bucket = getBucket();
    const file = bucket.file(filePath);
    
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error('❌ [GCS] File existence check failed:', error);
    return false;
  }
}

/**
 * List files in a folder with pagination
 * 
 * @param folder - Folder path (optional)
 * @param maxResults - Maximum results to return (default: 100)
 * @param pageToken - Page token for pagination
 * @returns List of files and next page token
 */
export async function listFilesInGCS(
  folder?: string,
  maxResults: number = 100,
  pageToken?: string
): Promise<{
  files: Array<{
    name: string;
    size: number;
    contentType: string;
    updated: string;
    publicUrl?: string;
  }>;
  nextPageToken?: string;
}> {
  try {
    console.log(`📂 [GCS] Listing files in folder: ${folder || 'root'}`);
    
    const bucket = getBucket();
    
    const [files, , response] = await bucket.getFiles({
      prefix: folder,
      maxResults,
      pageToken,
    });
    
    const fileList = files.map(file => {
      // Parse size with proper type handling
      const fileSize = typeof file.metadata.size === 'string' 
        ? parseInt(file.metadata.size, 10) 
        : typeof file.metadata.size === 'number' 
          ? file.metadata.size 
          : 0;
      
      return {
        name: file.name,
        size: fileSize,
        contentType: file.metadata.contentType || 'unknown',
        updated: file.metadata.updated || '',
        publicUrl: file.metadata.mediaLink,
      };
    });
    
    console.log(`✅ [GCS] Found ${fileList.length} files`);
    
    // Type-safe response handling
    const nextToken = response && typeof response === 'object' && 'nextPageToken' in response
      ? (response as { nextPageToken?: string }).nextPageToken
      : undefined;
    
    return {
      files: fileList,
      nextPageToken: nextToken,
    };
  } catch (error) {
    console.error('❌ [GCS] List files failed:', error);
    return {
      files: [],
    };
  }
}

/**
 * Get file metadata
 * 
 * @param filePath - Path to file in bucket
 * @returns File metadata
 */
export async function getFileMetadata(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const bucket = getBucket();
    const file = bucket.file(filePath);
    
    const [metadata] = await file.getMetadata();
    return metadata;
  } catch (error) {
    console.error('❌ [GCS] Get metadata failed:', error);
    throw error;
  }
}

/**
 * Move/rename a file in GCS
 * 
 * @param sourcePath - Current file path
 * @param destinationPath - New file path
 * @returns Success boolean
 */
export async function moveFileInGCS(
  sourcePath: string,
  destinationPath: string
): Promise<boolean> {
  try {
    console.log(`📦 [GCS] Moving file from ${sourcePath} to ${destinationPath}`);
    
    const bucket = getBucket();
    const sourceFile = bucket.file(sourcePath);
    const destinationFile = bucket.file(destinationPath);
    
    await sourceFile.move(destinationFile);
    
    console.log(`✅ [GCS] Move successful`);
    return true;
  } catch (error) {
    console.error('❌ [GCS] Move failed:', error);
    return false;
  }
}

/**
 * Copy a file in GCS
 * 
 * @param sourcePath - Source file path
 * @param destinationPath - Destination file path
 * @returns Success boolean
 */
export async function copyFileInGCS(
  sourcePath: string,
  destinationPath: string
): Promise<boolean> {
  try {
    console.log(`📋 [GCS] Copying file from ${sourcePath} to ${destinationPath}`);
    
    const bucket = getBucket();
    const sourceFile = bucket.file(sourcePath);
    const destinationFile = bucket.file(destinationPath);
    
    await sourceFile.copy(destinationFile);
    
    console.log(`✅ [GCS] Copy successful`);
    return true;
  } catch (error) {
    console.error('❌ [GCS] Copy failed:', error);
    return false;
  }
}

/**
 * Test GCS connection and permissions
 * 
 * @returns Test result with status and message
 */
export async function testGCSConnection(): Promise<{
  success: boolean;
  message: string;
  bucketName?: string;
  projectId?: string;
}> {
  try {
    console.log('🔍 [GCS] Testing connection...');
    
    const bucket = getBucket();
    const [exists] = await bucket.exists();
    
    if (!exists) {
      return {
        success: false,
        message: `Bucket ${GCS_BUCKET_NAME} does not exist or is not accessible`,
      };
    }
    
    // Test write permission by creating a test file
    const testFile = bucket.file('.test-connection');
    await testFile.save('test', {
      metadata: {
        contentType: 'text/plain',
      },
    });
    
    // Clean up test file
    await testFile.delete();
    
    console.log('✅ [GCS] Connection test successful');
    
    return {
      success: true,
      message: 'Successfully connected to Google Cloud Storage with read/write permissions',
      bucketName: GCS_BUCKET_NAME,
      projectId: GCP_PROJECT_ID,
    };
  } catch (error) {
    console.error('❌ [GCS] Connection test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown connection error',
    };
  }
}

// Export configuration for reference
export const GCS_CONFIG = {
  projectId: GCP_PROJECT_ID,
  bucketName: GCS_BUCKET_NAME,
  identityPool: GCP_IDENTITY_POOL,
  environment: NODE_ENV,
};

const googleCloudStorageService = {
  uploadFileToGCS,
  downloadFileFromGCS,
  deleteFileFromGCS,
  fileExistsInGCS,
  getSignedUrl,
  listFilesInGCS,
  getFileMetadata,
  moveFileInGCS,
  copyFileInGCS,
  testGCSConnection,
  GCS_CONFIG,
};

export default googleCloudStorageService;

