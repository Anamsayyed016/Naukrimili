// Mock candidate data
export const mockCandidates = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    skills: ['JavaScript', 'React', 'Node.js'],
    experience: 5,
    education: "Bachelor's in Computer Science",
    appliedDate: new Date('2023-12-01').toISOString()
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    skills: ['Python', 'Django', 'SQL'],
    experience: 3,
    education: "Master's in Software Engineering",
    appliedDate: new Date('2023-12-02').toISOString()
  }
];

// Utility functions to handle candidate operations
export const candidatesApi = {
  getAll: async () => {
    return [...mockCandidates].sort((a, b) => 
      new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
    );
  },
  
  getById: async (id: string) => {
    return mockCandidates.find(c => c.id === id);
  },

  create: async (data: Record<string, unknown>) => {
    const newCandidate = {
      id: String(mockCandidates.length + 1),
      ...data,
      appliedDate: new Date().toISOString()
    };
    mockCandidates.push(newCandidate);
    return newCandidate;
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const index = mockCandidates.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    mockCandidates[index] = {
      ...mockCandidates[index],
      ...data
    };
    return mockCandidates[index];
  },

  delete: async (id: string) => {
    const index = mockCandidates.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    mockCandidates.splice(index, 1);
    return true;
  }
};
