import { create } from 'zustand';
import { projectsService } from '../services/projectsService';

export const useProjectStore = create((set, get) => ({
  projects: [],
  loading: false,
  error: null,
  selectedProject: null,
  
  // Actions
  fetchProjects: async (query = {}) => {
    set({ loading: true, error: null });
    try {
      const projects = projectsService.listAll(query);
      set({ projects, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchProjectById: async (id) => {
    set({ loading: true, error: null });
    try {
      const project = projectsService.getById(id);
      set({ selectedProject: project, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createProject: async (projectData) => {
    set({ loading: true, error: null });
    try {
      const newProject = projectsService.create(projectData);
      const { projects } = get();
      set({ 
        projects: [newProject, ...projects], 
        loading: false 
      });
      return newProject;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateProject: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedProject = projectsService.update(id, updates);
      const { projects } = get();
      const updatedProjects = projects.map(p => 
        p.id === id ? updatedProject : p
      );
      set({ 
        projects: updatedProjects, 
        selectedProject: updatedProject,
        loading: false 
      });
      return updatedProject;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getProjectStats: () => {
    return projectsService.getStats();
  },

  clearError: () => set({ error: null }),
  clearSelectedProject: () => set({ selectedProject: null })
}));
