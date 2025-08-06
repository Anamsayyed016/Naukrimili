import { NextRequest } from 'next/server';

// Simple mock response for deployment
export async function GET() {
  return new Response(JSON.stringify({ 
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    skills: ['JavaScript', 'React', 'Node.js'],
    experience: 5,
    education: "Bachelor's in Computer Science"
  }), {
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

// Temporarily disabled for deployment
export async function DELETE() {
  return new Response(JSON.stringify({ message: 'Delete functionality temporarily disabled' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}


