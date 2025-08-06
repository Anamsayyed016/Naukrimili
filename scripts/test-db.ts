import { connectDB } from "@/lib/database";
import mongoose from 'mongoose';

async function testConnection() {
  try {
    await connectDB();
    
    // Get the database instance
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
  // TODO: Complete function implementation
}
    }
    
    // Test collections
    const collections = await db.listCollections().toArray();
    console.log('✅ Database connected successfully');
    console.log('📁 Available collections:', collections.map(c => c.name));
    
    process.exit(0)} catch (error) {
    console.error("Error:", error);
    throw error}
    console.error('❌ Database test failed:', error);
    process.exit(1)}
}

testConnection();
