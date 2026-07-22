'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  SettingsSectionCard,
} from '@/components/settings/SettingsPrimitives';
import {
  DEFAULT_UI_PREFERENCES,
  type UiPreferences,
} from '@/lib/settings/preferences';
import { Loader2 } from 'lucide-react';

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
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 py-10 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading preferences…
      </div>
    );
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
    <div className="space-y-4">
      <SettingsSectionCard
        title="App preferences"
        description="Theme and layout preferences are stored in Settings KV. App-wide dark mode provider is not fully wired — values are saved for future use."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={local.theme}
              onValueChange={(value) =>
                setLocal((prev) => ({
                  ...prev,
                  theme: value as UiPreferences['theme'],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              value={local.language}
              onValueChange={(value) =>
                setLocal((prev) => ({ ...prev, language: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={local.timezone}
              onChange={(e) =>
                setLocal((prev) => ({ ...prev, timezone: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={local.currency}
              onValueChange={(value) =>
                setLocal((prev) => ({ ...prev, currency: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date format</Label>
            <Select
              value={local.dateFormat}
              onValueChange={(value) =>
                setLocal((prev) => ({ ...prev, dateFormat: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Dashboard layout</Label>
            <Select
              value={local.dashboardLayout}
              onValueChange={(value) =>
                setLocal((prev) => ({
                  ...prev,
                  dashboardLayout: value as UiPreferences['dashboardLayout'],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Resume editor defaults"
        description="Saved preferences only — does not modify Resume Builder templates or payment entitlements."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="defaultTemplate">Default resume template</Label>
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultColor">Default resume color</Label>
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
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="defaultFont">Default font</Label>
            <Input
              id="defaultFont"
              value={local.defaultFont}
              onChange={(e) =>
                setLocal((prev) => ({ ...prev, defaultFont: e.target.value }))
              }
              placeholder="Font family (optional)"
            />
          </div>
        </div>
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
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save preferences'}
          </Button>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
