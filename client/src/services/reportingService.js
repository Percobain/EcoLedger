import { mockReports } from './mockData';
import { projectsService } from './projectsService';

let reports = [...mockReports];

export const reportingService = {
  submitReport: ({ projectId, ngoUpload }) => {
    const report = {
      id: `rep-${Date.now()}`,
      projectId,
      ngoUpload,
      daoUpload: [],
      exifMatch: true, // Mock EXIF validation - always true for demo
      status: 'submitted',
      submittedAt: new Date().toISOString().split('T')[0]
    };
    
    reports.push(report);
    
    // Update project status to reporting if it was funded
    const project = projectsService.getById(projectId);
    if (project && project.status === 'funded') {
      projectsService.update(projectId, { status: 'reporting' });
    }
    
    return report;
  },

  getReports: (projectId) => {
    return reports.filter(r => r.projectId === projectId);
  },

  verifyReport: ({ reportId, daoUpload }) => {
    const reportIndex = reports.findIndex(r => r.id === reportId);
    if (reportIndex !== -1) {
      reports[reportIndex] = {
        ...reports[reportIndex],
        daoUpload,
        status: 'verified',
        verifiedAt: new Date().toISOString().split('T')[0]
      };
      return reports[reportIndex];
    }
    return null;
  },

  listPendingReports: () => {
    return reports.filter(r => r.status === 'submitted');
  },

  listAllReports: () => {
    return reports;
  },

  getReportableProjects: () => {
    // Get projects that are funded and need reporting
    return projectsService.listAll({ status: 'funded' })
      .concat(projectsService.listAll({ status: 'reporting' }));
  }
};

export default reportingService;
