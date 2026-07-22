'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useSettingsData } from '@/components/settings/SettingsDataProvider';
import {
  PreferenceToggle,
  SettingsSectionCard,
} from '@/components/settings/SettingsPrimitives';
import type { WorkArrangement } from '@/lib/settings/preferences';
import { Loader2 } from 'lucide-react';
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
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 py-10 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading preferences…
      </div>
    );
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
    <div className="space-y-4">
      <SettingsSectionCard
        title="Job preferences"
        description="Core fields use the existing User table. Hybrid/onsite, notice period, and open-to-work use Settings KV extras."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="preferredRole">Preferred role</Label>
            <Input
              id="preferredRole"
              value={preferredRole}
              onChange={(e) => setPreferredRole(e.target.value)}
              placeholder="e.g. Backend Engineer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationPreference">Preferred location</Label>
            <Input
              id="locationPreference"
              value={locationPreference}
              onChange={(e) => setLocationPreference(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salaryExpectation">Salary expectation (₹ / year)</Label>
            <Input
              id="salaryExpectation"
              type="number"
              min={0}
              value={salaryExpectation}
              onChange={(e) => setSalaryExpectation(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="noticePeriod">Notice period</Label>
            <Input
              id="noticePeriod"
              value={noticePeriod}
              onChange={(e) => setNoticePeriod(e.target.value)}
              placeholder="e.g. 30 days"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Employment type</Label>
          <div className="flex flex-wrap gap-3">
            {EMPLOYMENT_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={jobTypes.includes(type)}
                  onCheckedChange={(checked) => {
                    const enabled = checked === true;
                    setJobTypes((prev) => {
                      if (enabled) {
                        return prev.includes(type) ? prev : [...prev, type];
                      }
                      return prev.filter((item) => item !== type);
                    });
                  }}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Work arrangement</Label>
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
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  workArrangement === item.id
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <PreferenceToggle
          id="openToWork"
          label="Open to work"
          description="Signal that you are actively looking for opportunities."
          checked={openToWork}
          onCheckedChange={setOpenToWork}
          disabled={saving}
        />

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save preferences'}
          </Button>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
