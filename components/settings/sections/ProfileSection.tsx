'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSettingsData } from '@/components/settings/SettingsDataProvider';
import {
  SettingsField,
  SettingsLoadingState,
  SettingsSectionCard,
  settingsInputClassName,
  settingsTextareaClassName,
} from '@/components/settings/SettingsPrimitives';

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
    return <SettingsLoadingState label="Loading profile…" />;
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
    <div className="space-y-5">
      <SettingsSectionCard
        title="Career identity"
        description="Headline and summary that represent you to recruiters."
        action={
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href="/dashboard/jobseeker/profile">Open full editor</Link>
          </Button>
        }
      >
        <div className="space-y-4">
          <SettingsField label="Professional headline" htmlFor="headline">
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Full Stack Developer"
              className={settingsInputClassName}
            />
          </SettingsField>
          <SettingsField label="About me" htmlFor="bio">
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Short professional summary"
              className={settingsTextareaClassName}
            />
          </SettingsField>
          <SettingsField label="Career objective" htmlFor="objective">
            <Textarea
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
              placeholder="What roles you are targeting"
              className={settingsTextareaClassName}
            />
          </SettingsField>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Experience & skills"
        description="A concise view of your background and strengths."
      >
        <div className="space-y-4">
          <SettingsField label="Experience summary" htmlFor="experienceSummary">
            <Textarea
              id="experienceSummary"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={3}
              className={settingsTextareaClassName}
            />
          </SettingsField>
          <SettingsField label="Skills summary" htmlFor="skills">
            <Input
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Comma-separated skills"
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
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
