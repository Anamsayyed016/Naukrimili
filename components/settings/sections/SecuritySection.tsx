'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  ComingSoonCard,
  SettingsField,
  SettingsSectionCard,
  settingsInputClassName,
} from '@/components/settings/SettingsPrimitives';

export default function SecuritySection() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to change password');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password updated' });
    } catch (error) {
      toast({
        title: 'Password change failed',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SettingsSectionCard
        title="Password"
        description="Keep your account secure with a strong password."
      >
        <div className="grid max-w-md gap-4">
          <SettingsField label="Current password" htmlFor="sec-current">
            <Input
              id="sec-current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={settingsInputClassName}
            />
          </SettingsField>
          <SettingsField label="New password" htmlFor="sec-new">
            <Input
              id="sec-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={settingsInputClassName}
            />
          </SettingsField>
          <SettingsField label="Confirm new password" htmlFor="sec-confirm">
            <Input
              id="sec-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={settingsInputClassName}
            />
          </SettingsField>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              onClick={handlePasswordChange}
              disabled={saving}
              className="rounded-xl"
            >
              {saving ? 'Updating…' : 'Change password'}
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/auth/forgot-password">Forgot password</Link>
            </Button>
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Connected accounts"
        description="Sign-in providers linked through existing NextAuth accounts."
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-4">
          <p className="text-sm text-slate-700">
            Signed in as{' '}
            <span className="font-semibold text-slate-900">
              {session?.user?.email || 'your account'}
            </span>
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
            Google / GitHub connections are managed by the existing auth
            providers. LinkedIn and Microsoft are not configured in production
            auth today.
          </p>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Advanced security"
        description="Additional protections will appear here when available."
      >
        <div className="space-y-2.5">
          <ComingSoonCard
            title="Two-factor authentication"
            description="TOTP / authenticator 2FA is not implemented in production auth yet."
          />
          <ComingSoonCard
            title="Active sessions & connected devices"
            description="The app uses JWT sessions, so device lists are not available without a new session store."
          />
          <ComingSoonCard
            title="Recent login activity"
            description="No user-facing login audit API exists yet. OTP metadata is not exposed here."
          />
          <ComingSoonCard
            title="Logout other devices"
            description="Not available with the current JWT session strategy. Use Sign out on this device."
          />
        </div>
        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="mt-3 rounded-xl"
        >
          Sign out this device
        </Button>
      </SettingsSectionCard>
    </div>
  );
}
