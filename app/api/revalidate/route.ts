import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const secret =
    request.headers.get('x-revalidate-secret') ??
    request.nextUrl.searchParams.get('secret');
  const expected =
    process.env.REVALIDATE_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  revalidatePath('/');
  revalidateTag('homepage');

  return NextResponse.json({
    revalidated: true,
    paths: ['/'],
    tags: ['homepage'],
    timestamp: new Date().toISOString(),
  });
}
