'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import {
  SETTINGS_NAV,
  SETTINGS_NAV_GROUPS,
  type SettingsSectionId,
} from '@/components/settings/nav';

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
    <nav className={cn('space-y-5', className)} aria-label="Settings sections">
      {SETTINGS_NAV_GROUPS.map((group) => (
        <div key={group.id} className="space-y-1.5">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    'relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left',
                    'transition-all duration-200 ease-out',
                    active
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15'
                      : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                      active
                        ? 'bg-white/10 text-white'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-tight">
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 block text-[11px] leading-snug truncate',
                        active ? 'text-slate-300' : 'text-slate-400'
                      )}
                    >
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
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
      <div className="mb-7 flex items-start justify-between gap-4 lg:mb-9">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600/80">
            Workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-[2rem]">
            Settings
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-slate-500 md:text-[15px]">
            Manage your account, career profile, privacy, and billing in one
            place.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="lg:hidden rounded-xl border-slate-200 shadow-sm"
          onClick={() => onMobileOpenChange(true)}
          aria-label="Open settings menu"
        >
          <Menu className="mr-2 h-4 w-4" />
          Menu
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[272px_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.25)] backdrop-blur-sm">
            <NavList
              activeSection={activeSection}
              onSelect={onSectionChange}
            />
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="lg:hidden rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm">
            <p className="text-base font-semibold text-slate-900">
              {activeMeta?.label}
            </p>
            <p className="text-[13px] text-slate-500">
              {activeMeta?.description}
            </p>
          </div>
          {children}
        </section>
      </div>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-[min(100%,320px)] overflow-y-auto',
            'border-r border-slate-200 bg-white p-4 shadow-2xl outline-none'
          )}
        >
          <SheetTitle className="mb-5 text-lg font-semibold tracking-tight text-slate-900">
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
