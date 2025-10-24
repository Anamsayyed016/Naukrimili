import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { getUserResumeViews } from '@/lib/resume-view-tracker';

/**
 * GET /api/resumes/views
 * Get all resume views for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get user's resume views
    const views = await getUserResumeViews(session.user.id);

    // Group views by resume for better organization
    const viewsByResume = views.reduce((acc: any, view: any) => {
      const resumeId = view.resume.id;
      if (!acc[resumeId]) {
        acc[resumeId] = {
          resumeId: view.resume.id,
          resumeName: view.resume.fileName,
          totalViews: 0,
          views: []
        };
      }
      acc[resumeId].totalViews++;
      acc[resumeId].views.push({
        id: view.id,
        viewerName: view.viewer.name || view.viewer.email,
        viewerType: view.viewerType,
        companyName: view.company?.name,
        viewedAt: view.viewedAt
      });
      return acc;
    }, {});

    // Convert to array
    const resumeViews = Object.values(viewsByResume);

    return NextResponse.json({
      success: true,
      data: {
        totalViews: views.length,
        resumeViews
      }
    });

  } catch (error) {
    console.error('Error getting user resume views:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get resume views'
    }, { status: 500 });
  }
}
