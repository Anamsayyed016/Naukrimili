import { readFile, stat } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import {
  contentTypeForProfilePictureFilename,
  resolveLocalProfilePictureFilePath,
} from '@/lib/storage/profile-picture-storage';

export const runtime = 'nodejs';

const SAFE_USER_ID = /^[a-zA-Z0-9_-]+$/;
const SAFE_FILENAME = /^[a-zA-Z0-9._-]+$/;

/**
 * Stream locally stored account profile pictures.
 * Mirrors the resume disk-read pattern (app/api/resumes/[id]/view/route.ts)
 * but public — avatars are shown to employers and across the portal.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string; filename: string }> }
) {
  try {
    const { userId, filename } = await context.params;

    if (!SAFE_USER_ID.test(userId) || !SAFE_FILENAME.test(filename)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const filepath = resolveLocalProfilePictureFilePath(`${userId}/${filename}`);

    try {
      await stat(filepath);
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(filepath);
    const contentType = contentTypeForProfilePictureFilename(filename);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileBuffer.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[profile-photo/asset] GET error:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}
