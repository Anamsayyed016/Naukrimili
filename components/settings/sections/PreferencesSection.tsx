'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSettingsData } from '@/components/settings/SettingsDataProvider';
import {
  PreferenceToggle,
  SettingsField,
  SettingsLoadingState,
  SettingsSectionCard,
  settingsInputClassName,
} from '@/components/settings/SettingsPrimitives';
import {
  DEFAULT_UI_PREFERENCES,
  type UiPreferences,
} from '@/lib/settings/preferences';

export default function PreferencesSection() {
  const { preferences, loading, saving, updatePreferences } = useSettingsData();
  const { toast } = useToast();
  const [local, setLocal] = useState<UiPreferences>(DEFAULT_UI_PREFERENCES);

  useEffect(() => {
    setLocal({
      ...preferences.ui,
      editorPreferences: { ...preferences.ui.editorPreferences },
    });
  }, [preferences.ui]);

  if (loading) {
    return <SettingsLoadingState label="Loading preferences…" />;
  }

  const handleSave = async () => {
    const ok = await updatePreferences({ ui: local });
    toast({
      title: ok ? 'Preferences saved' : 'Save failed',
      description: ok
        ? 'UI preferences stored in the existing Settings table.'
        : 'Could not save preferences.',
      variant: ok ? 'default' : 'destructive',
    });
  };

  return (
    <div className="space-y-5">
      <SettingsSectionCard
        title="App preferences"
        description="Theme and locale preferences stored for your account."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField label="Theme">
            <Select
              value={local.theme}
              onValueChange={(value) =>
                setLocal((prev) => ({
                  ...prev,
                  theme: value as UiPreferences['theme'],
                }))
              }
            >
              <SelectTrigger className={settingsInputClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>
          <SettingsField label="Language">
            <Select
              value={local.language}
              onValueChange={(value) =>
                setLocal((prev) => ({ ...prev, language: value }))
              }
            >
              <SelectTrigger className={settingsInputClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>
          <SettingsField label="Timezone" htmlFor="timezone">
            <Input
              id="timezone"
              value={local.timezone}
              onChange={(e) =>
                setLocal((prev) => ({ ...prev, timezone: e.target.value }))
              }
              className={settingsInputClassName}
            />
          </SettingsField>
          <SettingsField label="Currency">
            <Select
              value={local.currency}
              onValueChange={(value) =>
                setLocal((prev) => ({ ...prev, currency: value }))
              }
            >
              <SelectTrigger className={settingsInputClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>
          <SettingsField label="Date format">
            <Select
              value={local.dateFormat}
              onValueChange={(value) =>
                setLocal((prev) => ({ ...prev, dateFormat: value }))
              }
            >
              <SelectTrigger className={settingsInputClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>
          <SettingsField label="Dashboard layout">
            <Select
              value={local.dashboardLayout}
              onValueChange={(value) =>
                setLocal((prev) => ({
                  ...prev,
                  dashboardLayout: value as UiPreferences['dashboardLayout'],
                }))
              }
            >
              <SelectTrigger className={settingsInputClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Resume editor defaults"
        description="Saved preferences only — does not modify Resume Builder templates or entitlements."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField label="Default resume template" htmlFor="defaultTemplate">
            <Input
              id="defaultTemplate"
              value={local.defaultResumeTemplate}
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  defaultResumeTemplate: e.target.value,
                }))
              }
              placeholder="Template id (optional)"
              className={settingsInputClassName}
            />
          </SettingsField>
          <SettingsField label="Default resume color" htmlFor="defaultColor">
            <Input
              id="defaultColor"
              value={local.defaultResumeColor}
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  defaultResumeColor: e.target.value,
                }))
              }
              placeholder="Color id (optional)"
              className={settingsInputClassName}
            />
          </SettingsField>
          <SettingsField
            label="Default font"
            htmlFor="defaultFont"
            className="sm:col-span-2"
          >
            <Input
              id="defaultFont"
              value={local.defaultFont}
              onChange={(e) =>
                setLocal((prev) => ({ ...prev, defaultFont: e.target.value }))
              }
              placeholder="Font family (optional)"
              className={settingsInputClassName}
            />
          </SettingsField>
        </div>
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          <PreferenceToggle
            id="autoSave"
            label="Editor auto-save preference"
            checked={local.editorPreferences.autoSave}
            onCheckedChange={(checked) =>
              setLocal((prev) => ({
                ...prev,
                editorPreferences: {
                  ...prev.editorPreferences,
                  autoSave: checked,
                },
              }))
            }
            disabled={saving}
          />
          <PreferenceToggle
            id="compactToolbar"
            label="Compact editor toolbar"
            checked={local.editorPreferences.compactToolbar}
            onCheckedChange={(checked) =>
              setLocal((prev) => ({
                ...prev,
                editorPreferences: {
                  ...prev.editorPreferences,
                  compactToolbar: checked,
                },
              }))
            }
            disabled={saving}
          />
        </div>
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
