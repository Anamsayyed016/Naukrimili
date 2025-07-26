import { connectDB } from './mongodb';

export async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    await connectDB();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}