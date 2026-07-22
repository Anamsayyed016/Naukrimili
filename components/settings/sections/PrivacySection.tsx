'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useSettingsData } from '@/components/settings/SettingsDataProvider';
import {
  PreferenceToggle,
  SettingsEmptyState,
  SettingsField,
  SettingsLoadingState,
  SettingsSectionCard,
  settingsInputClassName,
} from '@/components/settings/SettingsPrimitives';
import {
  DEFAULT_PRIVACY_PREFERENCES,
  type PrivacyPreferences,
} from '@/lib/settings/preferences';
import { Building2, Trash2 } from 'lucide-react';

export default function PrivacySection() {
  const { preferences, loading, saving, updatePreferences } = useSettingsData();
  const { toast } = useToast();
  const router = useRouter();
  const [local, setLocal] = useState<PrivacyPreferences>(
    DEFAULT_PRIVACY_PREFERENCES
  );
  const [blockedInput, setBlockedInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLocal({
      ...preferences.privacy,
      blockedCompanies: [...preferences.privacy.blockedCompanies],
    });
  }, [preferences.privacy]);

  if (loading) {
    return <SettingsLoadingState label="Loading privacy settings…" />;
  }

  const handleSave = async () => {
    const ok = await updatePreferences({ privacy: local });
    toast({
      title: ok ? 'Privacy settings saved' : 'Save failed',
      description: ok
        ? 'Visibility preferences were updated.'
        : 'Could not save privacy settings.',
      variant: ok ? 'default' : 'destructive',
    });
  };

  const addBlocked = () => {
    const value = blockedInput.trim();
    if (!value) return;
    if (local.blockedCompanies.includes(value)) {
      setBlockedInput('');
      return;
    }
    setLocal((prev) => ({
      ...prev,
      blockedCompanies: [...prev.blockedCompanies, value].slice(0, 50),
    }));
    setBlockedInput('');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/jobseeker/profile', { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete account');
      }
      toast({
        title: 'Account deleted',
        description: 'Your account and related data were removed.',
      });
      await signOut({ callbackUrl: '/' });
      router.push('/');
    } catch (error) {
      toast({
        title: 'Could not delete account',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <SettingsSectionCard
        title="Visibility"
        description="Control who can see your profile and resume."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField label="Profile visibility">
            <Select
              value={local.profileVisibility}
              onValueChange={(value) =>
                setLocal((prev) => ({
                  ...prev,
                  profileVisibility:
                    value as PrivacyPreferences['profileVisibility'],
                }))
              }
            >
              <SelectTrigger className={settingsInputClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="connections">Connections</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>
          <SettingsField label="Resume visibility">
            <Select
              value={local.resumeVisibility}
              onValueChange={(value) =>
                setLocal((prev) => ({
                  ...prev,
                  resumeVisibility:
                    value as PrivacyPreferences['resumeVisibility'],
                }))
              }
            >
              <SelectTrigger className={settingsInputClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="recruiters">Recruiters</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Privacy controls"
        description="Hide sensitive details from public views."
      >
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <PreferenceToggle
            id="hidePhone"
            label="Hide phone"
            checked={local.hidePhone}
            onCheckedChange={(checked) =>
              setLocal((prev) => ({ ...prev, hidePhone: checked }))
            }
            disabled={saving}
          />
          <PreferenceToggle
            id="hideEmail"
            label="Hide email"
            checked={local.hideEmail}
            onCheckedChange={(checked) =>
              setLocal((prev) => ({ ...prev, hideEmail: checked }))
            }
            disabled={saving}
          />
          <PreferenceToggle
            id="hideSalary"
            label="Hide salary expectation"
            checked={local.hideSalary}
            onCheckedChange={(checked) =>
              setLocal((prev) => ({ ...prev, hideSalary: checked }))
            }
            disabled={saving}
          />
          <PreferenceToggle
            id="searchEngineVisibility"
            label="Search engine visibility"
            description="Allow public profile indexing when available."
            checked={local.searchEngineVisibility}
            onCheckedChange={(checked) =>
              setLocal((prev) => ({ ...prev, searchEngineVisibility: checked }))
            }
            disabled={saving}
          />
          <PreferenceToggle
            id="recruiterVisibility"
            label="Recruiter visibility"
            checked={local.recruiterVisibility}
            onCheckedChange={(checked) =>
              setLocal((prev) => ({ ...prev, recruiterVisibility: checked }))
            }
            disabled={saving}
          />
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Blocked companies"
        description="Companies you prefer not to engage with."
      >
        <div className="flex gap-2">
          <Input
            value={blockedInput}
            onChange={(e) => setBlockedInput(e.target.value)}
            placeholder="Company name"
            className={settingsInputClassName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addBlocked();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addBlocked}
            className="rounded-xl"
          >
            Add
          </Button>
        </div>
        {local.blockedCompanies.length > 0 ? (
          <ul className="space-y-2">
            {local.blockedCompanies.map((company) => (
              <li
                key={company}
                className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 px-3.5 py-2.5 text-sm"
              >
                <span className="font-medium text-slate-800">{company}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-lg text-slate-500"
                  onClick={() =>
                    setLocal((prev) => ({
                      ...prev,
                      blockedCompanies: prev.blockedCompanies.filter(
                        (item) => item !== company
                      ),
                    }))
                  }
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <SettingsEmptyState
            icon={Building2}
            title="No blocked companies"
            description="Add a company name to keep them off your radar."
          />
        )}
        <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              const blob = new Blob(
                [JSON.stringify({ preferences: { privacy: local } }, null, 2)],
                { type: 'application/json' }
              );
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.download = 'naukrimili-privacy-export.json';
              anchor.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download personal data (prefs)
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl px-5"
          >
            {saving ? 'Saving…' : 'Save privacy'}
          </Button>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Delete account"
        description="Permanently remove your account and related data. Active applications must be withdrawn first."
        tone="danger"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={deleting}
              className="rounded-xl"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? 'Deleting…' : 'Delete my account'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes your account, resumes, applications, and bookmarks.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="rounded-xl"
              >
                Yes, delete account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SettingsSectionCard>
    </div>
  );
}
