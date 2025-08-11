
import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { JobApplyButton } from './JobApplyButton';

interface JobPageProps {
  params: { jobId: string };
}

export const revalidate = 0; // always fresh

export async function generateMetadata({ params }: JobPageProps) {
  const idNum = Number(params.jobId);
  if (isNaN(idNum)) return { title: 'Job not found' };
  try {
    const job = await prisma.job.findUnique({ where: { id: idNum } });
    if (!job) return { title: 'Job not found' };
    return { title: `${job.title} – ${job.company || job.source}` };
  } catch {
    return { title: 'Job' };
  }
}

export default async function JobPage({ params }: JobPageProps) {
  const idNum = Number(params.jobId);
  if (isNaN(idNum)) return notFound();

  const job = await prisma.job.findUnique({ where: { id: idNum } });
  if (!job) return notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {job.company && <span className="font-medium">{job.company}</span>} {job.company && '·'} {job.location || job.country}
        </p>
        <div className="flex items-center gap-3 pt-2">
          <JobApplyButton url={job.applyUrl} />
          <span className="text-xs text-gray-500">Source: {job.source}</span>
        </div>
      </header>
      <article className="prose max-w-none whitespace-pre-wrap break-words dark:prose-invert text-sm leading-relaxed">
        {job.description}
      </article>
    </main>
  );
}
