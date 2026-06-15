import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles,
  FileText,
  LayoutTemplate,
  Brain,
  Target,
  Download,
  UserPlus,
  Link2,
  Share2,
  IndianRupee,
  ChevronRight,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getGoAffProDashboardUrl, getGoAffProRegisterUrl, getGoAffProAffiliateLandingUrl } from '@/lib/goaffpro';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Affiliate Partners Program | Earn with Naukrimili Resume Builder',
  description:
    'Join the Naukrimili affiliate program. Promote premium resume templates, AI resume tools, ATS optimization, and resume builder plans — earn commission on every qualifying purchase.',
  openGraph: {
    title: 'Naukrimili Affiliate Partners Program',
    description:
      'Earn commissions by promoting premium resume builder products, templates, and AI career tools.',
  },
};

const PROMOTE_PRODUCTS = [
  {
    icon: LayoutTemplate,
    title: 'Premium Resume Templates',
    description: 'Professional, recruiter-ready designs job seekers pay for.',
  },
  {
    icon: FileText,
    title: 'Resume Builder Premium Plans',
    description: 'Mini Starter, Starter Premium, and Pro Job Seeker subscriptions.',
  },
  {
    icon: Download,
    title: 'Premium Resume Downloads',
    description: 'PDF exports and download credits included in paid plans.',
  },
  {
    icon: Brain,
    title: 'AI Resume Features',
    description: 'AI optimization, cover letters, and smart content suggestions.',
  },
  {
    icon: Target,
    title: 'ATS Optimization',
    description: 'Advanced ATS scoring and keyword alignment tools.',
  },
  {
    icon: Sparkles,
    title: 'Resume Credits & Career Services',
    description: 'Business partner plans with resume credits and premium access.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    icon: UserPlus,
    title: 'Join',
    description: 'Register as an affiliate through our GoAffPro partner portal.',
  },
  {
    step: '2',
    icon: Link2,
    title: 'Get Link',
    description: 'Share your link — visitors land on the Resume Builder start page ready to create a resume.',
  },
  {
    step: '3',
    icon: Share2,
    title: 'Share',
    description: 'Promote resume builder plans, templates, and premium tools to your audience.',
  },
  {
    step: '4',
    icon: IndianRupee,
    title: 'Earn',
    description: 'Earn commission when referred users purchase qualifying resume products.',
  },
];

const COMMISSION_ITEMS = [
  'Resume Builder premium plans (₹99 – ₹199 individual tiers)',
  'Business partner subscriptions with resume credits',
  'Premium template access and paid download packages',
  'AI resume optimization and ATS feature upgrades',
];

const FAQ_ITEMS = [
  {
    q: 'What products can I promote as an affiliate?',
    a: 'Focus on Naukrimili Resume Builder — premium templates, paid plans, resume credits, AI resume tools, ATS optimization, and premium PDF downloads. These are the products that generate affiliate commissions.',
  },
  {
    q: 'Do I earn commission on free job applications?',
    a: 'No. The affiliate program is designed around paid resume builder and career-service products, not free job browsing or applications.',
  },
  {
    q: 'How do I get my referral link?',
    a: `After registering and account approval, log in to the GoAffPro affiliate dashboard for your unique code. Point referrals to the Resume Builder start page, e.g. ${getGoAffProAffiliateLandingUrl('YOUR_CODE')}. Legacy homepage links with ?ref= still work and redirect automatically.`,
  },
  {
    q: 'When are commissions paid?',
    a: 'Commissions are tracked automatically when a referred visitor completes a qualifying purchase. Payout schedules and thresholds are managed in your GoAffPro affiliate dashboard.',
  },
  {
    q: 'How long does affiliate approval take?',
    a: 'New affiliate accounts may take 24–48 hours for verification, as noted by GoAffPro during registration.',
  },
];

