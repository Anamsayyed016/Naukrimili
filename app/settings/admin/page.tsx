import { redirect } from 'next/navigation';

/** Role stub retained for backward-compatible URLs. */
export default function AdminSettingsPage() {
  redirect('/settings?section=account');
}
