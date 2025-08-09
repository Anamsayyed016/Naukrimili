// Minimal, dependency-free in-memory database utilities to stabilize the codebase.
// Reintroduce a real database later by swapping implementations.

export type User = {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Job = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
};

export type Resume = {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

const mem = {
  users: new Map<string, User>(),
  jobs: new Map<string, Job>(),
  resumes: new Map<string, Resume>(),
};

function newId() {
  return Math.random().toString(36).slice(2);
}

export const userOperations = {
  async create(userData: Partial<User>) {
    const id = newId();
    const now = new Date();
    const user: User = {
      id,
      email: String(userData.email || ''),
      name: userData.name,
      createdAt: now,
      updatedAt: now,
    };
    mem.users.set(id, user);
    return user;
  },
  async findByEmail(email: string) {
    for (const u of Array.from(mem.users.values())) if (u.email === email) return u;
    return null;
  },
  async update(id: string, updateData: Partial<User>) {
    const u = mem.users.get(id);
    if (!u) return null;
    const updated: User = { ...u, ...updateData, updatedAt: new Date() };
    mem.users.set(id, updated);
    return updated;
  },
};

export const jobOperations = {
  async create(jobData: Partial<Job>) {
    const id = newId();
    const now = new Date();
    const job: Job = {
      id,
      title: String(jobData.title || ''),
      description: jobData.description,
      location: jobData.location,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    mem.jobs.set(id, job);
    return job;
  },
  async search(query: string, location?: string) {
    const q = query.toLowerCase();
    const results: Job[] = [];
    for (const j of Array.from(mem.jobs.values())) {
      const hit = j.title.toLowerCase().includes(q) || (j.description || '').toLowerCase().includes(q);
      const locOk = location ? (j.location || '').toLowerCase().includes(location.toLowerCase()) : true;
      if (j.status === 'active' && hit && locOk) results.push(j);
    }
    return results;
  },
  async findById(id: string) {
    return mem.jobs.get(id) || null;
  },
};

export const resumeOperations = {
  async create(data: Partial<Resume>) {
    const id = newId();
    const now = new Date();
    const resume: Resume = {
      id,
      userId: String(data.userId || ''),
      content: String(data.content || ''),
      createdAt: now,
      updatedAt: now,
    };
    mem.resumes.set(id, resume);
    return resume;
  },
  async findByUserId(userId: string) {
    return Array.from(mem.resumes.values()).filter((r) => r.userId === userId);
  },
  async update(id: string, updateData: Partial<Resume>) {
    const r = mem.resumes.get(id);
    if (!r) return null;
    const updated: Resume = { ...r, ...updateData, updatedAt: new Date() };
    mem.resumes.set(id, updated);
    return updated;
  },
};

export async function checkDatabaseHealth() {
  return { status: 'healthy' as const, details: { readyState: 1, host: 'in-memory', name: 'memdb' } };
}

export async function gracefulShutdown(): Promise<void> {
  // No-op for memory store
}