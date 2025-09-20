import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { trackResumeView } from '@/lib/resume-view-tracker';

/**
 * Generate HTML preview for profile-based resumes
 */
function generateResumePreview(resume: any): string {
  const data = resume.parsedData || {};
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume - ${data.fullName || 'Unknown'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .resume-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .name {
            font-size: 2.5em;
            font-weight: bold;
            color: #333;
            margin: 0;
        }
        .contact-info {
            color: #666;
            margin: 10px 0;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 1.5em;
            font-weight: bold;
            color: #007bff;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .job-title {
            font-size: 1.2em;
            color: #555;
            font-weight: 600;
        }
        .summary {
            background-color: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #007bff;
            margin: 15px 0;
        }
        .skills {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .skill-tag {
            background-color: #007bff;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9em;
        }
        .experience-item, .education-item {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #eee;
            border-radius: 5px;
        }
        .company, .institution {
            font-weight: bold;
            color: #333;
        }
        .date {
            color: #666;
            font-size: 0.9em;
        }
        .description {
            margin-top: 10px;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <div class="header">
            <h1 class="name">${data.fullName || 'Your Name'}</h1>
            <div class="contact-info">
                ${data.email ? `<div>📧 ${data.email}</div>` : ''}
                ${data.phone ? `<div>📱 ${data.phone}</div>` : ''}
                ${data.location ? `<div>📍 ${data.location}</div>` : ''}
                ${data.linkedin ? `<div>💼 <a href="${data.linkedin}" target="_blank">LinkedIn Profile</a></div>` : ''}
                ${data.portfolio ? `<div>🌐 <a href="${data.portfolio}" target="_blank">Portfolio</a></div>` : ''}
            </div>
            ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
        </div>

        ${data.summary ? `
        <div class="section">
            <h2 class="section-title">Professional Summary</h2>
            <div class="summary">${data.summary}</div>
        </div>
        ` : ''}

        ${data.skills && data.skills.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Skills</h2>
            <div class="skills">
                ${data.skills.map((skill: string) => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
        </div>
        ` : ''}

        ${data.experience && data.experience.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Work Experience</h2>
            ${data.experience.map((exp: any) => `
                <div class="experience-item">
                    <div class="company">${exp.position || 'Position'} at ${exp.company || 'Company'}</div>
                    <div class="date">${exp.startDate || ''} - ${exp.endDate || 'Present'}</div>
                    ${exp.location ? `<div class="date">📍 ${exp.location}</div>` : ''}
                    ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${data.education && data.education.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Education</h2>
            ${data.education.map((edu: any) => `
                <div class="education-item">
                    <div class="institution">${edu.degree || 'Degree'} - ${edu.institution || 'Institution'}</div>
                    <div class="date">${edu.startDate || ''} - ${edu.endDate || ''}</div>
                    ${edu.field ? `<div class="date">📚 ${edu.field}</div>` : ''}
                    ${edu.gpa ? `<div class="date">🎯 GPA: ${edu.gpa}</div>` : ''}
                    ${edu.description ? `<div class="description">${edu.description}</div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${data.projects && data.projects.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Projects</h2>
            ${data.projects.map((project: any) => `
                <div class="experience-item">
                    <div class="company">${project.name || 'Project Name'}</div>
                    ${project.technologies && project.technologies.length > 0 ? `
                        <div class="date">🛠️ ${project.technologies.join(', ')}</div>
                    ` : ''}
                    ${project.url ? `<div class="date">🔗 <a href="${project.url}" target="_blank">View Project</a></div>` : ''}
                    ${project.description ? `<div class="description">${project.description}</div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${data.certifications && data.certifications.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Certifications</h2>
            ${data.certifications.map((cert: any) => `
                <div class="experience-item">
                    <div class="company">${cert.name || 'Certification Name'}</div>
                    <div class="date">${cert.issuer || ''} - ${cert.date || ''}</div>
                    ${cert.url ? `<div class="date">🏆 <a href="${cert.url}" target="_blank">View Certificate</a></div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${data.languages && data.languages.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Languages</h2>
            <div class="skills">
                ${data.languages.map((lang: any) => {
                    const langName = typeof lang === 'string' ? lang : lang.language;
                    const proficiency = typeof lang === 'object' ? lang.proficiency : '';
                    return `<span class="skill-tag">${langName}${proficiency ? ` (${proficiency})` : ''}</span>`;
                }).join('')}
            </div>
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em;">
            Generated by Naukrimili Job Portal
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * GET /api/resumes/[id]/view
 * Securely serve resume files to authenticated users
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const { id } = await params;
    const resume = await prisma.resume.findFirst({
      where: { 
        id: id,
        userId: user.id 
      }
    });

    if (!resume) {
      return NextResponse.json({
        success: false,
        error: 'Resume not found'
      }, { status: 404 });
    }

    // Check if this is a profile-based resume (virtual file) or actual uploaded file
    const fileUrl = resume.fileUrl;
    const isProfileBasedResume = resume.mimeType === 'application/json' || 
                                 (fileUrl && fileUrl.includes('.json')) ||
                                 !fileUrl;

    if (isProfileBasedResume) {
      // For profile-based resumes, return the parsed data as HTML preview
      const htmlContent = generateResumePreview(resume);
      
      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'private, max-age=3600'
        }
      });
    }

    // For actual uploaded files, check if file exists
    if (!fileUrl || !fileUrl.startsWith('/uploads/resumes/')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file path'
      }, { status: 400 });
    }

    // Construct full file path
    const filename = fileUrl.replace('/uploads/resumes/', '');
    const filepath = join(process.cwd(), 'uploads', 'resumes', filename);

    try {
      // Check if file exists
      await stat(filepath);
    } catch (error) {
      console.error('File not found:', filepath);
      return NextResponse.json({
        success: false,
        error: 'File not found on server'
      }, { status: 404 });
    }

    // Track resume view if viewer is not the resume owner
    if (user.id !== resume.userId) {
      // Determine viewer type
      let viewerType: 'employer' | 'admin' | 'other' = 'other';
      let companyId: string | undefined = undefined;

      if (user.role === 'employer') {
        viewerType = 'employer';
        // Get user's company ID
        const userCompany = await prisma.user.findUnique({
          where: { id: user.id },
          select: { companyRelation: { select: { id: true } } }
        });
        companyId = userCompany?.companyRelation?.id;
      } else if (user.role === 'admin') {
        viewerType = 'admin';
      }

      // Track the view
      await trackResumeView({
        resumeId: resume.id,
        viewerId: user.id,
        viewerType,
        companyId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      });
    }

    // Read file
    const fileBuffer = await readFile(filepath);
    
    // Determine content type based on file extension or mimeType
    let contentType = resume.mimeType || 'application/octet-stream';
    
    if (filename.endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (filename.endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (filename.endsWith('.doc')) {
      contentType = 'application/msword';
    } else if (filename.endsWith('.txt')) {
      contentType = 'text/plain';
    }

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
    
    // For PDFs, allow inline viewing
    if (contentType === 'application/pdf') {
      headers.set('Content-Disposition', `inline; filename="${resume.fileName}"`);
    } else {
      headers.set('Content-Disposition', `attachment; filename="${resume.fileName}"`);
    }

    console.log(`✅ Serving resume file: ${filename} (${contentType})`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error serving resume file:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to serve resume file'
    }, { status: 500 });
  }
}
