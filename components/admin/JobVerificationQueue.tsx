"use client";
import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EmployerInfo {
  name: string;
  email: string;
  verificationScore: number;
}

interface JobVerification {
  id: string;
  jobTitle: string;
  company: string;
  submittedAt: string; // ISO string
  status: "pending" | "approved" | "rejected";
  flags: string[];
  employerInfo: EmployerInfo;
}

export default function JobVerificationQueue() {
  const [jobs, setJobs] = useState<JobVerification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchJobs();
  }, []);

  async function fetchJobs() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/jobs/verification");
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const data: JobVerification[] = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJobAction(jobId: string, action: "approve" | "reject") {
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`Action failed (${res.status})`);
      await fetchJobs();
    } catch (e: any) {
      setError(e?.message || "Action failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Job Verification Queue</h2>
        <Button variant="outline" onClick={() => fetchJobs()} disabled={isLoading}>
          Refresh
        </Button>
      </div>
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-800" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-sm text-gray-600">No jobs awaiting verification.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Details</TableHead>
              <TableHead>Employer</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[160px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              const scoreClass =
                job.employerInfo.verificationScore > 80
                  ? "bg-green-100 text-green-800"
                  : job.employerInfo.verificationScore > 50
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800";
              const statusClass =
                job.status === "approved"
                  ? "bg-green-100 text-green-800"
                  : job.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-700";
              return (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="font-medium">{job.jobTitle}</div>
                    <div className="text-xs text-gray-500">{job.company}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{job.employerInfo.name}</div>
                      <div className="text-xs text-gray-500">{job.employerInfo.email}</div>
                      <Badge className={scoreClass} variant="secondary">
                        Score: {job.employerInfo.verificationScore}%
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(job.submittedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {job.flags.map((flag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusClass} variant="secondary">
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {job.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleJobAction(job.id, "approve")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleJobAction(job.id, "reject")}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}