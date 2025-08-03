import { NextRequest } from 'next/server';

// Simple mock response for deployment
export async function GET() {
  return new Response(JSON.stringify([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      skills: ['JavaScript', 'React', 'Node.js'],
      experience: 5,
      education: "Bachelor's in Computer Science"
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      skills: ['Python', 'Django', 'SQL'],
      experience: 3,
      education: "Master's in Software Engineering"
    }
  ]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Temporarily disabled for deployment
export async function POST() {
  return new Response(JSON.stringify({ message: 'Post functionality temporarily disabled' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Temporarily disabled for deployment
export async function PUT() {
  return new Response(JSON.stringify({ message: 'Update functionality temporarily disabled' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
