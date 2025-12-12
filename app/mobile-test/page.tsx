"use client";
import nextDynamic from 'next/dynamic';

// Mark this route as dynamic without conflicting with the import identifier
export const dynamic = 'force-dynamic';

// Use a distinct identifier to avoid shadowing the exported `dynamic` string
const ClientMobileTest = nextDynamic(() => import('./ClientMobileTest'), { ssr: false });

export default function Page() {
  return <ClientMobileTest />;
}
