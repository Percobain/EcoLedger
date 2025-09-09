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
      const report = reportingService.submitReport(reportData);
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
      const reports = reportingService.getReports(projectId);
      set({ reports, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchPendingReports: async () => {
    set({ loading: true, error: null });
    try {
      const pendingReports = reportingService.listPendingReports();
      set({ pendingReports, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  verifyReport: async (reportId, daoUpload) => {
    set({ loading: true, error: null });
    try {
      const updatedReport = reportingService.verifyReport({ reportId, daoUpload });
      
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
