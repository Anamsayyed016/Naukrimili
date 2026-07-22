'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSettingsData } from '@/components/settings/SettingsDataProvider';
import {
  PreferenceToggle,
  SettingsSectionCard,
} from '@/components/settings/SettingsPrimitives';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from '@/lib/settings/preferences';
import { Loader2 } from 'lucide-react';

const TOGGLE_META: Array<{
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
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 py-10 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading notification preferences…
      </div>
    );
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

  return (
    <div className="space-y-4">
      <SettingsSectionCard
        title="Notification preferences"
        description="Persists preference toggles in Settings KV. Inbox delivery still uses the existing notification system."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/notifications">Open inbox</Link>
          </Button>
        }
      >
        <div className="space-y-2">
          {TOGGLE_META.map((item) => (
            <PreferenceToggle
              key={item.key}
              id={`notif-${item.key}`}
              label={item.label}
              description={item.description}
              checked={local[item.key]}
              disabled={saving}
              onCheckedChange={(checked) =>
                setLocal((prev) => ({ ...prev, [item.key]: checked }))
              }
            />
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save preferences'}
          </Button>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
