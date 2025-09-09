import { mockProjects } from './mockData';

let projects = [...mockProjects];

export const projectsService = {
  listAll: (query = {}) => {
    let filteredProjects = [...projects];
    
    // Filter by status
    if (query.status) {
      filteredProjects = filteredProjects.filter(p => p.status === query.status);
    }
    
    // Filter by location
    if (query.location) {
      filteredProjects = filteredProjects.filter(p => 
        p.location.toLowerCase().includes(query.location.toLowerCase())
      );
    }
    
    // Filter by budget range
    if (query.minBudget) {
      filteredProjects = filteredProjects.filter(p => p.estimatedBudget >= query.minBudget);
    }
    if (query.maxBudget) {
      filteredProjects = filteredProjects.filter(p => p.estimatedBudget <= query.maxBudget);
    }
    
    // Sort by creation date (newest first)
    filteredProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return filteredProjects;
  },

  getById: (id) => {
    return projects.find(p => p.id === id);
  },

  create: (input) => {
    const newProject = {
      id: `proj-${Date.now()}`,
      ownerId: 'ngo-001', // Default to first NGO for demo
      ...input,
      status: 'pending',
      photos: input.photos || [],
      coverImage: input.coverImage || 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    projects.push(newProject);
    return newProject;
  },

  forOwner: (ownerId) => {
    return projects.filter(p => p.ownerId === ownerId);
  },

  update: (id, updates) => {
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates };
      return projects[index];
    }
    return null;
  },

  getStats: () => {
    const total = projects.length;
    const verified = projects.filter(p => p.status === 'verified' || p.status === 'funded' || p.status === 'reporting').length;
    const pending = projects.filter(p => p.status === 'pending').length;
    const funded = projects.filter(p => p.status === 'funded' || p.status === 'reporting').length;
    
    return {
      total,
      verified,
      pending,
      funded
    };
  }
};

export default projectsService;
