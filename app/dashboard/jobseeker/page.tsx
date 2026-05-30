"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Upload, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import AuthGuard from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import DashboardStatCards from "@/components/dashboard/jobseeker/DashboardStatCards";
import RecommendedJobsSection from "@/components/dashboard/jobseeker/RecommendedJobsSection";
import SkillsInsightChips from "@/components/dashboard/jobseeker/SkillsInsightChips";
import CareerInsightsPanel from "@/components/dashboard/jobseeker/CareerInsightsPanel";
import ProfileCompletionWidget from "@/components/dashboard/jobseeker/ProfileCompletionWidget";
import ApplicationActivityPanel from "@/components/dashboard/jobseeker/ApplicationActivityPanel";
import QuickActions from "@/components/dashboard/jobseeker/QuickActions";
import type { DashboardStats, JobRecommendation, ProfileUser } from "@/components/dashboard/jobseeker/types";
import {
  extractCareerTitles,
  extractSkillsFromParsedData,
} from "@/components/dashboard/jobseeker/types";

const RECOMMENDATIONS_CACHE_KEY = "jobseeker_dashboard_recs_v1";
const RECOMMENDATIONS_CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedRecommendations {
  timestamp: number;
  jobs: JobRecommendation[];
}

function normalizeJob(raw: Record<string, unknown>): JobRecommendation {
  return {
    id: raw.id as string | number,
    title: String(raw.title || "Untitled Role"),
    company: (raw.company as JobRecommendation["company"]) || String(raw.company || "Company"),
    location: String(raw.location || "Location not specified"),
    jobType: raw.jobType ? String(raw.jobType) : undefined,
    salary: raw.salary ? String(raw.salary) : undefined,
    isRemote: Boolean(raw.isRemote),
    matchScore: typeof raw.matchScore === "number" ? raw.matchScore : 0,
    matchReasons: Array.isArray(raw.matchReasons) ? (raw.matchReasons as string[]) : [],
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    description: raw.description ? String(raw.description) : undefined,
  };
}

function readRecommendationsCache(): JobRecommendation[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RECOMMENDATIONS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRecommendations;
    if (Date.now() - parsed.timestamp > RECOMMENDATIONS_CACHE_TTL_MS) {
      sessionStorage.removeItem(RECOMMENDATIONS_CACHE_KEY);
      return null;
    }
    return parsed.jobs;
  } catch {
    return null;
  }
}

function writeRecommendationsCache(jobs: JobRecommendation[]): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedRecommendations = { timestamp: Date.now(), jobs };
    sessionStorage.setItem(RECOMMENDATIONS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors
  }
}

