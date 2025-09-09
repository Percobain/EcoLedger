import { create } from 'zustand';
import { reportingService } from '../services/reportingService';

export const useReportingStore = create((set, get) => ({
  reports: [],
  pendingReports: [],
  reportableProjects: [],
  loading: false,
  error: null,
  
  // Actions
  fetchReportableProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = reportingService.getReportableProjects();
      set({ reportableProjects: projects, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  submitReport: async (reportData) => {
    set({ loading: true, error: null });
    try {
      const report = await reportingService.submitReport(reportData);
      const { reports } = get();
      set({ 
        reports: [report, ...reports],
        loading: false 
      });
      return report;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchReports: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const reports = await reportingService.getReports(projectId);
      set({ reports, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchPendingReports: async () => {
    set({ loading: true, error: null });
    try {
      const pendingReports = await reportingService.listPendingReports();
      set({ pendingReports, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  verifyReport: async (reportId, action = 'VERIFIED') => {
    set({ loading: true, error: null });
    try {
      const updatedReport = await reportingService.verifyReport({ reportId, action });
      
      // Update pending reports list
      const { pendingReports } = get();
      const updatedPending = pendingReports.filter(r => r.id !== reportId);
      
      set({ 
        pendingReports: updatedPending,
        loading: false 
      });
      
      return updatedReport;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));
