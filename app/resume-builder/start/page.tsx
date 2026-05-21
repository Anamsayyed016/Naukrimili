import type { Metadata } from 'next';
import ResumeBuilderStart from '@/components/resume-builder/ResumeBuilderStart';

export const metadata: Metadata = {
  title: 'Free ATS Resume Builder | AI-Powered CV Maker | Naukrimili',
  description:
    'Create an ATS-friendly resume in minutes with AI suggestions, professional templates, and instant PDF download. Start free on Naukrimili.',
  openGraph: {
    title: 'Free ATS Resume Builder | Naukrimili',
    description:
      'Build a recruiter-ready resume with AI guidance, ATS scoring, and premium templates.',
  },
};

export default function ResumeBuilderStartPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f7fb]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.12),transparent),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(139,92,246,0.08),transparent)]"
        aria-hidden
      />
      <main className="relative container mx-auto px-4 py-10 sm:px-6 md:py-14 lg:px-8 lg:py-16">
        <ResumeBuilderStart />
      </main>
    </div>
  );
}
