import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching dynamic job constants...');

    // Get actual data from database
    const [
      jobTypes,
      experienceLevels,
      sectors,
      skills,
      locations,
      companies
    ] = await Promise.all([
      // Job types from actual jobs
      prisma.job.groupBy({
        by: ['jobType'],
        where: { 
          isActive: true,
          jobType: { not: null }
        },
        _count: { jobType: true },
        orderBy: { _count: { jobType: 'desc' } }
      }),
      
      // Experience levels from actual jobs
      prisma.job.groupBy({
        by: ['experienceLevel'],
        where: { 
          isActive: true,
          experienceLevel: { not: null }
        },
        _count: { experienceLevel: true },
        orderBy: { _count: { experienceLevel: 'desc' } }
      }),
      
      // Sectors from actual jobs
      prisma.job.groupBy({
        by: ['sector'],
        where: { 
          isActive: true,
          sector: { not: null }
        },
        _count: { sector: true },
        orderBy: { _count: { sector: 'desc' } }
      }),
      
      // Skills from actual jobs (parse JSON strings)
      prisma.job.findMany({
        where: { 
          isActive: true,
          skills: { not: "" }
        },
        select: { skills: true },
        take: 1000
      }),
      
      // Locations from actual jobs
      prisma.job.groupBy({
        by: ['location'],
        where: { 
          isActive: true,
          location: { not: null }
        },
        _count: { location: true },
        orderBy: { _count: { location: 'desc' } }
      }),
      
      // Companies from actual jobs
      prisma.job.groupBy({
        by: ['company'],
        where: { 
          isActive: true,
          company: { not: null }
        },
        _count: { company: true },
        orderBy: { _count: { company: 'desc' } }
      })
    ]);

    // Process job types
    const jobTypeOptions = jobTypes.map(item => ({
      value: item.jobType || 'unknown',
      label: formatJobTypeLabel(item.jobType || 'unknown'),
      count: item._count.jobType
    }));

    // Process experience levels
    const experienceLevelOptions = experienceLevels.map(item => ({
      value: item.experienceLevel || 'unknown',
      label: formatExperienceLabel(item.experienceLevel || 'unknown'),
      count: item._count.experienceLevel
    }));

    // Process sectors
    const sectorOptions = sectors.map(item => ({
      value: item.sector || 'unknown',
      label: item.sector || 'Unknown',
      count: item._count.sector
    }));

    // Process skills (extract from JSON strings and count frequency)
    const skillFrequency = new Map<string, number>();
    skills.forEach(job => {
      try {
        const jobSkills = typeof job.skills === 'string' 
          ? JSON.parse(job.skills || '[]') 
          : (job.skills || []);
        
        if (Array.isArray(jobSkills)) {
          jobSkills.forEach(skill => {
            if (typeof skill === 'string' && skill.trim()) {
              const normalizedSkill = skill.trim().toLowerCase();
              skillFrequency.set(normalizedSkill, (skillFrequency.get(normalizedSkill) || 0) + 1);
            }
          });
        }
      } catch (error) {
        console.warn('Failed to parse skills:', job.skills);
      }
    });

    const skillOptions = Array.from(skillFrequency.entries())
      .map(([skill, count]) => ({
        value: skill,
        label: formatSkillLabel(skill),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100); // Top 100 skills

    // Process locations
    const locationOptions = locations.map(item => ({
      value: item.location || 'unknown',
      label: item.location || 'Unknown',
      count: item._count.location
    }));

    // Process companies
    const companyOptions = companies.map(item => ({
      value: item.company || 'unknown',
      label: item.company || 'Unknown',
      count: item._count.company
    }));

    const response = {
      success: true,
      data: {
        jobTypes: jobTypeOptions,
        experienceLevels: experienceLevelOptions,
        sectors: sectorOptions,
        skills: skillOptions,
        locations: locationOptions,
        companies: companyOptions,
        meta: {
          totalJobTypes: jobTypeOptions.length,
          totalExperienceLevels: experienceLevelOptions.length,
          totalSectors: sectorOptions.length,
          totalSkills: skillOptions.length,
          totalLocations: locationOptions.length,
          totalCompanies: companyOptions.length,
          timestamp: new Date().toISOString()
        }
      }
    };

    console.log('✅ Dynamic constants fetched successfully:', {
      jobTypes: jobTypeOptions.length,
      experienceLevels: experienceLevelOptions.length,
      sectors: sectorOptions.length,
      skills: skillOptions.length,
      locations: locationOptions.length,
      companies: companyOptions.length
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Error fetching dynamic constants:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch constants',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Helper functions to format labels
function formatJobTypeLabel(jobType: string): string {
  const labels: Record<string, string> = {
    'full-time': 'Full Time',
    'part-time': 'Part Time',
    'contract': 'Contract',
    'internship': 'Internship',
    'freelance': 'Freelance',
    'temporary': 'Temporary'
  };
  return labels[jobType] || (jobType ? jobType.charAt(0).toUpperCase() + jobType.slice(1) : 'Unknown');
}

function formatExperienceLabel(level: string): string {
  const labels: Record<string, string> = {
    'entry': 'Entry Level (0-2 years)',
    'mid': 'Mid Level (2-5 years)',
    'senior': 'Senior Level (5-10 years)',
    'lead': 'Lead Level (10-15 years)',
    'executive': 'Executive (15+ years)',
    'internship': 'Internship'
  };
  return labels[level] || (level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Unknown');
}

function formatSkillLabel(skill: string): string {
  if (!skill) return 'Unknown';
  return skill.split(' ').map(word => 
    word ? word.charAt(0).toUpperCase() + word.slice(1) : ''
  ).join(' ');
}
