'use client';

import { usePathname } from 'next/navigation';
import RazorpayConsoleFilter from './RazorpayConsoleFilter';

/** Only load Razorpay console filter on checkout-related routes (not homepage). */
const RAZORPAY_FILTER_PREFIXES = ['/pricing', '/resume-builder'];

export default function RazorpayConsoleFilterGate() {
  const pathname = usePathname();
  const enabled = RAZORPAY_FILTER_PREFIXES.some((prefix) => pathname?.startsWith(prefix));
  if (!enabled) return null;
  return <RazorpayConsoleFilter />;
}
