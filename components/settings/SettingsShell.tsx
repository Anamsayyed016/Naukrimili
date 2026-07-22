'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { SETTINGS_NAV, type SettingsSectionId } from '@/components/settings/nav';

interface SettingsShellProps {
  activeSection: SettingsSectionId;
  onSectionChange: (id: SettingsSectionId) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function NavList({
  activeSection,
  onSelect,
  className,
}: {
  activeSection: SettingsSectionId;
  onSelect: (id: SettingsSectionId) => void;
  className?: string;
}) {
  return (
    <nav className={cn('space-y-1', className)} aria-label="Settings sections">
      {SETTINGS_NAV.map((item) => {
        const Icon = item.icon;
        const active = activeSection === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              'w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
              active
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                : 'text-gray-700 hover:bg-gray-50 border border-transparent'
            )}
          >
            <Icon
              className={cn(
                'w-4 h-4 mt-0.5 shrink-0',
                active ? 'text-indigo-600' : 'text-gray-500'
              )}
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="block text-xs text-gray-500 truncate">
                {item.description}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function SettingsShell({
  activeSection,
  onSectionChange,
  mobileOpen,
  onMobileOpenChange,
  children,
}: SettingsShellProps) {
  const activeMeta = SETTINGS_NAV.find((item) => item.id === activeSection);

  return (
    <div className="min-h-[70vh]">
      <div className="flex items-center justify-between gap-3 mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your account, privacy, billing, and preferences
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="lg:hidden"
          onClick={() => onMobileOpenChange(true)}
          aria-label="Open settings menu"
        >
          <Menu className="w-4 h-4 mr-2" />
          Menu
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <NavList
              activeSection={activeSection}
              onSelect={onSectionChange}
            />
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 lg:hidden">
            <p className="text-sm font-semibold text-gray-900">
              {activeMeta?.label}
            </p>
            <p className="text-xs text-gray-500">{activeMeta?.description}</p>
          </div>
          {children}
        </section>
      </div>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-[min(100%,320px)] bg-white p-4 shadow-xl',
            'border-r border-gray-200 outline-none'
          )}
        >
          <SheetTitle className="text-lg font-semibold text-gray-900 mb-4">
            Settings
          </SheetTitle>
          <NavList
            activeSection={activeSection}
            onSelect={(id) => {
              onSectionChange(id);
              onMobileOpenChange(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
