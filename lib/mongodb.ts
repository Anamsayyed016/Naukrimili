import mongoose from 'mongoose';
import { PrismaClient } from '@prisma/client';

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in your .env file');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

const options = {
  bufferCommands: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

export async function connectDB(): Promise<typeof mongoose> {
  try {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      cached.promise = mongoose
        .connect(MONGODB_URI, options)
        .then((mongoose) => {
          console.log('✅ MongoDB Connected');
          return mongoose;
        })
        .catch((error) => {
          cached.promise = null;
          console.error('❌ MongoDB connection error:', error);
          throw error;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

// Export both functions for compatibility
export const connect = connectDB;
export default connectDB;

// Initialize Prisma client
export const prisma = new PrismaClient();
