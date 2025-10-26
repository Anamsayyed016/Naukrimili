import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret } = body;

    // Verify secret (replace with your actual secret)
    if (secret !== process.env.DEPLOY_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Execute deployment commands
    const commands = [
      'cd /home/root/jobportal',
      'git pull origin main',
      'npm ci --production',
      'npm run build',
      'pm2 restart jobportal'
    ];

    for (const command of commands) {
      try {
        const { stdout, stderr } = await execAsync(command);
        if (stdout) console.log(`Output: ${stdout}`);
        if (stderr) console.log(`Error: ${stderr}`);
      } catch (_error) {
        console.error(`Command failed: ${command}`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Deployment completed successfully' 
    });

  } catch (error: any) {
    console.error('Deployment error:', error);
    return NextResponse.json(
      { error: 'Deployment failed' },
      { status: 500 }
    );
  }
}
