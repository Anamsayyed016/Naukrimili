'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useSettingsData } from '@/components/settings/SettingsDataProvider';
import {
  PreferenceToggle,
  SettingsField,
  SettingsLoadingState,
  SettingsSectionCard,
  settingsInputClassName,
} from '@/components/settings/SettingsPrimitives';
import type { WorkArrangement } from '@/lib/settings/preferences';
import { cn } from '@/lib/utils';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];

function normalizeJobTypes(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return value.split(',').map((part) => part.trim()).filter(Boolean);
    }
  }
  return [];
}

export default function JobPreferencesSection() {
  const {
    profile,
    preferences,
    loading,
    saving,
    updateProfile,
    updatePreferences,
  } = useSettingsData();
  const { toast } = useToast();
  const [preferredRole, setPreferredRole] = useState('');
  const [locationPreference, setLocationPreference] = useState('');
  const [salaryExpectation, setSalaryExpectation] = useState('');
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [workArrangement, setWorkArrangement] = useState<WorkArrangement>('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [openToWork, setOpenToWork] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setLocationPreference(profile.locationPreference || '');
    setSalaryExpectation(
      profile.salaryExpectation != null ? String(profile.salaryExpectation) : ''
    );
    setJobTypes(normalizeJobTypes(profile.jobTypePreference));
    const arrangement =
      preferences.jobExtras.workArrangement ||
      (profile.remotePreference ? 'remote' : '');
    setWorkArrangement(arrangement);
    setPreferredRole(preferences.jobExtras.preferredRole || '');
    setNoticePeriod(preferences.jobExtras.noticePeriod || '');
    setOpenToWork(preferences.jobExtras.openToWork);
  }, [profile, preferences.jobExtras]);

  const arrangements = useMemo(
    () =>
      [
        { id: 'remote', label: 'Remote' },
        { id: 'hybrid', label: 'Hybrid' },
        { id: 'onsite', label: 'Onsite' },
      ] as const,
    []
  );

  if (loading || !profile) {
    return <SettingsLoadingState label="Loading preferences…" />;
  }

  const handleSave = async () => {
    const profileOk = await updateProfile({
      firstName: profile.firstName,
      lastName: profile.lastName,
      name: profile.name,
      locationPreference,
      salaryExpectation: salaryExpectation
        ? Number(salaryExpectation)
        : null,
      jobTypePreference: jobTypes,
      remotePreference: workArrangement === 'remote',
    });
    const extrasOk = await updatePreferences({
      jobExtras: {
        workArrangement,
        noticePeriod,
        openToWork,
        preferredRole,
      },
    });
    const ok = profileOk && extrasOk;
    toast({
      title: ok ? 'Job preferences saved' : 'Save failed',
      description: ok
        ? 'User fields and extended preferences were updated.'
        : 'Could not save all job preferences.',
      variant: ok ? 'default' : 'destructive',
    });
  };

  return (
    <div className="space-y-5">
      <SettingsSectionCard
        title="Target roles"
        description="Tell us what you are looking for next."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField
            label="Preferred role"
            htmlFor="preferredRole"
            className="sm:col-span-2"
          >
            <Input
              id="preferredRole"
              value={preferredRole}
              onChange={(e) => setPreferredRole(e.target.value)}
              placeholder="e.g. Backend Engineer"
              className={settingsInputClassName}
            />
          </SettingsField>
          <SettingsField label="Preferred location" htmlFor="locationPreference">
            <Input
              id="locationPreference"
              value={locationPreference}
              onChange={(e) => setLocationPreference(e.target.value)}
              className={settingsInputClassName}
            />
          </SettingsField>
          <SettingsField
            label="Salary expectation (₹ / year)"
            htmlFor="salaryExpectation"
          >
            <Input
              id="salaryExpectation"
              type="number"
              min={0}
              value={salaryExpectation}
              onChange={(e) => setSalaryExpectation(e.target.value)}
              className={settingsInputClassName}
            />
          </SettingsField>
          <SettingsField label="Notice period" htmlFor="noticePeriod">
            <Input
              id="noticePeriod"
              value={noticePeriod}
              onChange={(e) => setNoticePeriod(e.target.value)}
              placeholder="e.g. 30 days"
              className={settingsInputClassName}
            />
          </SettingsField>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Work style"
        description="Employment type and where you prefer to work."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Employment type</p>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_TYPES.map((type) => {
                const selected = jobTypes.includes(type);
                return (
                  <label
                    key={type}
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors',
                      selected
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => {
                        const enabled = checked === true;
                        setJobTypes((prev) => {
                          if (enabled) {
                            return prev.includes(type) ? prev : [...prev, type];
                          }
                          return prev.filter((item) => item !== type);
                        });
                      }}
                      className="sr-only"
                    />
                    {type}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Work arrangement</p>
            <div className="flex flex-wrap gap-2">
              {arrangements.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setWorkArrangement((prev) =>
                      prev === item.id ? '' : item.id
                    )
                  }
                  className={cn(
                    'rounded-full border px-3.5 py-2 text-sm transition-all',
                    workArrangement === item.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <PreferenceToggle
              id="openToWork"
              label="Open to work"
              description="Signal that you are actively looking for opportunities."
              checked={openToWork}
              onCheckedChange={setOpenToWork}
              disabled={saving}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl px-5"
          >
            {saving ? 'Saving…' : 'Save preferences'}
          </Button>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
