import { NextRequest, NextResponse } from 'next/server';

// Mock user database (in a real app, this would be a proper database)
const users = new Map();

// Mock authenticated user ID (in a real app, this would come from JWT/session)
const getCurrentUserId = (request: NextRequest) => {
  // For demo purposes, we'll use a mock user ID
  // In a real app, you'd extract this from the Authorization header or session
  return 'user_123';
};

export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request);
    
    // Get user profile from mock database
    let userProfile = users.get(userId);
    
    if (!userProfile) {
      // Create default profile if not exists
      userProfile = {
        id: userId,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91 9876543210',
        location: 'Mumbai, Maharashtra',
        bio: 'Experienced software developer with 5+ years in full-stack development. Passionate about creating scalable web applications.',
        experience: '5+ years',
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'AWS'],
        joinedAt: new Date().toISOString(),
        resume: null
      };
      users.set(userId, userProfile);
    }
    
    return NextResponse.json({ 
      success: true, 
      profile: userProfile 
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch profile' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request);
    const updates = await request.json();
    
    // Get existing profile
    let userProfile = users.get(userId);
    
    if (!userProfile) {
      return NextResponse.json({ 
        success: false, 
        error: 'Profile not found' 
      }, { status: 404 });
    }
    
    // Update profile with new data
    userProfile = {
      ...userProfile,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    users.set(userId, userProfile);
    
    return NextResponse.json({ 
      success: true, 
      profile: userProfile,
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update profile' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request);
    const { action, data } = await request.json();
    
    switch (action) {
      case 'uploadResume':
        // Update user profile with resume data
        let userProfile = users.get(userId);
        if (userProfile) {
          userProfile.resume = data;
          users.set(userId, userProfile);
          
          return NextResponse.json({ 
            success: true, 
            message: 'Resume linked to profile successfully',
            profile: userProfile 
          });
        }
        break;
        
      case 'deleteResume':
        // Remove resume from user profile
        let profile = users.get(userId);
        if (profile) {
          profile.resume = null;
          users.set(userId, profile);
          
          return NextResponse.json({ 
            success: true, 
            message: 'Resume removed from profile',
            profile 
          });
        }
        break;
        
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Profile not found' 
    }, { status: 404 });
  } catch (error) {
    console.error('Profile action error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process request' 
    }, { status: 500 });
  }
}