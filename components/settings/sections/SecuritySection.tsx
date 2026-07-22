'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ComingSoonCard,
  SettingsSectionCard,
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
    <div className="space-y-4">
      <SettingsSectionCard
        title="Password"
        description="Uses the authenticated change-password API. Forgot-password remains available."
      >
        <div className="grid gap-3 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="sec-current">Current password</Label>
            <Input
              id="sec-current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sec-new">New password</Label>
            <Input
              id="sec-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sec-confirm">Confirm new password</Label>
            <Input
              id="sec-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handlePasswordChange} disabled={saving}>
              {saving ? 'Updating…' : 'Change password'}
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/forgot-password">Forgot password</Link>
            </Button>
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Connected accounts"
        description="Shows providers linked through existing NextAuth accounts. Management UI is limited to avoid fake controls."
      >
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            Signed in as{' '}
            <strong>{session?.user?.email || 'your account'}</strong>
          </p>
          <p className="text-xs text-gray-500">
            Google / GitHub connections are managed by the existing auth
            providers. LinkedIn and Microsoft are not configured in production
            auth today.
          </p>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title="Advanced security">
        <div className="space-y-2">
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
          className="mt-2"
        >
          Sign out this device
        </Button>
      </SettingsSectionCard>
    </div>
  );
}
