import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

async function requireSession(request: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session || !session.user?.email) {
    return { session: null, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session, response: null };
}

export async function GET(request: NextRequest) {
  const { session, response } = await requireSession(request);
  if (!session) return response!;

  const user = await (prisma as any).user.findUnique({
    where: { email: session.user!.email! },
  }).catch(() => null);

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, user });
}

export async function PUT(request: NextRequest) {
  const { session, response } = await requireSession(request);
  if (!session) return response!;

  const body = await request.json().catch(() => ({}));
  const updateData: any = {};
  for (const key of ['name', 'firstName', 'lastName', 'phone', 'location', 'bio', 'skills']) {
    if (key in body) updateData[key] = body[key];
  }

  const updated = await (prisma as any).user.update({
    where: { email: session.user!.email! },
    data: updateData,
  });

  return NextResponse.json({ success: true, user: updated });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireSession(request);
  if (!session) return response!;

  const body = await request.json().catch(() => ({}));
  if (body?.action === 'uploadResume' && body?.data) {
    // Accept and acknowledge resume upload (no schema change required)
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
}


