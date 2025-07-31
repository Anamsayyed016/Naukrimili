import { connectDB } from '../lib/database';
import mongoose from 'mongoose';

async function testConnection() {
  try {
    await connectDB();
    console.log('🔍 Testing database connection...');
    
    // Get the database instance
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    // Test collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
    console.log('🎉 Database test completed successfully!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

testConnection();
