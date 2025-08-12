import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// TODO: Integrate real auth (e.g., next-auth); placeholder extracts X-User-Id or uses env.SEED_USER_ID.
// This is a temporary implementation for development
function resolveUserId(req: NextRequest): string {
  const headerId = req.headers.get('x-user-id');
  return headerId || process.env.SEED_USER_ID || '000000000000000000000000';
}

export async function GET(request: NextRequest) {
  try {
    const userId = resolveUserId(request);
    // Upsert a minimal user if not present (email placeholder for dev)
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `${userId}@placeholder.local`,
        name: 'Placeholder User',
      },
    });

    let profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId: user.id, skills: [], location: null, bio: null },
      });
    }

    return NextResponse.json({ success: true, profile: { ...profile, user: { id: user.id, email: user.email, name: user.name } } });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Profile GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = resolveUserId(request);
    const data = await request.json();
    const profile = await prisma.profile.update({
      where: { userId },
      data: {
        skills: data.skills ?? undefined,
        location: data.location ?? undefined,
        bio: data.bio ?? undefined,
      },
    });
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }
    // eslint-disable-next-line no-console
    console.error('Profile PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = resolveUserId(request);
    const { action, data } = await request.json();
    switch (action) {
      case 'uploadResume': {
        // For now we just echo; real implementation would associate a Resume model.
        return NextResponse.json({ success: true, message: 'Resume upload placeholder', data });
      }
      case 'deleteResume': {
        return NextResponse.json({ success: true, message: 'Resume delete placeholder' });
      }
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Profile POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}