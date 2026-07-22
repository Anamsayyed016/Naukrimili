/**
 * User settings preferences — stored in existing Prisma `Settings` KV table.
 * Does NOT duplicate User profile fields or payment/notification inbox systems.
 */

export const USER_SETTINGS_KEYS = {
  notifications: 'settings.notifications',
  privacy: 'settings.privacy',
  ui: 'settings.ui',
  resume: 'settings.resume',
  jobExtras: 'settings.jobExtras',
} as const;

export type WorkArrangement = 'remote' | 'hybrid' | 'onsite' | '';

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  jobAlerts: boolean;
  recruiterMessages: boolean;
  interviewInvites: boolean;
  applicationUpdates: boolean;
  resumeViewed: boolean;
  savedSearches: boolean;
  securityAlerts: boolean;
  billingAlerts: boolean;
  marketingEmails: boolean;
  newsletter: boolean;
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private' | 'connections';
  resumeVisibility: 'public' | 'private' | 'recruiters';
  hidePhone: boolean;
  hideEmail: boolean;
  hideSalary: boolean;
  searchEngineVisibility: boolean;
  recruiterVisibility: boolean;
  blockedCompanies: string[];
}

export interface UiPreferences {
  theme: 'system' | 'light' | 'dark';
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  dashboardLayout: 'default' | 'compact';
  defaultResumeTemplate: string;
  defaultResumeColor: string;
  defaultFont: string;
  editorPreferences: {
    autoSave: boolean;
    compactToolbar: boolean;
  };
}

export interface ResumeSettingsPreferences {
  defaultResumeId: string | null;
  resumeVisibility: 'public' | 'private' | 'recruiters';
  allowDownloads: boolean;
}

export interface JobExtrasPreferences {
  /** Extends User.remotePreference boolean with hybrid/onsite. */
  workArrangement: WorkArrangement;
  noticePeriod: string;
  openToWork: boolean;
  preferredRole: string;
}

export interface UserSettingsPreferences {
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  ui: UiPreferences;
  resume: ResumeSettingsPreferences;
  jobExtras: JobExtrasPreferences;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  jobAlerts: true,
  recruiterMessages: true,
  interviewInvites: true,
  applicationUpdates: true,
  resumeViewed: true,
  savedSearches: true,
  securityAlerts: true,
  billingAlerts: true,
  marketingEmails: false,
  newsletter: false,
};

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  profileVisibility: 'public',
  resumeVisibility: 'recruiters',
  hidePhone: false,
  hideEmail: false,
  hideSalary: true,
  searchEngineVisibility: false,
  recruiterVisibility: true,
  blockedCompanies: [],
};

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  theme: 'system',
  language: 'en',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  dashboardLayout: 'default',
  defaultResumeTemplate: '',
  defaultResumeColor: '',
  defaultFont: '',
  editorPreferences: {
    autoSave: true,
    compactToolbar: false,
  },
};

export const DEFAULT_RESUME_SETTINGS: ResumeSettingsPreferences = {
  defaultResumeId: null,
  resumeVisibility: 'recruiters',
  allowDownloads: true,
};

export const DEFAULT_JOB_EXTRAS: JobExtrasPreferences = {
  workArrangement: '',
  noticePeriod: '',
  openToWork: false,
  preferredRole: '',
};

