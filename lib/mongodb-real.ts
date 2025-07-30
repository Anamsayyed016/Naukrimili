import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let db: Db;

export async function connectDB() {
  if (db) return db;
  
  try {
    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    db = client.db(process.env.DATABASE_NAME || 'jobportal');
    
    console.log('✅ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

export async function getDB() {
  if (!db) {
    await connectDB();
  }
  return db;
}

// Collections
export const collections = {
  users: () => db.collection('users'),
  jobs: () => db.collection('jobs'),
  companies: () => db.collection('companies'),
  resumes: () => db.collection('resumes'),
  applications: () => db.collection('applications')
};

// User operations
export const userOperations = {
  async create(userData: any) {
    const db = await getDB();
    return await collections.users().insertOne({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  },
  
  async findByEmail(email: string) {
    const db = await getDB();
    return await collections.users().findOne({ email });
  },
  
  async update(id: string, updateData: any) {
    const db = await getDB();
    return await collections.users().updateOne(
      { _id: id },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
  }
};

// Job operations
export const jobOperations = {
  async create(jobData: any) {
    const db = await getDB();
    return await collections.jobs().insertOne({
      ...jobData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    });
  },
  
  async search(query: string, location?: string, filters?: any) {
    const db = await getDB();
    const searchQuery: any = {
      status: 'active',
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { skills: { $in: [new RegExp(query, 'i')] } }
      ]
    };
    
    if (location) {
      searchQuery.location = { $regex: location, $options: 'i' };
    }
    
    return await collections.jobs().find(searchQuery).toArray();
  },
  
  async findById(id: string) {
    const db = await getDB();
    return await collections.jobs().findOne({ _id: id });
  }
};

// Resume operations
export const resumeOperations = {
  async create(resumeData: any) {
    const db = await getDB();
    return await collections.resumes().insertOne({
      ...resumeData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  },
  
  async findByUserId(userId: string) {
    const db = await getDB();
    return await collections.resumes().find({ userId }).toArray();
  },
  
  async update(id: string, updateData: any) {
    const db = await getDB();
    return await collections.resumes().updateOne(
      { _id: id },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
  }
};