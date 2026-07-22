'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  SettingsSectionCard,
} from '@/components/settings/SettingsPrimitives';
import { ExternalLink, Loader2 } from 'lucide-react';

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
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 py-10 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading resume settings…
      </div>
    );
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
    <div className="space-y-4">
      <SettingsSectionCard
        title="Resume management"
        description="Links into the existing resume dashboard and Resume Builder — no duplicate editor."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/jobseeker/resumes">My resumes</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/resume-builder">
                Edit in Resume Builder
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        }
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Default resume</Label>
            <Select value={defaultResumeId} onValueChange={setDefaultResumeId}>
              <SelectTrigger>
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
          </div>
          <div className="space-y-2">
            <Label>Resume visibility</Label>
            <Select
              value={resumeVisibility}
              onValueChange={(value) =>
                setResumeVisibility(value as typeof resumeVisibility)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="recruiters">Recruiters only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <PreferenceToggle
          id="allowDownloads"
          label="Allow resume downloads"
          description="Controls your preference for recruiter downloads."
          checked={allowDownloads}
          onCheckedChange={setAllowDownloads}
          disabled={saving}
        />

        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 text-sm text-gray-600 space-y-1">
          <p>
            Stored resumes: <strong>{resumes.length}</strong>
          </p>
          <p className="text-xs">
            Download history, version history, and AI usage are tracked by the
            existing payment and resume systems below.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save resume settings'}
          </Button>
        </div>
      </SettingsSectionCard>

      <PaymentStatusCard />
    </div>
  );
}
