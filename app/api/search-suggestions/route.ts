import { NextResponse } from 'next/server';

// Simple in-memory mock data (replace with DB / search index later)
const TITLES = ['Frontend Developer', 'Backend Developer', 'Full Stack Engineer', 'Data Analyst', 'Data Scientist', 'Product Manager', 'UI/UX Designer', 'DevOps Engineer', 'Cloud Architect', 'QA Engineer'];
const COMPANIES = ['Infosys', 'TCS', 'Flipkart', 'Swiggy', 'Zoho', 'Freshworks', 'Reliance', 'Wipro', 'Accenture', 'Cognizant'];
const SKILLS = ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'AWS', 'Docker', 'Kubernetes', 'Figma', 'Excel'];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ suggestions: [] });
  const lower = q.toLowerCase();

  const match = (arr: string[]) => arr.filter(v => v.toLowerCase().includes(lower)).slice(0, 5);

  const titleMatches = match(TITLES).map(v => ({ type: 'title', value: v }));
  const companyMatches = match(COMPANIES).map(v => ({ type: 'company', value: v }));
  const skillMatches = match(SKILLS).map(v => ({ type: 'skill', value: v }));

  // Merge with simple weighting: titles > companies > skills
  const suggestions = [...titleMatches, ...companyMatches, ...skillMatches].slice(0, 10);
  return NextResponse.json({ suggestions });
}
