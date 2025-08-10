// Temporary augmentation because generated client lacks expected Job fields.
// Remove once Prisma client generation reflects current schema.
import '@prisma/client';

declare module '@prisma/client' {
  namespace Prisma {
    interface JobCreateInput {
      source?: string;
      sourceId?: string;
      title?: string;
      company?: string | null;
      location?: string | null;
      country?: string;
      description?: string;
      applyUrl?: string | null;
      postedAt?: Date | string | null;
      salary?: string | null;
      rawJson?: any;
    }
  }
}
