'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import PaymentStatusCard from '@/components/dashboard/PaymentStatusCard';
import { useSettingsData } from '@/components/settings/SettingsDataProvider';
import {
  PreferenceToggle,
  SettingsField,
  SettingsLoadingState,
  SettingsSectionCard,
  settingsInputClassName,
} from '@/components/settings/SettingsPrimitives';
import { ExternalLink } from 'lucide-react';

export default function ResumeSection() {
  const { profile, preferences, loading, saving, updatePreferences } =
    useSettingsData();
  const { toast } = useToast();
  const [defaultResumeId, setDefaultResumeId] = useState<string>('none');
  const [resumeVisibility, setResumeVisibility] = useState<
    'public' | 'private' | 'recruiters'
  >('recruiters');
  const [allowDownloads, setAllowDownloads] = useState(true);

  useEffect(() => {
    setDefaultResumeId(preferences.resume.defaultResumeId || 'none');
    setResumeVisibility(preferences.resume.resumeVisibility);
    setAllowDownloads(preferences.resume.allowDownloads);
  }, [preferences.resume]);

  if (loading) {
    return <SettingsLoadingState label="Loading resume settings…" />;
  }

  const resumes = profile?.resumes || [];

  const handleSave = async () => {
    const ok = await updatePreferences({
      resume: {
        defaultResumeId: defaultResumeId === 'none' ? null : defaultResumeId,
        resumeVisibility,
        allowDownloads,
      },
    });
    toast({
      title: ok ? 'Resume settings saved' : 'Save failed',
      description: ok
        ? 'Default resume and privacy preferences updated.'
        : 'Could not save resume settings.',
      variant: ok ? 'default' : 'destructive',
    });
  };

  return (
    <div className="space-y-5">
      <SettingsSectionCard
        title="Resume management"
        description="Choose defaults and jump into the existing Resume Builder."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/dashboard/jobseeker/resumes">My resumes</Link>
            </Button>
            <Button asChild size="sm" className="rounded-xl">
              <Link href="/resume-builder">
                Edit in Resume Builder
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField label="Default resume">
            <Select value={defaultResumeId} onValueChange={setDefaultResumeId}>
              <SelectTrigger className={settingsInputClassName}>
                <SelectValue placeholder="Select resume" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {resumes.map((resume) => (
                  <SelectItem key={resume.id} value={resume.id}>
                    {resume.fileName || resume.id}
                    {resume.isActive ? ' (active)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsField>
          <SettingsField label="Resume visibility">
            <Select
              value={resumeVisibility}
              onValueChange={(value) =>
                setResumeVisibility(value as typeof resumeVisibility)
              }
            >
              <SelectTrigger className={settingsInputClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="recruiters">Recruiters only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <PreferenceToggle
            id="allowDownloads"
            label="Allow resume downloads"
            description="Controls your preference for recruiter downloads."
            checked={allowDownloads}
            onCheckedChange={setAllowDownloads}
            disabled={saving}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
          <p>
            Stored resumes: <strong className="text-slate-900">{resumes.length}</strong>
          </p>
          <p className="mt-1 text-[12px] text-slate-500">
            Download history, version history, and AI usage are tracked by the
            existing payment and resume systems below.
          </p>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl px-5"
          >
            {saving ? 'Saving…' : 'Save resume settings'}
          </Button>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Credits & usage"
        description="Live entitlements from the existing payment status card."
      >
        <PaymentStatusCard />
      </SettingsSectionCard>
    </div>
  );
}
