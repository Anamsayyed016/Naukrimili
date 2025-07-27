import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // In a real app, delete from database and file storage
    console.log(`Deleting resume with ID: ${id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Mock resume data
    const resume = {
      id: id,
      filename: 'sample_resume.pdf',
      status: 'processed',
      atsScore: 85,
      aiData: {
        personalInfo: {
          name: 'John Doe',
          email: 'john.doe@email.com',
          phone: '+91-9876543210',
          location: 'Mumbai, Maharashtra'
        },
        experience: [
          {
            company: 'Tech Solutions Pvt Ltd',
            position: 'Software Developer',
            duration: '2021 - Present',
            description: 'Developed web applications using React and Node.js'
          }
        ],
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB']
      },
      uploadedAt: '2024-01-15T10:30:00Z'
    };
    
    return NextResponse.json({
      success: true,
      resume: resume
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}