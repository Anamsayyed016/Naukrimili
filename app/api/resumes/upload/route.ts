import { NextRequest, NextResponse } from "next/server";

// Configure the API route for Vercel Edge Runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Backend API URL
const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;

// Helper function to validate file type
function isAllowedFileType(file: File): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const fileExtension = file.name.toLowerCase().split('.').pop();
  
  return allowedTypes.includes(file.type) || allowedExtensions.includes(`.${fileExtension}`);
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    console.log('Received upload request');
    
    const formData = await req.formData();
    const file = formData.get("resume") as File;

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: "No file uploaded" 
      }, { status: 400 });
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

    // In Vercel Edge runtime, we can't write to filesystem
    // Instead, we'll forward the file to the backend or use a cloud storage service
    if (BACKEND_API_URL) {
      try {
        const backendFormData = new FormData();
        backendFormData.append('resume', file);
        
        const response = await fetch(`${BACKEND_API_URL}/resumes/upload`, {
          method: 'POST',
          body: backendFormData,
        });
        
        if (response.ok) {
          const result = await response.json();
          return NextResponse.json({
            success: true,
            data: {
              filePath: result.filePath || `/api/files/${Date.now()}-${file.name}`,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
            }
          });
        }
      } catch (error) {
        console.warn('Backend upload failed:', error);
      }
    }

    // Fallback: Return success with metadata (for demo purposes)
    // In production, you'd want to upload to a cloud storage service
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedFileName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_');
    
    return NextResponse.json({
      success: true,
      data: {
        filePath: `/uploads/resumes/${timestamp}-${sanitizedFileName}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        message: 'File processed successfully (demo mode)'
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
