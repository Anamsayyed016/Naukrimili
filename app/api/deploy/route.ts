import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, ref, sha } = body;

    // Verify the secret
    if (secret !== process.env.DEPLOY_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only deploy from main branch
    if (ref !== 'refs/heads/main') {
      return NextResponse.json({ message: 'Skipping deployment - not main branch' });
    }

              // Deployment started logged

    // Execute deployment commands
    const commands = [
      'cd /home/root/jobportal',
      'git pull origin main',
      'npm ci --production',
      'npm run build',
      'pm2 restart jobportal || pm2 start npm --name "jobportal" -- start'
    ];

    for (const command of commands) {
                // Command execution logged
          const { stdout, stderr } = await execAsync(command);
          if (stdout) console.log(`Output: ${stdout}`);
          if (stderr) console.log(`Error: ${stderr}`);
    }

          // Deployment completed logged
    
    return NextResponse.json({ 
      success: true, 
      message: 'Deployment completed',
      commit: sha,
      branch: ref
    });

  } catch (error) {
    console.error('Deployment error:', error);
    return NextResponse.json({ 
      error: 'Deployment failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