function AffiliateCta({
  registerUrl,
  dashboardUrl,
}: {
  registerUrl: string;
  dashboardUrl: string;
}) {
  const registerDisabled = !registerUrl;
  const dashboardDisabled = !dashboardUrl;

  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
      {registerDisabled ? (
        <Button size="lg" disabled className="min-h-[48px] px-8">
          Become Affiliate
        </Button>
      ) : (
        <Button size="lg" asChild className="min-h-[48px] bg-slate-900 px-8 hover:bg-slate-800">
          <a href={registerUrl} target="_blank" rel="noopener noreferrer">
            Become Affiliate
            <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
          </a>
        </Button>
      )}
      {dashboardDisabled ? (
        <Button size="lg" variant="outline" disabled className="min-h-[48px] px-8">
          Affiliate Dashboard
        </Button>
      ) : (
        <Button size="lg" variant="outline" asChild className="min-h-[48px] px-8">
          <a href={dashboardUrl} target="_blank" rel="noopener noreferrer">
            Affiliate Dashboard
            <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
          </a>
        </Button>
      )}
    </div>
  );
}

export default function AffiliatePage() {
  const registerUrl = getGoAffProRegisterUrl();
  const dashboardUrl = getGoAffProDashboardUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-100">
            Partner Program
          </p>
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            Earn with the Naukrimili Affiliate Program
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100 md:text-xl">
            Promote premium resume templates, AI resume tools, ATS optimization, and resume builder
            plans. Earn commission when your audience upgrades their career toolkit.
          </p>
          <AffiliateCta registerUrl={registerUrl} dashboardUrl={dashboardUrl} />
        </div>
      </section>

      {/* Why Promote */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Why Promote Naukrimili</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              High-demand career products your audience already needs — built around resume success,
              not free job listings.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PROMOTE_PRODUCTS.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-slate-200/80 bg-white shadow-md transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-lg text-gray-600">Four simple steps from signup to commission.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="relative text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-lg font-bold text-white">
                    {item.step}
                  </div>
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Commission */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
            <CardContent className="p-8 md:p-12">
              <div className="mb-6 flex items-center gap-3">
                <IndianRupee className="h-8 w-8 text-teal-400" aria-hidden />
                <h2 className="text-2xl font-bold md:text-3xl">Earn Commission on Resume Products</h2>
              </div>
              <p className="mb-8 max-w-2xl text-slate-300">
                Commissions apply to paid resume builder purchases made through your referral link.
                Promote products your audience values — premium templates, AI tools, and plan upgrades.
                Referral traffic lands on{' '}
                <span className="font-medium text-white">/resume-builder/start</span> so users begin
                building a resume immediately.
              </p>
              <ul className="mb-8 space-y-3">
                {COMMISSION_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-200">
                    <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-teal-400" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/pricing"
                  className="inline-flex items-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                >
                  View Plans to Promote
                </Link>
                <Link
                  href="/resume-builder/start"
                  className="inline-flex items-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                >
                  Resume Builder Landing
                </Link>
                <Link
                  href="/resume-builder/templates"
                  className="inline-flex items-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                >
                  Browse Premium Templates
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white/60 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <HelpCircle className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-slate-200 bg-white shadow-sm open:shadow-md"
              >
                <summary className="cursor-pointer list-none px-5 py-4 text-base font-semibold text-gray-900 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-90" aria-hidden />
                  </span>
                </summary>
                <div className="border-t border-slate-100 px-5 pb-4 pt-2 text-sm leading-relaxed text-gray-600">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold">Ready to Become an Affiliate Partner?</h2>
          <p className="mb-8 text-lg text-blue-100">
            Join thousands of creators, career coaches, and educators helping job seekers build
            better resumes — and earn while you do it.
          </p>
          <AffiliateCta registerUrl={registerUrl} dashboardUrl={dashboardUrl} />
          <p className="mt-6 text-sm text-blue-200">
            Already registered?{' '}
            {dashboardUrl ? (
              <a
                href={dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 hover:text-white"
              >
                Open your affiliate dashboard
              </a>
            ) : (
              'Use the Affiliate Dashboard button above.'
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
