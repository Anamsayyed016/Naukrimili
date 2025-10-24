/**
 * Script to update NextAuth v4 imports to v5
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToUpdate = [
  'app/api/jobseeker/recommendations/route.ts',
  'app/api/jobseeker/resumes/[id]/route.ts',
  'app/api/jobseeker/resumes/route.ts',
  'app/api/jobseeker/applications/route.ts',
  'app/api/jobseeker/profile/route.ts',
  'app/api/auth/logout/route.ts',
  'app/api/auth/test-oauth/route.ts',
  'app/api/notifications/[id]/route.ts',
  'app/api/notifications/route.ts',
  'app/api/applications/route.ts',
  'app/api/resumes/[id]/route.ts',
  'app/api/resumes/route.ts',
  'app/api/auth/force-clear/route.ts',
  'app/api/jobs/bookmarks/route.ts',
  'app/api/resumes/check/route.ts',
  'app/api/jobs/[id]/apply/route.ts',
  'app/api/user/profile/route.ts',
  'app/api/resumes/upload/route.ts',
  'app/api/resumes/generate/route.ts',
  'lib/api-utils.ts',
  'app/api/resumes/[id]/export/route.ts',
  'lib/session.ts'
];

function updateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let updated = false;

  // Update imports
  if (content.includes("import { getServerSession } from 'next-auth'")) {
    content = content.replace(
      "import { getServerSession } from 'next-auth'",
      "import { auth } from '@/lib/nextauth-config'"
    );
    updated = true;
  }

  if (content.includes('import { getServerSession } from "next-auth"')) {
    content = content.replace(
      'import { getServerSession } from "next-auth"',
      'import { auth } from "@/lib/nextauth-config"'
    );
    updated = true;
  }

  // Update authOptions imports
  if (content.includes("import { authOptions } from")) {
    content = content.replace(
      /import { authOptions } from [^;]+;/g,
      ''
    );
    updated = true;
  }

  // Update getServerSession calls
  if (content.includes('getServerSession(authOptions)')) {
    content = content.replace(/getServerSession\(authOptions\)/g, 'auth()');
    updated = true;
  }

  if (content.includes('getServerSession(')) {
    content = content.replace(/getServerSession\([^)]+\)/g, 'auth()');
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
  }
}

console.log('🔄 Updating NextAuth imports to v5...\n');

filesToUpdate.forEach(updateFile);

console.log('\n✅ NextAuth v5 migration complete!');
