import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/error-handler';

// Mock categories data as fallback
const mockCategories = [
  { id: 'technology', label: 'Technology' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'finance', label: 'Finance' },
  { id: 'education', label: 'Education' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'sales', label: 'Sales' },
  { id: 'design', label: 'Design' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'human-resources', label: 'Human Resources' },
  { id: 'operations', label: 'Operations' },
  { id: 'customer-service', label: 'Customer Service' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'retail', label: 'Retail' },
  { id: 'consulting', label: 'Consulting' },
  { id: 'media', label: 'Media' },
  { id: 'legal', label: 'Legal' },
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'transportation', label: 'Transportation' },
  { id: 'government', label: 'Government' },
  { id: 'non-profit', label: 'Non-profit' }
];

export async function GET(request: NextRequest) {
  try {
    // Try to fetch from backend first, but have a fallback
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  // TODO: Complete function implementation
}
      const res = await fetch(`${backendUrl}/categories`, {
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });
      
      if (res.ok) {
        const categories = await res.json();
        return Response.json({ categories })}
    } catch (backendError) {
      // console.warn('Backend not available, using mock data:', backendError)}
    
    // Fallback to mock data
    return Response.json({ categories: mockCategories })} catch (error) {
    console.error("Error:", error);
    throw error}
    return handleApiError(error, {
      endpoint: 'GET /api/jobs/categories',
      context: {
        timestamp: new Date().toISOString()
      }})}
}
