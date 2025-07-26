import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}

// Validate MongoDB URI format
const mongoURIFormat = /^mongodb(\+srv)?:\/\/[^\s]+$/;
if (!mongoURIFormat.test(MONGO_URI)) {
  throw new Error('Invalid MongoDB URI format. URI should start with mongodb:// or mongodb+srv://');
}

async function testConnection() {
  try {
    await mongoose.connect(MONGO_URI as string, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority',
      directConnection: false,
      family: 4 // Force IPv4
    });
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
    
    console.log('Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error connecting to MongoDB:', error.message);
      process.exit(1);
    }
    console.error('Unknown error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Handle cleanup on process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB due to application termination');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

testConnection();
