import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

/**
 * Workspace preference API for jobseekers.
 *
 * Stores the user's preferred default workspace ("jobs" | "resume-builder")
 * inside the existing key/value `Settings` table under key='preferredWorkspace'.
 *
 * GET  → returns { workspace: 'jobs' | 'resume-builder' | null }
 * POST → body: { workspace, remember }
 *         - remember=true  → upserts the preference
 *         - remember=false → deletes the preference (and the next login re-prompts)
 */

const SETTINGS_KEY = 'preferredWorkspace';
const ALLOWED_WORKSPACES = ['jobs', 'resume-builder'] as const;
type Workspace = (typeof ALLOWED_WORKSPACES)[number];

function isWorkspace(value: unknown): value is Workspace {
  return typeof value === 'string' && (ALLOWED_WORKSPACES as readonly string[]).includes(value);
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const setting = await prisma.settings.findUnique({
      where: { userId_key: { userId: session.user.id, key: SETTINGS_KEY } },
    });

    const raw = setting?.value as unknown;
    const workspace = isWorkspace(raw) ? raw : null;

    return NextResponse.json({ success: true, workspace });
  } catch (error) {
    console.error('[workspace-pref] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load preference' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      workspace?: unknown;
      remember?: unknown;
    };

    const remember = body.remember === true;

    // Clear preference path — user opted out of "Remember my choice"
    if (!remember) {
      await prisma.settings.deleteMany({
        where: { userId: session.user.id, key: SETTINGS_KEY },
      });
      return NextResponse.json({ success: true, workspace: null });
    }

    if (!isWorkspace(body.workspace)) {
      return NextResponse.json(
        { success: false, error: 'Invalid workspace value' },
        { status: 400 }
      );
    }

    await prisma.settings.upsert({
      where: { userId_key: { userId: session.user.id, key: SETTINGS_KEY } },
      create: {
        userId: session.user.id,
        key: SETTINGS_KEY,
        value: body.workspace,
      },
      update: { value: body.workspace },
    });

    return NextResponse.json({ success: true, workspace: body.workspace });
  } catch (error) {
    console.error('[workspace-pref] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save preference' },
      { status: 500 }
    );
  }
}
