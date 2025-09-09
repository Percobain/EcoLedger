import { mockVerifications } from './mockData';
import { projectsService } from './projectsService';

let verifications = [...mockVerifications];

export const verificationService = {
  listPending: () => {
    const pendingProjects = projectsService.listAll({ status: 'pending' });
    return pendingProjects;
  },

  approve: (projectId, mode, verifier = 'System') => {
    const verification = {
      id: `ver-${Date.now()}`,
      projectId,
      mode,
      verifier,
      decision: 'approved',
      timestamp: new Date().toISOString().split('T')[0]
    };
    
    if (mode === 'decentralized') {
      verification.votes = { approve: 12, reject: 1 }; // Mock DAO votes
    }
    
    verifications.push(verification);
    
    // Update project status
    projectsService.update(projectId, { 
      status: 'verified',
      verifiedAt: verification.timestamp
    });
    
    return verification;
  },

  reject: (projectId, mode, verifier = 'System', reason = '') => {
    const verification = {
      id: `ver-${Date.now()}`,
      projectId,
      mode,
      verifier,
      decision: 'rejected',
      timestamp: new Date().toISOString().split('T')[0],
      reason
    };
    
    if (mode === 'decentralized') {
      verification.votes = { approve: 3, reject: 8 }; // Mock DAO votes
    }
    
    verifications.push(verification);
    return verification;
  },

  getVerification: (projectId) => {
    return verifications.find(v => v.projectId === projectId);
  },

  listAll: () => {
    return verifications;
  }
};

export default verificationService;
