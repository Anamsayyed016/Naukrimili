import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import {
  USER_SETTINGS_KEYS,
  defaultUserSettingsPreferences,
  mergeJobExtras,
  mergeNotificationPreferences,
  mergePrivacyPreferences,
  mergeResumeSettings,
  mergeUiPreferences,
  type JobExtrasPreferences,
  type NotificationPreferences,
  type PrivacyPreferences,
  type ResumeSettingsPreferences,
  type UiPreferences,
  type UserSettingsPreferences,
} from '@/lib/settings/preferences';

/**
 * GET/PUT user settings preferences.
 * Persists into existing Prisma `Settings` KV — does not alter User schema
 * or duplicate profile/payment/notification inbox systems.
 */

async function readSettingsBundle(userId: string): Promise<UserSettingsPreferences> {
  const rows = await prisma.settings.findMany({
    where: {
      userId,
      key: { in: Object.values(USER_SETTINGS_KEYS) },
    },
  });
  const byKey = new Map(rows.map((row) => [row.key, row.value]));

  return {
    notifications: mergeNotificationPreferences(
      byKey.get(USER_SETTINGS_KEYS.notifications)
    ),
    privacy: mergePrivacyPreferences(byKey.get(USER_SETTINGS_KEYS.privacy)),
    ui: mergeUiPreferences(byKey.get(USER_SETTINGS_KEYS.ui)),
    resume: mergeResumeSettings(byKey.get(USER_SETTINGS_KEYS.resume)),
    jobExtras: mergeJobExtras(byKey.get(USER_SETTINGS_KEYS.jobExtras)),
  };
}

async function upsertSetting(userId: string, key: string, value: unknown) {
  await prisma.settings.upsert({
    where: { userId_key: { userId, key } },
    create: { userId, key, value: value as object },
    update: { value: value as object },
  });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const preferences = await readSettingsBundle(session.user.id);
    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error('[user-settings] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      notifications?: Partial<NotificationPreferences>;
      privacy?: Partial<PrivacyPreferences>;
      ui?: Partial<UiPreferences>;
      resume?: Partial<ResumeSettingsPreferences>;
      jobExtras?: Partial<JobExtrasPreferences>;
    };

    const current = await readSettingsBundle(session.user.id);
    const next: UserSettingsPreferences = {
      notifications: mergeNotificationPreferences({
        ...current.notifications,
        ...(body.notifications || {}),
      }),
      privacy: mergePrivacyPreferences({
        ...current.privacy,
        ...(body.privacy || {}),
      }),
      ui: mergeUiPreferences({
        ...current.ui,
        ...(body.ui || {}),
        editorPreferences: {
          ...current.ui.editorPreferences,
          ...(body.ui?.editorPreferences || {}),
        },
      }),
      resume: mergeResumeSettings({
        ...current.resume,
        ...(body.resume || {}),
      }),
      jobExtras: mergeJobExtras({
        ...current.jobExtras,
        ...(body.jobExtras || {}),
      }),
    };

    const writes: Promise<void>[] = [];
    if (body.notifications) {
      writes.push(
        upsertSetting(
          session.user.id,
          USER_SETTINGS_KEYS.notifications,
          next.notifications
        )
      );
    }
    if (body.privacy) {
      writes.push(
        upsertSetting(session.user.id, USER_SETTINGS_KEYS.privacy, next.privacy)
      );
    }
    if (body.ui) {
      writes.push(
        upsertSetting(session.user.id, USER_SETTINGS_KEYS.ui, next.ui)
      );
    }
    if (body.resume) {
      writes.push(
        upsertSetting(session.user.id, USER_SETTINGS_KEYS.resume, next.resume)
      );
    }
    if (body.jobExtras) {
      writes.push(
        upsertSetting(
          session.user.id,
          USER_SETTINGS_KEYS.jobExtras,
          next.jobExtras
        )
      );

      // Keep legacy User.remotePreference in sync when work arrangement is set
      if (body.jobExtras.workArrangement !== undefined) {
        writes.push(
          prisma.user
            .update({
              where: { id: session.user.id },
              data: {
                remotePreference:
                  body.jobExtras.workArrangement === 'remote',
              },
            })
            .then(() => undefined)
        );
      }
    }

    if (writes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No settings fields provided' },
        { status: 400 }
      );
    }

    await Promise.all(writes);

    return NextResponse.json({ success: true, preferences: next });
  } catch (error) {
    console.error('[user-settings] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

/** Exported for tests / defaults */
export { defaultUserSettingsPreferences };