export function defaultUserSettingsPreferences(): UserSettingsPreferences {
  return {
    notifications: { ...DEFAULT_NOTIFICATION_PREFERENCES },
    privacy: { ...DEFAULT_PRIVACY_PREFERENCES, blockedCompanies: [] },
    ui: {
      ...DEFAULT_UI_PREFERENCES,
      editorPreferences: { ...DEFAULT_UI_PREFERENCES.editorPreferences },
    },
    resume: { ...DEFAULT_RESUME_SETTINGS },
    jobExtras: { ...DEFAULT_JOB_EXTRAS },
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function mergeNotificationPreferences(
  raw: unknown
): NotificationPreferences {
  const base = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  if (!isObject(raw)) return base;
  for (const key of Object.keys(base) as (keyof NotificationPreferences)[]) {
    if (typeof raw[key] === 'boolean') base[key] = raw[key] as boolean;
  }
  return base;
}

export function mergePrivacyPreferences(raw: unknown): PrivacyPreferences {
  const base = {
    ...DEFAULT_PRIVACY_PREFERENCES,
    blockedCompanies: [] as string[],
  };
  if (!isObject(raw)) return base;
  if (
    raw.profileVisibility === 'public' ||
    raw.profileVisibility === 'private' ||
    raw.profileVisibility === 'connections'
  ) {
    base.profileVisibility = raw.profileVisibility;
  }
  if (
    raw.resumeVisibility === 'public' ||
    raw.resumeVisibility === 'private' ||
    raw.resumeVisibility === 'recruiters'
  ) {
    base.resumeVisibility = raw.resumeVisibility;
  }
  for (const key of [
    'hidePhone',
    'hideEmail',
    'hideSalary',
    'searchEngineVisibility',
    'recruiterVisibility',
  ] as const) {
    if (typeof raw[key] === 'boolean') base[key] = raw[key] as boolean;
  }
  if (Array.isArray(raw.blockedCompanies)) {
    base.blockedCompanies = raw.blockedCompanies
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 50);
  }
  return base;
}

export function mergeUiPreferences(raw: unknown): UiPreferences {
  const base = {
    ...DEFAULT_UI_PREFERENCES,
    editorPreferences: { ...DEFAULT_UI_PREFERENCES.editorPreferences },
  };
  if (!isObject(raw)) return base;
  if (raw.theme === 'system' || raw.theme === 'light' || raw.theme === 'dark') {
    base.theme = raw.theme;
  }
  for (const key of [
    'language',
    'timezone',
    'currency',
    'dateFormat',
    'defaultResumeTemplate',
    'defaultResumeColor',
    'defaultFont',
  ] as const) {
    if (typeof raw[key] === 'string') base[key] = raw[key] as string;
  }
  if (raw.dashboardLayout === 'default' || raw.dashboardLayout === 'compact') {
    base.dashboardLayout = raw.dashboardLayout;
  }
  if (isObject(raw.editorPreferences)) {
    if (typeof raw.editorPreferences.autoSave === 'boolean') {
      base.editorPreferences.autoSave = raw.editorPreferences.autoSave;
    }
    if (typeof raw.editorPreferences.compactToolbar === 'boolean') {
      base.editorPreferences.compactToolbar =
        raw.editorPreferences.compactToolbar;
    }
  }
  return base;
}

export function mergeResumeSettings(raw: unknown): ResumeSettingsPreferences {
  const base = { ...DEFAULT_RESUME_SETTINGS };
  if (!isObject(raw)) return base;
  if (raw.defaultResumeId === null || typeof raw.defaultResumeId === 'string') {
    base.defaultResumeId = raw.defaultResumeId as string | null;
  }
  if (
    raw.resumeVisibility === 'public' ||
    raw.resumeVisibility === 'private' ||
    raw.resumeVisibility === 'recruiters'
  ) {
    base.resumeVisibility = raw.resumeVisibility;
  }
  if (typeof raw.allowDownloads === 'boolean') {
    base.allowDownloads = raw.allowDownloads;
  }
  return base;
}

export function mergeJobExtras(raw: unknown): JobExtrasPreferences {
  const base = { ...DEFAULT_JOB_EXTRAS };
  if (!isObject(raw)) return base;
  if (
    raw.workArrangement === 'remote' ||
    raw.workArrangement === 'hybrid' ||
    raw.workArrangement === 'onsite' ||
    raw.workArrangement === ''
  ) {
    base.workArrangement = raw.workArrangement;
  }
  if (typeof raw.noticePeriod === 'string') base.noticePeriod = raw.noticePeriod;
  if (typeof raw.openToWork === 'boolean') base.openToWork = raw.openToWork;
  if (typeof raw.preferredRole === 'string') {
    base.preferredRole = raw.preferredRole;
  }
  return base;
}
