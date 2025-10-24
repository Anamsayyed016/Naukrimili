/**
 * Seed Real Jobs API
 * Populates database with real job listings
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Seeding real jobs...');
    
    // Run the seeding script
    const { stdout, stderr } = await execAsync('node scripts/seed-real-jobs.js');
    
    console.log('✅ Seeding completed:', stdout);
    
    if (stderr) {
      console.warn('⚠️ Seeding warnings:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Real jobs seeded successfully',
      output: stdout
    });

  } catch (error: any) {
    console.error('❌ Seeding failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Seeding failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}