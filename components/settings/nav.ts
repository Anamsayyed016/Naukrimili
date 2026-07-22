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

export function isSettingsSectionId(value: string | null | undefined): value is SettingsSectionId {
  return !!value && SETTINGS_NAV.some((item) => item.id === value);
}
