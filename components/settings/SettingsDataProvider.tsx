'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  defaultUserSettingsPreferences,
  type UserSettingsPreferences,
} from '@/lib/settings/preferences';

export interface SettingsProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone?: string | null;
  phoneVerified?: boolean;
  location?: string | null;
  bio?: string | null;
  skills?: string[];
  experience?: string | null;
  education?: string | null;
  profilePicture?: string | null;
  image?: string | null;
  locationPreference?: string | null;
  salaryExpectation?: number | null;
  jobTypePreference?: string | string[] | null;
  remotePreference?: boolean;
  isActive?: boolean;
  isVerified?: boolean;
  resumes?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    isActive: boolean;
    createdAt: string;
  }>;
  stats?: {
    totalResumes?: number;
  };
}

interface SettingsDataContextValue {
  profile: SettingsProfile | null;
  preferences: UserSettingsPreferences;
  loading: boolean;
  saving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfile: (patch: Record<string, unknown>) => Promise<boolean>;
  updatePreferences: (
    patch: Partial<UserSettingsPreferences>
  ) => Promise<boolean>;
}

const SettingsDataContext = createContext<SettingsDataContextValue | null>(null);

function parseSkills(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string');
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return raw
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function SettingsDataProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [preferences, setPreferences] = useState<UserSettingsPreferences>(
    defaultUserSettingsPreferences()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, prefsRes] = await Promise.all([
        fetch('/api/jobseeker/profile'),
        fetch('/api/user/settings/preferences'),
      ]);

      const profileJson = await profileRes.json().catch(() => ({}));
      const prefsJson = await prefsRes.json().catch(() => ({}));

      if (!profileRes.ok || !profileJson.success) {
        throw new Error(profileJson.error || 'Failed to load profile');
      }

      const user = profileJson.data;
      if (!user) {
        throw new Error('Profile payload missing');
      }

      setProfile({
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name:
          [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
          user.email,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        location: user.location,
        bio: user.bio,
        skills: parseSkills(user.skills),
        experience: user.experience,
        education: user.education,
        profilePicture: user.profilePicture,
        image: user.image,
        locationPreference: user.locationPreference,
        salaryExpectation: user.salaryExpectation,
        jobTypePreference: user.jobTypePreference,
        remotePreference: user.remotePreference,
        isActive: user.isActive,
        isVerified: user.isVerified,
        resumes: Array.isArray(user.resumes) ? user.resumes : [],
        stats: user.stats,
      });

      if (prefsRes.ok && prefsJson.success && prefsJson.preferences) {
        setPreferences(prefsJson.preferences);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateProfile = useCallback(async (patch: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/jobseeker/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to update profile');
      }
      await refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const updatePreferences = useCallback(
    async (patch: Partial<UserSettingsPreferences>) => {
      setSaving(true);
      setError(null);
      try {
        const response = await fetch('/api/user/settings/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok || !json.success) {
          throw new Error(json.error || 'Failed to save preferences');
        }
        if (json.preferences) {
          setPreferences(json.preferences);
        }
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to save preferences'
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      profile,
      preferences,
      loading,
      saving,
      error,
      refresh,
      updateProfile,
      updatePreferences,
    }),
    [
      profile,
      preferences,
      loading,
      saving,
      error,
      refresh,
      updateProfile,
      updatePreferences,
    ]
  );

  return (
    <SettingsDataContext.Provider value={value}>
      {children}
    </SettingsDataContext.Provider>
  );
}

export function useSettingsData() {
  const ctx = useContext(SettingsDataContext);
  if (!ctx) {
    throw new Error('useSettingsData must be used within SettingsDataProvider');
  }
  return ctx;
}
