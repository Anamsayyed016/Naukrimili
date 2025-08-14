import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { z } from 'zod';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  jobTitle: z.string().optional(),
  skills: z.array(z.string()).optional(),
  education: z.array(z.any()).optional(),
  experience: z.array(z.any()).optional(),
  linkedin: z.string().optional(),
  portfolio: z.string().optional(),
  expectedSalary: z.string().optional(),
  preferredJobType: z.string().optional(),
});

function getUserIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-user-id');
}

async function ensureTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id text PRIMARY KEY,
        full_name text,
        email text,
        phone text,
        location text,
        job_title text,
        skills jsonb DEFAULT '[]'::jsonb,
        education jsonb DEFAULT '[]'::jsonb,
        experience jsonb DEFAULT '[]'::jsonb,
        linkedin text,
        portfolio text,
        expected_salary text,
        preferred_job_type text,
        updated_at timestamptz DEFAULT now()
      );
    `);
  } finally {
    client.release();
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    await ensureTables();
    const client = await pool.connect();
    try {
      const profRes = await client.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
      let profile = profRes.rows[0] || null;

      if (!profile) {
        await client.query('INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);
        const re = await client.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
        profile = re.rows[0];
      }

      // Fetch recent resumes from resumes table if exists
      let resumes: Array<{ id: string; fileName: string; fileUrl: string | null; createdAt: string }>=[];
      try {
        const r = await client.query(`
          SELECT id, original_filename as file_name, NULL as file_url, created_at
          FROM resumes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5
        `, [userId]);
        resumes = r.rows.map((row:any)=>({ id: String(row.id), fileName: row.file_name || 'Resume', fileUrl: row.file_url, createdAt: row.created_at?.toISOString?.() || row.created_at }));
      } catch {}

      // Recent applications optional (skip if no table)
      let recentApplications: any[] = [];
      try {
        const a = await client.query(`
          SELECT id, status, applied_at, job_title, company
          FROM applications WHERE user_id = $1 ORDER BY applied_at DESC LIMIT 5
        `, [userId]);
        recentApplications = a.rows.map((row:any)=>({ id: String(row.id), status: row.status, appliedAt: row.applied_at?.toISOString?.() || row.applied_at, jobTitle: row.job_title, company: row.company }));
      } catch {}

      const skills = profile?.skills || [];
      const exp = profile?.experience || [];
      const required = ['full_name','email','phone','location','job_title','skills','experience'];
      const completed = required.filter((k)=>{
        const v = k==='skills'? skills : k==='experience'? exp : profile?.[k];
        if (Array.isArray(v)) return v.length>0;
        return v && String(v).trim().length>0;
      });
      const profileCompletion = Math.round((completed.length / required.length) * 100);

      const resultProfile = {
        id: userId,
        fullName: profile?.full_name || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        location: profile?.location || '',
        jobTitle: profile?.job_title || '',
        skills,
        education: profile?.education || [],
        experience: exp,
        linkedin: profile?.linkedin || '',
        portfolio: profile?.portfolio || '',
        expectedSalary: profile?.expected_salary || '',
        preferredJobType: profile?.preferred_job_type || '',
        profileCompletion,
        updatedAt: profile?.updated_at?.toISOString?.() || profile?.updated_at || new Date().toISOString(),
      };

      return NextResponse.json({ success: true, data: { profile: resultProfile, resumes, recentApplications } });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch profile', message: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    const payload = await request.json();
    const data = updateProfileSchema.parse(payload);

    await ensureTables();
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO user_profiles (
          user_id, full_name, email, phone, location, job_title, skills, education, experience, linkedin, portfolio, expected_salary, preferred_job_type, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now()
        )
        ON CONFLICT (user_id) DO UPDATE SET 
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          location = EXCLUDED.location,
          job_title = EXCLUDED.job_title,
          skills = EXCLUDED.skills,
          education = EXCLUDED.education,
          experience = EXCLUDED.experience,
          linkedin = EXCLUDED.linkedin,
          portfolio = EXCLUDED.portfolio,
          expected_salary = EXCLUDED.expected_salary,
          preferred_job_type = EXCLUDED.preferred_job_type,
          updated_at = now()
        RETURNING *
      `,[
            userId,
        data.fullName || null,
        data.email || null,
        data.phone || null,
        data.location || null,
        data.jobTitle || null,
        JSON.stringify(data.skills || []),
        JSON.stringify(data.education || []),
        JSON.stringify(data.experience || []),
        data.linkedin || null,
        data.portfolio || null,
        data.expectedSalary || null,
        data.preferredJobType || null,
      ]);

      const row = res.rows[0];
      const resultProfile = {
        id: userId,
        fullName: row.full_name || '',
        email: row.email || '',
        phone: row.phone || '',
        location: row.location || '',
        jobTitle: row.job_title || '',
        skills: row.skills || [],
        education: row.education || [],
        experience: row.experience || [],
        linkedin: row.linkedin || '',
        portfolio: row.portfolio || '',
        expectedSalary: row.expected_salary || '',
        preferredJobType: row.preferred_job_type || '',
        updatedAt: row.updated_at?.toISOString?.() || row.updated_at || new Date().toISOString(),
      };

      return NextResponse.json({ success: true, message: 'Profile updated successfully', data: resultProfile });
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Invalid profile data', details: error.errors }, { status: 400 });
    return NextResponse.json({ success: false, error: 'Failed to update profile', message: error.message }, { status: 500 });
  }
}