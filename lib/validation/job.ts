import { z } from 'zod';

export const createJobSchema = z.object({
  source: z.string().min(1),
  sourceId: z.string().min(1),
  title: z.string().min(1),
  company: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  country: z.string().min(1),
  description: z.string().min(1),
  applyUrl: z.string().url().optional().nullable(),
  postedAt: z.union([z.string(), z.date()]).optional().nullable(),
  salary: z.string().optional().nullable(),
  rawJson: z.record(z.any()).optional().default({}),
});

export type CreateJobInput = typeof createJobSchema._type;
