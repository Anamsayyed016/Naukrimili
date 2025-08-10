"use client";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

// Lazy import demo data function; provide safe fallback if module missing
let getDemoHero: (() => Promise<{ headline: string; subheadline: string; image?: string }>) | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  getDemoHero = require("@/lib/demo-data").getDemoHero;
} catch {
  getDemoHero = async () => ({
    headline: "Discover top talent & opportunities",
    subheadline: "Demo mode active. This data is static.",
    image: undefined,
  });
}

interface HeroSectionProps {
  isDemoMode?: boolean;
}

export default function HeroSection({ isDemoMode = false }: HeroSectionProps) {
  const { data: session } = useSession();
  const { data: demoData, isError, isLoading } = useQuery({
    queryKey: ["demo-hero"],
    queryFn: () => getDemoHero!(),
    enabled: isDemoMode,
  });

  if (isDemoMode) {
    if (isError) return <div className="py-12 text-center">Failed to load hero section.</div>;
    if (isLoading || !demoData) return <div className="py-12 text-center">Loading hero...</div>;
    return (
      <section className="text-center py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{demoData.headline}</h1>
        <p className="text-lg mb-6 text-muted-foreground">{demoData.subheadline}</p>
        {demoData.image && (
          <div className="relative mx-auto max-w-xl">
            <Image
              src={demoData.image}
              alt="Hero"
              width={960}
              height={540}
              className="rounded-xl shadow-lg"
              priority
            />
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="hero bg-gradient-to-r from-blue-700 to-indigo-900 text-white py-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Find Your Dream Job with <span className="text-secondary">NaukriMili</span>
        </h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          AI-powered job matching, resume analysis, and career tools for job seekers and employers.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          {!session ? (
            <>
              <Link
                href="/auth/register"
                className="inline-block bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-full font-medium transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/jobs"
                className="inline-block bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full font-medium border-2 border-white/30 transition-colors"
              >
                Browse Jobs
              </Link>
            </>
          ) : (
            <Link
              href="/dashboard"
              className="inline-block bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-full font-medium transition-colors"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}