'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import LinkPhoneSection from '@/components/auth/LinkPhoneSection';
import { useSettingsData } from '@/components/settings/SettingsDataProvider';
import { SettingsSectionCard } from '@/components/settings/SettingsPrimitives';
import { Loader2 } from 'lucide-react';

export default function AccountSection() {
  const { profile, loading, saving, updateProfile, refresh } = useSettingsData();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName || '');
    setLastName(profile.lastName || '');
    setLocation(profile.location || '');
    setProfilePicture(profile.profilePicture || '');
  }, [profile]);

  if (loading || !profile) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 py-10 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading account…
      </div>
    );
  }

  const initials =
    `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() ||
    profile.email?.[0]?.toUpperCase() ||
    'U';

  const handleSave = async () => {
    const ok = await updateProfile({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      location,
      profilePicture: profilePicture || undefined,
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
    <div className="space-y-4">
      <SettingsSectionCard
        title="Profile photo"
        description="Paste an image URL for now. Upload pipeline uses the existing profile picture field."
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <Avatar className="h-20 w-20 border border-gray-200">
            <AvatarImage src={profilePicture || undefined} alt="Profile" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 w-full space-y-2">
            <Label htmlFor="profilePicture">Photo URL</Label>
            <Input
              id="profilePicture"
              value={profilePicture}
              onChange={(e) => setProfilePicture(e.target.value)}
              placeholder="https://…"
            />
            <p className="text-xs text-gray-500">
              Dedicated file upload will reuse the existing storage stack in a
              later release — no parallel uploader.
            </p>
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Personal information"
        description="Stored on your existing user profile."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled />
            <p className="text-xs text-gray-500">
              Email changes require a verified flow and are not available here yet.
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
        description="Uses the existing OTP phone linking flow."
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
        description="Authenticated password change for accounts that already have a password."
      >
        <div className="grid gap-3 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handlePasswordChange}
              disabled={passwordSaving || !currentPassword || !newPassword}
            >
              {passwordSaving ? 'Updating…' : 'Update password'}
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/forgot-password">Forgot password?</Link>
            </Button>
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title="Account status">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={profile.isActive === false ? 'destructive' : 'default'}>
            {profile.isActive === false ? 'Inactive' : 'Active'}
          </Badge>
          {profile.isVerified ? (
            <Badge variant="secondary">Verified</Badge>
          ) : (
            <Badge variant="outline">Email verification pending</Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Sign out
          </Button>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
