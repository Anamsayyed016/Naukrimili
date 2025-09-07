import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';

import { prisma } from '@/lib/prisma';

// GET user profile with resumes
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Get user with resumes
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        resumes: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        location: user.location,
        bio: user.bio,
        skills: user.skills,
        experience: user.experience,
        education: user.education,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      resumes: user.resumes.map(resume => ({
        id: resume.id,
        fileName: resume.fileName,
        fileUrl: resume.fileUrl,
        fileSize: resume.fileSize,
        mimeType: resume.mimeType,
        parsedData: resume.parsedData,
        atsScore: resume.atsScore,
        isActive: resume.isActive,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt
      }))
    });

  } catch (error) {
    console.error('GET user profile error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, location, bio, skills, experience, education } = body;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email! },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        location: location || undefined,
        bio: bio || undefined,
        skills: skills || undefined,
        experience: experience || undefined,
        education: education || undefined,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        location: updatedUser.location,
        bio: updatedUser.bio,
        skills: updatedUser.skills,
        experience: updatedUser.experience,
        education: updatedUser.education,
        profilePicture: updatedUser.profilePicture,
        isVerified: updatedUser.isVerified,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('PUT user profile error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}


