'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import LinkPhoneSection from '@/components/auth/LinkPhoneSection';
import AccountProfilePhotoUpload from '@/components/account/AccountProfilePhotoUpload';
import { useSettingsData } from '@/components/settings/SettingsDataProvider';
import {
  SettingsField,
  SettingsLoadingState,
  SettingsSectionCard,
  settingsInputClassName,
} from '@/components/settings/SettingsPrimitives';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AccountSection() {
  const { profile, loading, saving, updateProfile, refresh } = useSettingsData();
  const { update: updateSession } = useSession();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [photoVersion, setPhotoVersion] = useState<number | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName || '');
    setLastName(profile.lastName || '');
    setLocation(profile.location || '');
  }, [profile]);

  if (loading || !profile) {
    return <SettingsLoadingState label="Loading account…" />;
  }

  const handleSave = async () => {
    const ok = await updateProfile({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      location,
    });
    toast({
      title: ok ? 'Account updated' : 'Update failed',
      description: ok
        ? 'Your personal information was saved.'
        : 'Could not save account details.',
      variant: ok ? 'default' : 'destructive',
    });
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Confirm your new password and try again.',
        variant: 'destructive',
      });
      return;
    }
    setPasswordSaving(true);
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
      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Password change failed',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SettingsSectionCard
        title="Profile photo"
        description="Your account avatar appears across the portal — navbar, dashboard, and applications. This is separate from your resume photo."
      >
        <AccountProfilePhotoUpload
          profilePicture={profile.profilePicture}
          oauthImage={profile.image}
          firstName={firstName}
          lastName={lastName}
          email={profile.email}
          cacheVersion={photoVersion}
          onPhotoSaved={async ({ profilePicture, version }) => {
            setPhotoVersion(version);
            await refresh();
            await updateSession({ profilePicture });
          }}
          onPhotoRemoved={async ({ version }) => {
            setPhotoVersion(version);
            await refresh();
            await updateSession({ profilePicture: null });
          }}
        />
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Personal information"
        description="Basic identity details stored on your existing user profile."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField label="First name" htmlFor="firstName">
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={settingsInputClassName}
            />
          </SettingsField>
          <SettingsField label="Last name" htmlFor="lastName">
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={settingsInputClassName}
            />
          </SettingsField>
          <SettingsField
            label="Email"
            htmlFor="email"
            hint="Email changes require a verified flow and are not available here yet."
            className="sm:col-span-2"
          >
            <Input
              id="email"
              value={profile.email}
              disabled
              className={cn(settingsInputClassName, 'bg-slate-50 text-slate-500')}
            />
          </SettingsField>
          <SettingsField
            label="Location"
            htmlFor="location"
            className="sm:col-span-2"
          >
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
              className={settingsInputClassName}
            />
          </SettingsField>
        </div>
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl px-5"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Mobile number"
        description="Verified through the existing OTP phone linking flow."
      >
        <LinkPhoneSection
          currentPhone={profile.phone}
          phoneVerified={!!profile.phoneVerified}
          onLinked={() => {
            void refresh();
          }}
        />
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Change password"
        description="Update your password securely. Forgot-password remains available."
      >
        <div className="grid max-w-md gap-4">
          <SettingsField label="Current password" htmlFor="currentPassword">
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className={settingsInputClassName}
            />
          </SettingsField>
          <SettingsField label="New password" htmlFor="newPassword">
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className={settingsInputClassName}
            />
          </SettingsField>
          <SettingsField label="Confirm new password" htmlFor="confirmPassword">
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className={settingsInputClassName}
            />
          </SettingsField>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              onClick={handlePasswordChange}
              disabled={passwordSaving || !currentPassword || !newPassword}
              className="rounded-xl"
            >
              {passwordSaving ? 'Updating…' : 'Update password'}
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/auth/forgot-password">Forgot password?</Link>
            </Button>
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Account status"
        description="Current account state and session controls."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={profile.isActive === false ? 'destructive' : 'default'}
            className="rounded-full px-2.5"
          >
            {profile.isActive === false ? 'Inactive' : 'Active'}
          </Badge>
          {profile.isVerified ? (
            <Badge variant="secondary" className="rounded-full px-2.5">
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-full px-2.5">
              Email verification pending
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto rounded-lg text-slate-600"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Sign out
          </Button>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
