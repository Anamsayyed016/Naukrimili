'use client';

import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { SettingsSectionCard } from '@/components/settings/SettingsPrimitives';

const FAQ_ITEMS = [
  {
    q: 'How do I upgrade my plan?',
    a: 'Open Billing in Settings or go to Pricing. Existing Razorpay checkout and coupons are unchanged.',
  },
  {
    q: 'Where is my resume editor?',
    a: 'Use Resume → Edit in Resume Builder. Settings never duplicates the builder.',
  },
  {
    q: 'How do I change my password?',
    a: 'Use Account or Security → Change password. OAuth-only accounts should use Set Password / Forgot Password.',
  },
  {
    q: 'Can I delete my account?',
    a: 'Yes, under Privacy → Delete account. Active applications must be withdrawn first.',
  },
];

export default function HelpSection() {
  return (
    <div className="space-y-4">
      <SettingsSectionCard title="FAQ">
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={item.q} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-sm">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-600">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Contact & support"
        description="Reuses the existing contact form — no parallel ticket system."
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/contact">Contact support</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact?topic=bug">Report a bug</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact?topic=feature">Feature request</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact?topic=ticket">Raise a ticket</Link>
          </Button>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title="Policies & notes">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/privacy">Privacy Policy</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/terms">Terms</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/cookies">Cookies</Link>
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Release notes are published with product updates. A dedicated release
          feed is not available in this build.
        </p>
      </SettingsSectionCard>
    </div>
  );
}
