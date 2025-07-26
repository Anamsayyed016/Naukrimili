import { connect } from '../lib/mongodb';
import mongoose from 'mongoose';

async function testConnection() {
  try {
    await connect();
    console.log('🔍 Testing database connection...');
    
    // Get the database instance
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    // Add connection status check
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`Invalid connection state: ${mongoose.connection.readyState}`);
    }
    
    // Test listing collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map((c: { name: string }) => c.name));
    
    // Test a simple operation (create a test document)
    const testCollection = db.collection('_test_connection');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    console.log('✏️ Test document created');
    
    // Clean up test document
    await testCollection.deleteMany({ test: true });
    console.log('🧹 Test documents cleaned up');
    
    console.log('✅ All database operations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testConnection();
