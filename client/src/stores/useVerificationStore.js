import { create } from 'zustand';
import { verificationService } from '../services/verificationService';

export const useVerificationStore = create((set, get) => ({
  pendingProjects: [],
  verifications: [],
  loading: false,
  error: null,
  verificationMode: 'centralized', // 'centralized' or 'decentralized'
  
  // Actions
  setVerificationMode: (mode) => {
    set({ verificationMode: mode });
  },

  fetchPendingProjects: async () => {
    set({ loading: true, error: null });
    try {
      const pendingProjects = verificationService.listPending();
      set({ pendingProjects, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  approveProject: async (projectId, verifier = 'System') => {
    set({ loading: true, error: null });
    try {
      const { verificationMode } = get();
      const verification = verificationService.approve(projectId, verificationMode, verifier);
      
      // Remove from pending list
      const { pendingProjects } = get();
      const updatedPending = pendingProjects.filter(p => p.id !== projectId);
      
      set({ 
        pendingProjects: updatedPending,
        loading: false 
      });
      
      return verification;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  rejectProject: async (projectId, reason = '', verifier = 'System') => {
    set({ loading: true, error: null });
    try {
      const { verificationMode } = get();
      const verification = verificationService.reject(projectId, verificationMode, verifier, reason);
      
      // Remove from pending list
      const { pendingProjects } = get();
      const updatedPending = pendingProjects.filter(p => p.id !== projectId);
      
      set({ 
        pendingProjects: updatedPending,
        loading: false 
      });
      
      return verification;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchVerifications: async () => {
    set({ loading: true, error: null });
    try {
      const verifications = verificationService.listAll();
      set({ verifications, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  clearError: () => set({ error: null })
}));
