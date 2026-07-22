import type { LucideIcon } from 'lucide-react';
import {
  User,
  IdCard,
  Briefcase,
  FileText,
  Bell,
  Shield,
  Lock,
  CreditCard,
  SlidersHorizontal,
  HelpCircle,
} from 'lucide-react';

export type SettingsSectionId =
  | 'account'
  | 'profile'
  | 'job-preferences'
  | 'resume'
  | 'notifications'
  | 'privacy'
  | 'security'
  | 'billing'
  | 'preferences'
  | 'help';

export interface SettingsNavItem {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface SettingsNavGroup {
  id: string;
  label: string;
  items: SettingsNavItem[];
}

export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    id: 'account',
    label: 'Account',
    description: 'Personal details and password',
    icon: User,
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Professional headline and about',
    icon: IdCard,
  },
  {
    id: 'job-preferences',
    label: 'Job Preferences',
    description: 'Roles, location, and salary',
    icon: Briefcase,
  },
  {
    id: 'resume',
    label: 'Resume',
    description: 'Default resume and credits',
    icon: FileText,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Email and alert preferences',
    icon: Bell,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    description: 'Visibility and account deletion',
    icon: Shield,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Password and sign-in options',
    icon: Lock,
  },
  {
    id: 'billing',
    label: 'Billing',
    description: 'Plan, credits, and invoices',
    icon: CreditCard,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Theme, language, and editor',
    icon: SlidersHorizontal,
  },
  {
    id: 'help',
    label: 'Help & Support',
    description: 'FAQ, contact, and policies',
    icon: HelpCircle,
  },
];

/** Visual grouping only — section ids and routes unchanged. */
export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    id: 'account-group',
    label: 'Account',
    items: SETTINGS_NAV.filter((item) =>
      ['account', 'security', 'preferences'].includes(item.id)
    ),
  },
  {
    id: 'career-group',
    label: 'Career',
    items: SETTINGS_NAV.filter((item) =>
      ['profile', 'job-preferences'].includes(item.id)
    ),
  },
  {
    id: 'resume-group',
    label: 'Resume',
    items: SETTINGS_NAV.filter((item) => item.id === 'resume'),
  },
  {
    id: 'privacy-group',
    label: 'Privacy',
    items: SETTINGS_NAV.filter((item) =>
      ['notifications', 'privacy'].includes(item.id)
    ),
  },
  {
    id: 'billing-group',
    label: 'Billing',
    items: SETTINGS_NAV.filter((item) => item.id === 'billing'),
  },
  {
    id: 'support-group',
    label: 'Support',
    items: SETTINGS_NAV.filter((item) => item.id === 'help'),
  },
];

export function isSettingsSectionId(
  value: string | null | undefined
): value is SettingsSectionId {
  return !!value && SETTINGS_NAV.some((item) => item.id === value);
}
