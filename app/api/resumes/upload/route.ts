import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync, statSync } from "fs";
import path from "path";
import os from 'os';

// Ensure upload directory path is valid
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads', 'resumes');

// Configure the API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Maximum duration in seconds

// Backend API URL
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

async function createDirIfNotExists(dir: string) {
  try {
    // First try to stat the directory
    try {
      const stats = statSync(dir);
      if (!stats.isDirectory()) {
        throw new Error(`Path exists but is not a directory: ${dir}`);
      }
      console.log(`Directory already exists: ${dir}`);
      return;
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    // Directory doesn't exist, create it
    await mkdir(dir, { recursive: true, mode: 0o755 });
    console.log(`Directory created: ${dir}`);
    
    // Verify the directory was created
    const stats = statSync(dir);
    if (!stats.isDirectory()) {
      throw new Error(`Failed to create directory: ${dir}`);
    }
  } catch (error: any) {
    console.error(`Failed to create/verify directory ${dir}:`, error);
    throw error;
  }
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
// Define allowed file types and their extensions
const ALLOWED_FILE_TYPES = new Map([
  ['application/pdf', ['.pdf']],
  ['application/msword', ['.doc']],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', ['.docx']]
]);

// Helper function to check file type
function isAllowedFileType(file: File): boolean {
  const extension = path.extname(file.name).toLowerCase();
  
  // Check if either MIME type matches or file extension is valid
  for (const [mimeType, extensions] of ALLOWED_FILE_TYPES.entries()) {
    if (file.type === mimeType || extensions.includes(extension)) {
      return true;
    }
  }
  return false;
}

// Function to check for fraud
async function checkFraud(file: File): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${BACKEND_API_URL}/fraud/check-fraud`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Fraud check failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.is_fraudulent;
  } catch (error) {
    console.error('Fraud check error:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('Received upload request');
    
    if (!req.body) {
      console.error('No request body received');
      return NextResponse.json({ success: false, message: "No request body" }, { status: 400 });
    }

    const contentType = req.headers.get('content-type');
    console.log('Content-Type:', contentType);

    if (!contentType?.includes('multipart/form-data')) {
      console.error('Invalid content type:', contentType);
      return NextResponse.json({ 
        success: false, 
        message: "Invalid content type. Expected multipart/form-data" 
      }, { status: 400 });
    }

    const formData = await req.formData();
    console.log('FormData entries:', Array.from(formData.entries()).map(([key]) => key));
    
    const file = formData.get("resume");
    console.log('File object:', file ? 'Found' : 'Not found', file instanceof File ? '(is File)' : '(not File)');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, message: "No valid file uploaded" }, { status: 400 });
    }

    if (!isAllowedFileType(file)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid file type. Please upload a PDF or Word document (.pdf, .doc, or .docx)" 
      }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        success: false, 
        message: "File size too large. Maximum size is 5MB" 
      }, { status: 400 });
    }

    // Check for fraud before proceeding
    try {
      const isFraudulent = await checkFraud(file);
      if (isFraudulent) {
        return NextResponse.json({
          success: false,
          message: "This file has been flagged as potentially fraudulent and cannot be uploaded."
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Fraud check failed:', error);
      // Continue with upload if fraud check fails, but log the error
      // You might want to change this behavior based on your security requirements
    }

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('Ensuring upload directory exists...');
    
    try {
      // Create the entire directory structure at once
      await createDirIfNotExists(UPLOAD_DIR);
      console.log('Upload directory verified:', UPLOAD_DIR);
    } catch (err: any) {
      console.error('Failed to create/verify upload directory:', err);
      return NextResponse.json({ 
        success: false, 
        message: "Server configuration error: Failed to access upload directory",
        details: err.message
      }, { status: 500 });
    }

    // Create a unique filename using a more robust approach
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedFileName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_');
    const uniqueFilename = `${timestamp}-${sanitizedFileName}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);
    console.log('Writing to:', filePath);

    try {
      // Write to a temporary file first
      const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}`);
      
      // Write to temp file
      try {
        await writeFile(tempFilePath, buffer);
        console.log('Temporary file written successfully');
      } catch (err: any) {
        throw new Error(`Failed to write temporary file: ${err.message}`);
      }
      
      // Move to final location
      try {
        await writeFile(filePath, buffer);
        console.log('File moved to final location');
      } catch (err: any) {
        // Try to clean up temp file if final write fails
        try {
          await unlink(tempFilePath);
        } catch {} // Ignore cleanup errors
        throw new Error(`Failed to write to final location: ${err.message}`);
      }
      
      // Clean up temp file
      try {
        await unlink(tempFilePath);
        console.log('Temporary file cleaned up');
      } catch (err: any) {
        console.warn('Failed to clean up temporary file:', err);
        // Non-critical error, don't throw
      }
      
      // Verify the file was written correctly
      try {
        const stats = statSync(filePath);
        if (stats.size !== buffer.length) {
          throw new Error('File size mismatch after write');
        }
        console.log('File written successfully:', {
          path: filePath,
          size: stats.size,
          expectedSize: buffer.length
        });
      } catch (error: any) {
        throw new Error(`File verification failed: ${error.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Failed to write file:', err);
      return NextResponse.json({ 
        success: false, 
        message: "Failed to save uploaded file",
        details: err.message
      }, { status: 500 });
    }

    // Return the file path
    const publicPath = `/uploads/resumes/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      data: {
        filePath: publicPath,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      }
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}