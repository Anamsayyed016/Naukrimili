"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Upload, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import AuthGuard from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import DashboardStatCards from "@/components/dashboard/jobseeker/DashboardStatCards";
import RecommendedJobsSection from "@/components/dashboard/jobseeker/RecommendedJobsSection";
import AiInsightsPanel from "@/components/dashboard/jobseeker/AiInsightsPanel";
import ProfileCompletionWidget from "@/components/dashboard/jobseeker/ProfileCompletionWidget";
import ApplicationActivityPanel from "@/components/dashboard/jobseeker/ApplicationActivityPanel";
import QuickActions from "@/components/dashboard/jobseeker/QuickActions";
import { dashboardPrimaryCtaClass } from "@/components/dashboard/jobseeker/dashboard-cta-classes";
import type { DashboardStats, JobRecommendation, ProfileUser } from "@/components/dashboard/jobseeker/types";
import {
  extractCareerTitles,
  extractSkillsFromParsedData,
} from "@/components/dashboard/jobseeker/types";
import {
  getResumeFingerprint,
  readJobseekerRecommendationsCache,
  writeJobseekerRecommendationsCache,
} from "@/lib/jobseeker/recommendations-cache";

function normalizeJob(raw: Record<string, unknown>): JobRecommendation {
  const companyRaw = raw.company;
  let company: JobRecommendation["company"] = "Company";
  if (typeof companyRaw === "string" && companyRaw) {
    company = companyRaw;
  } else if (companyRaw && typeof companyRaw === "object" && "name" in companyRaw) {
    company = companyRaw as { name?: string };
  }

  return {
    id: raw.id as string | number,
    title: String(raw.title || "Untitled Role"),
    company,
    companyLogo: typeof raw.companyLogo === "string" ? raw.companyLogo : null,
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

  const fetchRecommendations = useCallback(
    async (
      hasResume: boolean,
      activeResumeId: string | null
    ): Promise<JobRecommendation[]> => {
      if (!hasResume) return [];

      const fingerprint = getResumeFingerprint(activeResumeId);
      const cached = readJobseekerRecommendationsCache<JobRecommendation>(fingerprint);
      if (cached && cached.length > 0) {
        return cached;
      }

      const response = await fetch(
        "/api/jobseeker/recommendations?limit=6&algorithm=hybrid"
      );
      if (!response.ok) return [];

      const data = await response.json();
      if (!data.success || !Array.isArray(data.data?.jobs)) return [];

      const jobs = data.data.jobs.map((job: Record<string, unknown>) =>
        normalizeJob(job)
      );
      writeJobseekerRecommendationsCache(jobs, fingerprint);
      return jobs;
    },
    []
  );

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

      const resumesResult = await fetch("/api/jobseeker/resumes?limit=10&status=active");

      let parsed: Record<string, unknown> | null = null;
      let ats: number | null = null;
      let activeResumeId: string | null = null;

      if (resumesResult.ok) {
        const resumesData = await resumesResult.json();
        const resumeList = resumesData.data?.resumes ?? [];
        const activeResume =
          resumeList.find((r: { isActive?: boolean }) => r.isActive) ??
          resumeList[0];

        if (activeResume) {
          activeResumeId = activeResume.id ?? null;
          parsed = activeResume.parsedData || null;
          ats =
            typeof activeResume.atsScore === "number"
              ? activeResume.atsScore
              : null;
        }
      }

      const [viewsResult, jobs] = await Promise.all([
        fetch("/api/resumes/views"),
        fetchRecommendations(profileStats.totalResumes > 0, activeResumeId),
      ]);

      setParsedData(parsed);
      setResumeScore(ats);

      const resumeSkills = extractSkillsFromParsedData(parsed);
      const mergedSkills =
        activeResumeId && resumeSkills.length > 0
          ? resumeSkills
          : [...new Set([...profileSkills, ...resumeSkills])];
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
          <header className="mb-5 sm:mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Career Dashboard</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              AI-ranked matches and career insights from your resume.
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
            <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Get personalized job matches</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Upload your resume once — we&apos;ll extract skills and surface top matches instantly.
                  </p>
                </div>
              <Link href="/resumes/upload">
                <Button size="sm" className={dashboardPrimaryCtaClass}>
                  <Upload className="mr-2 h-4 w-4 text-[#FFFFFF]" />
                  Open Resume Studio
                </Button>
              </Link>
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
          <div className="mb-5 sm:mb-6">
            <RecommendedJobsSection jobs={recommendations} stats={stats} loading={loading} />
          </div>

          {/* AI insights + profile completion */}
          <AiInsightsPanel
            skills={skills}
            careerTitles={careerTitles}
            suppressEmptyHint={stats?.totalResumes === 0}
          />

          {stats && (
            <div className="mb-5 rounded-2xl bg-white/90 p-4 ring-1 ring-slate-200/60 sm:mb-6 sm:p-5">
              <ProfileCompletionWidget
                completion={stats.profileCompletion}
                user={profileUser}
                parsedData={parsedData}
              />
            </div>
          )}

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
