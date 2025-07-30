import mongoose from 'mongoose';
import { env } from './env';

// Connection state
interface ConnectionState {
  isConnected: boolean;
  connection: typeof mongoose | null;
  error: Error | null;
}

const connection: ConnectionState = {
  isConnected: false,
  connection: null,
  error: null,
};

// Connection options
const connectionOptions: mongoose.ConnectOptions = {
  bufferCommands: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
};

// Connect to MongoDB
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (connection.isConnected && connection.connection) {
    return connection.connection;
  }

  try {
    console.log('Connecting to MongoDB...');
    
    const db = await mongoose.connect(env.MONGODB_URI, connectionOptions);
    
    connection.isConnected = true;
    connection.connection = db;
    connection.error = null;
    
    console.log('MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      connection.error = error;
      connection.isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      connection.isConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      connection.isConnected = true;
      connection.error = null;
    });
    
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    connection.error = error as Error;
    connection.isConnected = false;
    throw error;
  }
}

// Disconnect from MongoDB
export async function disconnectFromDatabase(): Promise<void> {
  if (!connection.isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    connection.isConnected = false;
    connection.connection = null;
    connection.error = null;
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
}

// Get connection status
export function getConnectionStatus(): ConnectionState {
  return { ...connection };
}

// Health check
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    connected: boolean;
    readyState: number;
    host: string;
    name: string;
    error?: string;
  };
}> {
  try {
    const state = mongoose.connection.readyState;
    const isHealthy = state === 1; // 1 = connected
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      details: {
        connected: connection.isConnected,
        readyState: state,
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown',
        ...(connection.error && { error: connection.error.message }),
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        readyState: 0,
        host: 'unknown',
        name: 'unknown',
        error: (error as Error).message,
      },
    };
  }
}

// Retry connection with exponential backoff
export async function connectWithRetry(
  maxRetries: number = 5,
  baseDelay: number = 1000
): Promise<typeof mongoose> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await connectToDatabase();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw new Error(
          `Failed to connect to database after ${maxRetries} attempts: ${lastError.message}`
        );
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Connection attempt ${attempt} failed, retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Graceful shutdown
export async function gracefulShutdown(): Promise<void> {
  console.log('Initiating graceful database shutdown...');
  
  try {
    await disconnectFromDatabase();
    console.log('Database shutdown completed');
  } catch (error) {
    console.error('Error during database shutdown:', error);
    throw error;
  }
}

// Initialize database connection on module load
if (process.env.NODE_ENV !== 'test') {
  connectWithRetry().catch((error) => {
    console.error('Initial database connection failed:', error);
  });
}

// Handle process termination
process.on('SIGINT', async () => {
  await gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await gracefulShutdown();
  process.exit(0);
});