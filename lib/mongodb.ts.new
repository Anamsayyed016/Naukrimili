// Mock MongoDB client for deployment
export const mockDb = {
  // Mock collections
  users: [],
  jobs: [],
  applications: [],
  profiles: [],
  
  // Mock operations
  async connect() {
    console.log('Mock DB connected');
    return this;
  },
  
  async disconnect() {
    console.log('Mock DB disconnected');
  }
};

// Export a mock client for compatibility
export const prisma = mockDb;

// Export connect function for compatibility
export async function connectDB() {
  return mockDb.connect();
}
