import mongoose from 'mongoose';

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const options = {
  bufferCommands: true,
  autoIndex: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  keepAlive: true,
  keepAliveInitialDelay: 300000,
};

// Initialize cache in global scope
declare global {
  var mongooseCache: MongooseCache | undefined;
}

// Get cache or create new one
const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

// Set cache in global scope
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connect() {
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, options)
      .then((mongoose) => {
        console.log('New MongoDB connection established');
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;

    // Add connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB connection disconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });

    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

// Initialize and export Prisma client
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();

/**
 * Creates a MongoDB connection or returns an existing one
 * @returns Promise<typeof mongoose>
 */
async function connectDB(): Promise<typeof mongoose> {
  try {
    // If we have an existing connection, return it
    if (cached.conn) {
      return cached.conn;
    }

    // If we don't have a connection promise yet, create one
    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      // Create a new connection
      cached.promise = mongoose
        .connect(MONGODB_URI as string, opts)
        .then((mongoose) => {
          console.log('✅ MongoDB Connected');
          return mongoose;
        });
    }

    // Wait for the connection
    cached.conn = await cached.promise;

    return cached.conn;
  } catch (error) {
    // If connection fails, clear the promise so we can retry
    cached.promise = null;
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export default connectDB;
