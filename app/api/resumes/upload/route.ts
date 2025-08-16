import type { NextRequest } from 'next/server';
export { GET } from '@/app/api/upload/resume/route';

// Delegate to the real upload handler to avoid duplicating logic
export async function POST(request: NextRequest) {
  const mod = await import('@/app/api/upload/resume/route');
  return mod.POST(request);
}


