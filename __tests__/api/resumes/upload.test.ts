import { NextRequest } from 'next/server';
import { POST } from '@/app/api/resumes/upload/route';

// Mock dependencies
jest.mock('@/lib/env', () => ({
  env: {
    NEXTAUTH_SECRET: 'test-secret',
    NODE_ENV: 'test',
  },
}));

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

const mockGetToken = require('next-auth/jwt').getToken;

describe('/api/resumes/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()});

  it('should reject unauthenticated requests', async () => {
    mockGetToken.mockResolvedValue(null);

    const formData = new FormData();
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    formData.append('resume', file);

    const request = new NextRequest('http://localhost:3000/api/resumes/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toContain('Authentication required')});

  it('should reject requests without file', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-123' });

    const formData = new FormData();
    const request = new NextRequest('http://localhost:3000/api/resumes/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.errors).toContain('File is required')});

  it('should reject invalid file types', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-123' });

    const formData = new FormData();
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    formData.append('resume', file);

    const request = new NextRequest('http://localhost:3000/api/resumes/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.errors).toContain('Only PDF, DOC, and DOCX files are allowed')});

  it('should reject files that are too large', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-123' });

    const formData = new FormData();
    // Create a file larger than 5MB
    const largeContent = 'a'.repeat(6 * 1024 * 1024);
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
    formData.append('resume', file);

    const request = new NextRequest('http://localhost:3000/api/resumes/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.errors).toContain('File size must be less than 5MB')});

  it('should successfully upload valid file', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-123' });

    const formData = new FormData();
    const file = new File(['test pdf content'], 'resume.pdf', { type: 'application/pdf' });
    formData.append('resume', file);
    formData.append('userId', 'user-123');

    const request = new NextRequest('http://localhost:3000/api/resumes/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('fileId');
    expect(data.data).toHaveProperty('fileName', 'resume.pdf');
    expect(data.data).toHaveProperty('fileSize', file.size);
    expect(data.data).toHaveProperty('fileType', 'application/pdf');
    expect(data.data).toHaveProperty('uploadedBy', 'user-123');
    expect(data.message).toBe('File uploaded successfully')});

  it('should handle file with job ID', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-123' });

    const formData = new FormData();
    const file = new File(['test pdf content'], 'resume.pdf', { type: 'application/pdf' });
    formData.append('resume', file);
    formData.append('userId', 'user-123');
    formData.append('jobId', 'job-456');

    const request = new NextRequest('http://localhost:3000/api/resumes/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('jobId', 'job-456')});

  it('should sanitize file names', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-123' });

    const formData = new FormData();
    const file = new File(['test content'], 'my resume with spaces & symbols!.pdf', { 
      type: 'application/pdf' 
    });
    formData.append('resume', file);

    const request = new NextRequest('http://localhost:3000/api/resumes/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.sanitizedFileName).toMatch(/^[\d-T:Z-]+my_resume_with_spaces___symbols_.pdf$/)});

  it('should generate file hash for deduplication', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-123' });

    const formData = new FormData();
    const file = new File(['test content'], 'resume.pdf', { type: 'application/pdf' });
    formData.append('resume', file);

    const request = new NextRequest('http://localhost:3000/api/resumes/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveProperty('fileHash');
    expect(typeof data.data.fileHash).toBe('string');
    expect(data.data.fileHash.length).toBe(64); // SHA-256 hash length
  })});