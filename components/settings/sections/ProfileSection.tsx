'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSettingsData } from '@/components/settings/SettingsDataProvider';
import { SettingsSectionCard } from '@/components/settings/SettingsPrimitives';
import { Loader2 } from 'lucide-react';

export default function ProfileSection() {
  const { profile, loading, saving, updateProfile } = useSettingsData();
  const { toast } = useToast();
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [objective, setObjective] = useState('');

  useEffect(() => {
    if (!profile) return;
    setHeadline('');
    setBio(profile.bio || '');
    setExperience(profile.experience || '');
    setSkills((profile.skills || []).join(', '));
    setObjective('');
  }, [profile]);

  if (loading || !profile) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 py-10 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading profile…
      </div>
    );
  }

  const handleSave = async () => {
    const skillsList = skills
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const combinedBio = [bio, objective && `Objective: ${objective}`]
      .filter(Boolean)
      .join('\n\n');
    const ok = await updateProfile({
      firstName: profile.firstName,
      lastName: profile.lastName,
      name: profile.name,
      bio: combinedBio || bio,
      experience: headline
        ? `${headline}${experience ? `\n${experience}` : ''}`
        : experience,
      skills: skillsList,
    });
    toast({
      title: ok ? 'Profile updated' : 'Update failed',
      description: ok
        ? 'Professional profile details were saved.'
        : 'Could not save profile.',
      variant: ok ? 'default' : 'destructive',
    });
  };

  return (
    <div className="space-y-4">
      <SettingsSectionCard
        title="Professional profile"
        description="Reuses the existing jobseeker profile API — no parallel profile system."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/jobseeker/profile">Open full editor</Link>
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="headline">Professional headline</Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Full Stack Developer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">About me</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Short professional summary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="objective">Career objective</Label>
            <Textarea
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
              placeholder="What roles you are targeting"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="experienceSummary">Experience summary</Label>
            <Textarea
              id="experienceSummary"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">Skills summary</Label>
            <Input
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Comma-separated skills"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
