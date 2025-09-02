import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/resumes/check
 * Check if user has existing resumes and provide recommendations
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        resumes: {
          orderBy: { updatedAt: 'desc' },
          take: 5 // Get latest 5 resumes
        }
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const hasResumes = user.resumes.length > 0;
    const latestResume = hasResumes ? user.resumes[0] : null;

    // Calculate resume health metrics
    let resumeHealth = null;
    if (latestResume) {
      const atsScore = latestResume.atsScore || 0;
      const completeness = calculateCompleteness(latestResume);
      const lastUpdated = latestResume.updatedAt;
      
      resumeHealth = {
        atsScore,
        completeness,
        lastUpdated,
        needsUpdate: isResumeOutdated(lastUpdated),
        recommendations: generateRecommendations(atsScore, completeness)
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        hasResumes,
        resumeCount: user.resumes.length,
        latestResume: latestResume ? {
          id: latestResume.id,
          fileName: latestResume.fileName,
          atsScore: latestResume.atsScore,
          updatedAt: latestResume.updatedAt
        } : null,
        resumeHealth,
        recommendations: {
          action: hasResumes ? 'enhance' : 'create',
          message: hasResumes 
            ? 'You have existing resumes. Consider updating them for better ATS scores.'
            : 'Create your first resume to get started with job applications.',
          nextSteps: hasResumes 
            ? ['Update existing resume', 'Upload new version', 'Check ATS score']
            : ['Upload existing resume', 'Build new resume', 'Get AI analysis']
        }
      }
    });

  } catch (error) {
    console.error('Resume check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check resume status'
    }, { status: 500 });
  }
}

/**
 * Calculate resume completeness score
 */
function calculateCompleteness(resume: any): number {
  let score = 0;
  const maxScore = 100;
  
  // Basic info (20 points)
  if (resume.parsedData?.fullName) score += 5;
  if (resume.parsedData?.email) score += 5;
  if (resume.parsedData?.phone) score += 5;
  if (resume.parsedData?.location) score += 5;
  
  // Summary (15 points)
  if (resume.parsedData?.summary && resume.parsedData.summary.length > 50) score += 15;
  
  // Experience (25 points)
  if (resume.parsedData?.experience && resume.parsedData.experience.length > 0) {
    score += Math.min(25, resume.parsedData.experience.length * 5);
  }
  
  // Education (20 points)
  if (resume.parsedData?.education && resume.parsedData.education.length > 0) {
    score += Math.min(20, resume.parsedData.education.length * 10);
  }
  
  // Skills (20 points)
  if (resume.parsedData?.skills && resume.parsedData.skills.length > 0) {
    score += Math.min(20, resume.parsedData.skills.length * 2);
  }
  
  return Math.min(score, maxScore);
}

/**
 * Check if resume is outdated (older than 6 months)
 */
function isResumeOutdated(updatedAt: Date): boolean {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return updatedAt < sixMonthsAgo;
}

/**
 * Generate recommendations based on ATS score and completeness
 */
function generateRecommendations(atsScore: number, completeness: number): string[] {
  const recommendations = [];
  
  if (atsScore < 70) {
    recommendations.push('Improve ATS compatibility by adding relevant keywords');
    recommendations.push('Use standard section headings (Experience, Education, Skills)');
    recommendations.push('Avoid graphics and complex formatting');
  }
  
  if (completeness < 80) {
    recommendations.push('Add missing contact information');
    recommendations.push('Include a professional summary');
    recommendations.push('Add more details to experience and education sections');
  }
  
  if (atsScore >= 85 && completeness >= 90) {
    recommendations.push('Your resume is in excellent shape!');
    recommendations.push('Consider adding industry-specific keywords');
    recommendations.push('Update with recent achievements and skills');
  }
  
  return recommendations;
}
