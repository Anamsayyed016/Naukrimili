import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('🔍 Testing authentication flow...');
    
    // Simulate the exact same logic as NextAuth credentials provider
    const credentials = {
      email: 'admin@jobportal.com',
      password: 'admin123'
    };
    
    console.log('Testing with credentials:', credentials);
    
    if (!credentials?.email || !credentials?.password) {
      console.log('❌ Missing credentials');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: credentials.email }
    });
    
    console.log('User found:', !!user);
    console.log('User active:', user?.isActive);
    console.log('User has password:', !!user?.password);
    
    if (!user || !user.password || !user.isActive) {
      console.log('❌ User validation failed');
      return;
    }

    const isValidPassword = await bcrypt.compare(credentials.password, user.password);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Password validation failed');
      return;
    }

    const authResult = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'jobseeker',
      isActive: user.isActive || true
    };
    
    console.log('✅ Authentication successful!');
    console.log('Auth result:', authResult);
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();

