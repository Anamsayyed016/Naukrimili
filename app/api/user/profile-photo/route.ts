import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import {
  deleteStoredProfilePicture,
  uploadProfilePicture,
  validateProfilePictureFile,
} from '@/lib/storage/profile-picture-storage';
import { resolveUserAvatarUrl } from '@/lib/user/resolve-user-avatar';

export const runtime = 'nodejs';

async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    const validation = validateProfilePictureFile({
      name: file.name || 'profile.webp',
      type: file.type || 'image/webp',
      size: file.size,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await uploadProfilePicture(
      buffer,
      file.name || `profile-${Date.now()}.webp`,
      file.type || 'image/webp',
      file.size,
      userId
    );

    if (!upload.success || !upload.fileUrl) {
      return NextResponse.json(
        { success: false, error: upload.error || 'Upload failed' },
        { status: 500 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePicture: true, image: true },
    });

    if (existing?.profilePicture) {
      await deleteStoredProfilePicture(existing.profilePicture, userId);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        profilePicture: upload.fileUrl,
        updatedAt: new Date(),
      },
      select: {
        profilePicture: true,
        image: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      profilePicture: updated.profilePicture,
      avatarUrl: resolveUserAvatarUrl(updated.profilePicture, updated.image),
      version: updated.updatedAt?.getTime() ?? Date.now(),
    });
  } catch (error) {
    console.error('[profile-photo] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePicture: true, image: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (existing.profilePicture) {
      await deleteStoredProfilePicture(existing.profilePicture, userId);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        profilePicture: null,
        updatedAt: new Date(),
      },
      select: {
        profilePicture: true,
        image: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      profilePicture: null,
      avatarUrl: resolveUserAvatarUrl(null, updated.image),
      version: updated.updatedAt?.getTime() ?? Date.now(),
    });
  } catch (error) {
    console.error('[profile-photo] DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Remove failed',
      },
      { status: 500 }
    );
  }
}
