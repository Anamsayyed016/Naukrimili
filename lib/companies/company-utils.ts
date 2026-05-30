import type { PrismaClient } from '@prisma/client';

/** Normalize for duplicate matching (Google LLC ≈ Google). */
export function normalizeCompanyName(name: string): string {
  return String(name || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(
      /\b(inc|llc|ltd|limited|corp|corporation|company|co\.|plc|pvt|private|group|holdings)\b/gi,
      ' '
    )
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function extractWebsiteDomain(website?: string | null): string | null {
  if (!website?.trim()) return null;
  try {
    const host = new URL(
      website.startsWith('http') ? website : `https://${website}`
    ).hostname;
    return host.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

/** Reliable logo when stored URL fails (Google favicon service). */
export function buildFaviconLogoUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

/** Ordered logo sources: DB logo → website favicon. */
export function logoCandidates(
  logo?: string | null,
  website?: string | null
): string[] {
  const candidates: string[] = [];
  const trimmed = logo?.trim();
  if (trimmed) candidates.push(trimmed);
  const domain = extractWebsiteDomain(website);
  if (domain) candidates.push(buildFaviconLogoUrl(domain));
  return candidates;
}

export function getCompanyInitials(name: string): string {
  const parts = String(name || '')
    .replace(/\([^)]*\)/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Find existing portal company by exact name, normalized name, or website domain. */
export async function findExistingCompanyDuplicate(
  prisma: PrismaClient,
  input: { name: string; website?: string | null }
) {
  const name = input.name.trim();
  if (!name) return null;

  const exact = await prisma.company.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true, name: true, website: true, createdBy: true },
  });
  if (exact) return exact;

  const normalized = normalizeCompanyName(name);
  if (normalized) {
    const all = await prisma.company.findMany({
      select: { id: true, name: true, website: true, createdBy: true },
      take: 500,
    });
    const byNorm = all.find(
      (c) => normalizeCompanyName(c.name) === normalized
    );
    if (byNorm) return byNorm;
  }

  const domain = extractWebsiteDomain(input.website);
  if (domain) {
    const byDomain = await prisma.company.findFirst({
      where: {
        OR: [
          { website: { contains: domain, mode: 'insensitive' } },
          { careerPageUrl: { contains: domain, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, website: true, createdBy: true },
    });
    if (byDomain) return byDomain;
  }

  return null;
}
