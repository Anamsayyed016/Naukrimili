'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Saved jobs count lives on the dashboard; list browsing uses Jobs. */
export default function JobSeekerBookmarksRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/jobs');
  }, [router]);

  return null;
}
