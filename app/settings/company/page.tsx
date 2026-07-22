import { redirect } from 'next/navigation';

/** Role stub retained for backward-compatible URLs. */
export default function CompanySettingsPage() {
  redirect('/settings?section=account');
}
