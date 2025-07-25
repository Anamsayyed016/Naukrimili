import mongoose from 'mongoose';

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb+srv://naukrimili123:naukrimili123@naukrimili.lb6ad5e.mongodb.net/jobportal";

if (!MONGODB_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

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
