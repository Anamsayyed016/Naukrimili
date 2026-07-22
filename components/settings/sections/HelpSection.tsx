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
    <div className="space-y-5">
      <SettingsSectionCard
        title="FAQ"
        description="Quick answers to the most common questions."
      >
        <Accordion
          type="single"
          collapsible
          className="overflow-hidden rounded-xl border border-slate-200"
        >
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem
              key={item.q}
              value={`item-${index}`}
              className="border-b border-slate-100 px-4 last:border-b-0"
            >
              <AccordionTrigger className="py-3.5 text-left text-sm font-medium text-slate-900 hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-3.5 text-[13px] leading-relaxed text-slate-500">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Contact & support"
        description="Reach us through the existing contact form."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild className="rounded-xl">
            <Link href="/contact">Contact support</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/contact?topic=bug">Report a bug</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/contact?topic=feature">Feature request</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/contact?topic=ticket">Raise a ticket</Link>
          </Button>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Policies"
        description="Legal documents for the platform."
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href="/privacy">Privacy Policy</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href="/terms">Terms</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href="/cookies">Cookies</Link>
          </Button>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
          Release notes are published with product updates. A dedicated release
          feed is not available in this build.
        </p>
      </SettingsSectionCard>
    </div>
  );
}
