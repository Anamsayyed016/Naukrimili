import { NextRequest, NextResponse } from 'next/server';
import { JobGenerator } from '@/lib/jobs/generator';
import { upsertNormalizedJobs } from '@/lib/jobs/upsertJob';
import { getAllSectors } from '@/lib/jobs/sectors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { jobsPerSector = 20, sectors = 'all' } = body;

    // // console.log(`🌱 Starting job seeding: ${jobsPerSector} jobs per sector`);

    let jobsToSeed: any[] = [];

    if (sectors === 'all') {
      // Generate jobs for all sectors
      jobsToSeed = JobGenerator.generateJobsForAllSectors(jobsPerSector);
      // // console.log(`📊 Generated ${jobsToSeed.length} jobs across all sectors`);
    } else if (Array.isArray(sectors)) {
      // Generate jobs for specific sectors
      for (const sectorId of sectors) {
        const sectorJobs = JobGenerator.generateMultipleJobsForSector(sectorId, jobsPerSector);
        jobsToSeed.push(...sectorJobs);
      }
      // // console.log(`📊 Generated ${jobsToSeed.length} jobs for sectors: ${sectors.join(', ')}`);
    } else {
      // Generate jobs for a single sector
      const sectorJobs = JobGenerator.generateMultipleJobsForSector(sectors, jobsPerSector);
      jobsToSeed = sectorJobs;
      // // console.log(`📊 Generated ${jobsToSeed.length} jobs for sector: ${sectors}`);
    }

    // Upsert jobs into database
    const seededJobs = await upsertNormalizedJobs(jobsToSeed);

    // Get sector statistics
    const sectorStats = JobGenerator.getSectorStats();
    const totalJobs = seededJobs.length;

    // // console.log(`✅ Successfully seeded ${totalJobs} jobs`);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      stats: {
        totalJobs,
        jobsPerSector,
        sectors: sectors === 'all' ? 'all' : Array.isArray(sectors) ? sectors : [sectors],
        sectorStats
      },
      seededJobs: seededJobs.length
    });

  } catch (error: any) {
    console.error('❌ Job seeding failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to seed database',
        details: error?.stack
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sectors = getAllSectors();
    const sectorStats = JobGenerator.getSectorStats();
    
    return NextResponse.json({
      success: true,
      sectors: sectors.map(s => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        description: s.description,
        jobCount: 20, // Default jobs per sector
        keywords: s.keywords.slice(0, 5), // Show first 5 keywords
        sampleJobTitles: s.jobTitles.slice(0, 3) // Show first 3 job titles
      })),
      stats: {
        totalSectors: sectors.length,
        totalJobs: sectors.length * 20,
        sectorStats
      }
    });
  } catch (error: any) {
    console.error('❌ Failed to get sector info:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to get sector info' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
