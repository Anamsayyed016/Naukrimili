'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSettingsData } from '@/components/settings/SettingsDataProvider';
import {
  PreferenceToggle,
  SettingsLoadingState,
  SettingsSectionCard,
} from '@/components/settings/SettingsPrimitives';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from '@/lib/settings/preferences';

const CHANNEL_TOGGLES: Array<{
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}> = [
  {
    key: 'emailNotifications',
    label: 'Email notifications',
    description: 'Master switch for email alerts.',
  },
  {
    key: 'pushNotifications',
    label: 'Push notifications',
    description: 'Browser / device push alerts when available.',
  },
];

const ACTIVITY_TOGGLES: Array<{
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}> = [
  {
    key: 'jobAlerts',
    label: 'Job alerts',
    description: 'New jobs matching your preferences.',
  },
  {
    key: 'recruiterMessages',
    label: 'Recruiter messages',
    description: 'Messages from recruiters and companies.',
  },
  {
    key: 'interviewInvites',
    label: 'Interview invites',
    description: 'Interview scheduling and reminders.',
  },
  {
    key: 'applicationUpdates',
    label: 'Application updates',
    description: 'Status changes on your applications.',
  },
  {
    key: 'resumeViewed',
    label: 'Resume viewed',
    description: 'When a recruiter views your resume.',
  },
  {
    key: 'savedSearches',
    label: 'Saved searches',
    description: 'Alerts for saved job searches.',
  },
];

const SYSTEM_TOGGLES: Array<{
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}> = [
  {
    key: 'securityAlerts',
    label: 'Security alerts',
    description: 'Sign-in and security-related notices.',
  },
  {
    key: 'billingAlerts',
    label: 'Billing alerts',
    description: 'Plan renewals, credits, and invoices.',
  },
  {
    key: 'marketingEmails',
    label: 'Marketing emails',
    description: 'Product tips and promotions.',
  },
  {
    key: 'newsletter',
    label: 'Newsletter',
    description: 'Periodic career and product newsletter.',
  },
];

function ToggleGroup({
  items,
  local,
  saving,
  onChange,
}: {
  items: Array<{
    key: keyof NotificationPreferences;
    label: string;
    description: string;
  }>;
  local: NotificationPreferences;
  saving: boolean;
  onChange: (key: keyof NotificationPreferences, checked: boolean) => void;
}) {
  return (
    <div className="divide-y divide-slate-100 rounded-xl border border-slate-150 overflow-hidden bg-white">
      {items.map((item) => (
        <PreferenceToggle
          key={item.key}
          id={`notif-${item.key}`}
          label={item.label}
          description={item.description}
          checked={local[item.key]}
          disabled={saving}
          onCheckedChange={(checked) => onChange(item.key, checked)}
        />
      ))}
    </div>
  );
}

export default function NotificationsSection() {
  const { preferences, loading, saving, updatePreferences } = useSettingsData();
  const { toast } = useToast();
  const [local, setLocal] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );

  useEffect(() => {
    setLocal(preferences.notifications);
  }, [preferences.notifications]);

  if (loading) {
    return <SettingsLoadingState label="Loading notification preferences…" />;
  }

  const handleSave = async () => {
    const ok = await updatePreferences({ notifications: local });
    toast({
      title: ok ? 'Notification preferences saved' : 'Save failed',
      description: ok
        ? 'Only preferences were updated — your notification inbox is unchanged.'
        : 'Could not save notification preferences.',
      variant: ok ? 'default' : 'destructive',
    });
  };

  const onChange = (key: keyof NotificationPreferences, checked: boolean) => {
    setLocal((prev) => ({ ...prev, [key]: checked }));
  };

  return (
    <div className="space-y-5">
      <SettingsSectionCard
        title="Channels"
        description="Choose how you want to receive alerts."
        action={
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href="/dashboard/notifications">Open inbox</Link>
          </Button>
        }
      >
        <ToggleGroup
          items={CHANNEL_TOGGLES}
          local={local}
          saving={saving}
          onChange={onChange}
        />
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Job activity"
        description="Stay informed about applications, interviews, and recruiter outreach."
      >
        <ToggleGroup
          items={ACTIVITY_TOGGLES}
          local={local}
          saving={saving}
          onChange={onChange}
        />
      </SettingsSectionCard>

      <SettingsSectionCard
        title="System & marketing"
        description="Security, billing, and optional product communications."
      >
        <ToggleGroup
          items={SYSTEM_TOGGLES}
          local={local}
          saving={saving}
          onChange={onChange}
        />
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