export default function JobSeekerDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [careerTitles, setCareerTitles] = useState<string[]>([]);
  const [resumeScore, setResumeScore] = useState<number | null>(null);
  const [resumeViews, setResumeViews] = useState(0);
  const [parsedData, setParsedData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(async (hasResume: boolean): Promise<JobRecommendation[]> => {
    if (!hasResume) return [];

    const cached = readRecommendationsCache();
    if (cached && cached.length > 0) {
      return cached;
    }

    const response = await fetch("/api/jobseeker/recommendations?limit=6&algorithm=hybrid");
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.success || !Array.isArray(data.data?.jobs)) return [];

    const jobs = data.data.jobs.map((job: Record<string, unknown>) => normalizeJob(job));
    writeRecommendationsCache(jobs);
    return jobs;
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const profileResponse = await fetch("/api/jobseeker/profile");
      if (!profileResponse.ok) return;

      const profileData = await profileResponse.json();
      if (!profileData.success) return;

      const profileStats = profileData.data.stats as DashboardStats;
      setStats(profileStats);
      setProfileUser({
        firstName: profileData.data.firstName,
        lastName: profileData.data.lastName,
        profilePicture: profileData.data.profilePicture,
        phone: profileData.data.phone,
        skills: profileData.data.skills,
      });

      const profileSkills: string[] = Array.isArray(profileData.data.skills)
        ? profileData.data.skills
        : [];

      const [resumesResult, viewsResult, jobs] = await Promise.all([
        fetch("/api/jobseeker/resumes?limit=1&status=active"),
        fetch("/api/resumes/views"),
        fetchRecommendations(profileStats.totalResumes > 0),
      ]);

      let parsed: Record<string, unknown> | null = null;
      let ats: number | null = null;

      if (resumesResult.ok) {
        const resumesData = await resumesResult.json();
        const activeResume = resumesData.data?.resumes?.find(
          (r: { isActive?: boolean }) => r.isActive
        ) || resumesData.data?.resumes?.[0];

        if (activeResume) {
          parsed = activeResume.parsedData || null;
          ats = typeof activeResume.atsScore === "number" ? activeResume.atsScore : null;
        }
      }

      setParsedData(parsed);
      setResumeScore(ats);

      const resumeSkills = extractSkillsFromParsedData(parsed);
      const mergedSkills = [...new Set([...profileSkills, ...resumeSkills])];
      setSkills(mergedSkills);
      setCareerTitles(extractCareerTitles(parsed));
      setRecommendations(jobs);

      if (viewsResult.ok) {
        const viewsData = await viewsResult.json();
        setResumeViews(typeof viewsData.data?.totalViews === "number" ? viewsData.data.totalViews : 0);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchRecommendations]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const firstName =
    (session?.user as { firstName?: string })?.firstName ||
    session?.user?.name?.split(" ")[0] ||
    "Job Seeker";

  return (
    <AuthGuard allowedRoles={["jobseeker"]}>
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Welcome */}
          <header className="mb-6 sm:mb-8">
            <p className="text-sm font-medium text-blue-600">Career Dashboard</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Your AI-powered job search hub — matches, skills, and activity in one place.
            </p>
            {loading && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                Loading your dashboard…
              </div>
            )}
          </header>

          {/* Setup banner when no resume */}
          {!loading && stats?.totalResumes === 0 && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Get personalized job matches</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Upload your resume once — we&apos;ll extract skills and surface top matches instantly.
                  </p>
                </div>
                <Link href="/resumes/upload">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 sm:w-auto">
                    <Upload className="mr-2 h-4 w-4" />
                    Open Resume Studio
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Stats row */}
          {stats && (
            <div className="mb-6 sm:mb-8">
              <DashboardStatCards
                stats={stats}
                recommendedCount={recommendations.length}
                resumeScore={resumeScore}
              />
            </div>
          )}

          {/* Top job matches */}
          <div className="mb-6 sm:mb-8">
            <RecommendedJobsSection jobs={recommendations} stats={stats} loading={loading} />
          </div>

          {/* Skills + Career + Profile completion */}
          <div className="mb-6 grid gap-4 sm:mb-8 lg:grid-cols-3 lg:gap-6">
            <div className="lg:col-span-1">
              <SkillsInsightChips skills={skills} />
            </div>
            <div className="lg:col-span-1">
              <CareerInsightsPanel titles={careerTitles} />
            </div>
            <div className="lg:col-span-1">
              {stats && (
                <ProfileCompletionWidget
                  completion={stats.profileCompletion}
                  user={profileUser}
                  parsedData={parsedData}
                />
              )}
            </div>
          </div>

          {/* Application activity */}
          {stats && (
            <div className="mb-6 sm:mb-8">
              <ApplicationActivityPanel
                appliedJobs={stats.totalApplications}
                interviewInvites={stats.interviewInvites}
                savedJobs={stats.totalBookmarks}
                resumeViews={resumeViews}
              />
            </div>
          )}

          {/* Quick actions */}
          <QuickActions stats={stats} />

          {/* Footer hint */}
          {!loading && recommendations.length > 0 && (
            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
              <Sparkles className="h-3.5 w-3.5" />
              Match scores powered by your resume and existing recommendation engine
            </p>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
