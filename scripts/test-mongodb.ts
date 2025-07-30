import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env file');
}

// Validate MongoDB URI format
const mongoURIFormat = /^mongodb(\+srv)?:\/\/[^\s]+$/;
if (!mongoURIFormat.test(MONGO_URI)) {
  throw new Error('Invalid MongoDB URI format. URI should start with mongodb:// or mongodb+srv://');
}

async function testConnection() {
  try {
    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority' as any,
      directConnection: false,
      family: 4
    };

    console.log('🔍 Attempting to connect to MongoDB...');
    await mongoose.connect(MONGO_URI as string, options);
    console.log('Successfully connected to MongoDB!');
    
    // Verify the connection
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    
    // Test the connection by executing a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (!collections) {
      throw new Error('Failed to retrieve collections');
    }
    
    console.log('📚 Available collections:', collections.map(c => c.name));
    
    // Test write operation
    const testCollection = mongoose.connection.db.collection('_test_connection');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    console.log('✅ Test write operation successful');
    
    // Clean up test data
    await testCollection.deleteMany({ test: true });
    console.log('🧹 Test data cleaned up');
    
    await mongoose.disconnect();
    console.log('✨ Successfully disconnected from MongoDB');
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ MongoDB Error:', error.message);
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      process.exit(1);
    }
    console.error('❌ Unknown error:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

// Add connection event listeners
mongoose.connection.on('connected', () => {
  console.log('🌟 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚡ Mongoose disconnected from MongoDB');
});

// Handle cleanup on process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.disconnect();
    console.log('💤 Disconnected from MongoDB due to application termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the test
console.log('🚀 Starting MongoDB connection test...');
testConnection();
