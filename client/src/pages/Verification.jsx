import { useEffect, useState } from 'react';
import { Check, X, Eye, Users, User, Vote } from 'lucide-react';
import { toast } from 'sonner';
import { useVerificationStore } from '../stores/useVerificationStore';
import NBCard from '../components/NBCard';
import NBButton from '../components/NBButton';
import ProjectCard from '../components/ProjectCard';

const Verification = () => {
  const {
    pendingProjects,
    loading,
    error,
    verificationMode,
    setVerificationMode,
    fetchPendingProjects,
    approveProject,
    rejectProject
  } = useVerificationStore();

  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchPendingProjects();
  }, [fetchPendingProjects]);

  const handleModeChange = (mode) => {
    setVerificationMode(mode);
    toast.info(`Switched to ${mode} verification mode`);
  };

  const handleApprove = async (projectId) => {
    try {
      const verifier = verificationMode === 'centralized' 
        ? 'Dr. Rajesh Kumar - Forest Officer' 
        : 'DAO Community';
      
      await approveProject(projectId, verifier);
      
      if (verificationMode === 'centralized') {
        toast.success('Project approved successfully!');
      } else {
        toast.success('DAO vote submitted! Project approved by community.');
      }
      
      setSelectedProject(null);
    } catch (error) {
      toast.error('Failed to approve project');
    }
  };

  const handleReject = async (projectId) => {
    try {
      const verifier = verificationMode === 'centralized' 
        ? 'Dr. Rajesh Kumar - Forest Officer' 
        : 'DAO Community';
      
      const reason = 'Does not meet environmental standards'; // In real app, get from form
      await rejectProject(projectId, reason, verifier);
      
      if (verificationMode === 'centralized') {
        toast.error('Project rejected');
      } else {
        toast.error('DAO vote submitted! Project rejected by community.');
      }
      
      setSelectedProject(null);
    } catch (error) {
      toast.error('Failed to reject project');
    }
  };

  const handleViewDetails = (projectId) => {
    const project = pendingProjects.find(p => p.id === projectId);
    setSelectedProject(project);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-nb-accent mx-auto mb-4"></div>
          <p className="text-lg text-nb-ink/70">Loading pending projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-nb-error mb-4">Error loading projects: {error}</p>
          <NBButton onClick={() => fetchPendingProjects()}>
            Try Again
          </NBButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-nb-ink mb-2">
            Project Verification
          </h1>
          <p className="text-lg text-nb-ink/70">
            Review and verify blue carbon restoration projects
          </p>
        </div>

        {/* Verification Mode Toggle */}
        <NBCard className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-display font-bold text-nb-ink mb-2">
                Verification Mode
              </h3>
              <p className="text-nb-ink/70">
                Choose between centralized (government) or decentralized (DAO) verification
              </p>
            </div>
            
            <div className="flex rounded-nb border-2 border-nb-ink overflow-hidden">
              <button
                onClick={() => handleModeChange('centralized')}
                className={`px-6 py-3 flex items-center gap-2 transition-colors ${
                  verificationMode === 'centralized'
                    ? 'bg-nb-accent text-nb-ink'
                    : 'bg-nb-card text-nb-ink/70 hover:bg-nb-accent/20'
                }`}
              >
                <User size={20} />
                Centralized
              </button>
              <button
                onClick={() => handleModeChange('decentralized')}
                className={`px-6 py-3 flex items-center gap-2 transition-colors ${
                  verificationMode === 'decentralized'
                    ? 'bg-nb-accent-2 text-nb-ink'
                    : 'bg-nb-card text-nb-ink/70 hover:bg-nb-accent-2/20'
                }`}
              >
                <Vote size={20} />
                Decentralized
              </button>
            </div>
          </div>
        </NBCard>

        {/* Mode Info */}
        <NBCard className="mb-8 bg-gradient-to-r from-nb-accent/10 to-nb-accent-2/10">
          <div className="flex items-start gap-4">
            {verificationMode === 'centralized' ? (
              <User size={24} className="text-nb-ink mt-1" />
            ) : (
              <Users size={24} className="text-nb-ink mt-1" />
            )}
            <div>
              <h3 className="text-lg font-display font-bold text-nb-ink mb-2">
                {verificationMode === 'centralized' ? 'Centralized Verification' : 'Decentralized DAO Verification'}
              </h3>
              <p className="text-nb-ink/70">
                {verificationMode === 'centralized' 
                  ? 'Projects are reviewed and approved by certified government officials and forest officers.'
                  : 'Projects are reviewed and voted on by the DAO community members for transparent decision-making.'
                }
              </p>
            </div>
          </div>
        </NBCard>

        {/* Pending Projects */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-nb-ink mb-6">
            Pending Verification ({pendingProjects.length})
          </h2>

          {pendingProjects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  {...project}
                  onView={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Check size={64} className="text-nb-ok mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold text-nb-ink mb-2">
                No Pending Projects
              </h3>
              <p className="text-nb-ink/70">
                All submitted projects have been verified. Great work!
              </p>
            </div>
          )}
        </div>

        {/* Project Details Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <NBCard className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-display font-bold text-nb-ink">
                  {selectedProject.title}
                </h3>
                <NBButton variant="ghost" onClick={() => setSelectedProject(null)}>
                  <X size={20} />
                </NBButton>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Project Images */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Project Images</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProject.photos?.map((photo, index) => (
                      <div key={index} className="aspect-square bg-gray-200 rounded-nb overflow-hidden border border-nb-ink">
                        <img 
                          src={photo} 
                          alt={`Project ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )) || (
                      <div className="col-span-2 text-center py-8 text-nb-ink/50">
                        No images available
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Details */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Project Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Location</label>
                      <p className="text-nb-ink">{selectedProject.location}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Species Planted</label>
                      <p className="text-nb-ink">{selectedProject.speciesPlanted}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Target Plants</label>
                      <p className="text-nb-ink">{selectedProject.targetPlants?.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Estimated Budget</label>
                      <p className="text-nb-ink">₹{selectedProject.estimatedBudget?.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Security Deposit</label>
                      <p className="text-nb-ink">₹{selectedProject.securityDeposit?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4">Description</h4>
                <p className="text-nb-ink/80 leading-relaxed">
                  {selectedProject.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end pt-6 border-t border-nb-ink/20">
                <NBButton 
                  variant="destructive" 
                  onClick={() => handleReject(selectedProject.id)}
                  icon={<X size={16} />}
                >
                  {verificationMode === 'centralized' ? 'Reject Project' : 'Vote Reject'}
                </NBButton>
                <NBButton 
                  variant="primary" 
                  onClick={() => handleApprove(selectedProject.id)}
                  icon={<Check size={16} />}
                >
                  {verificationMode === 'centralized' ? 'Approve Project' : 'Vote Approve'}
                </NBButton>
              </div>

              {verificationMode === 'decentralized' && (
                <div className="mt-4 p-4 bg-nb-accent/10 rounded-nb">
                  <p className="text-sm text-nb-ink/70 text-center">
                    Your vote will be recorded on the blockchain. Current threshold: 10 votes needed for approval.
                  </p>
                </div>
              )}
            </NBCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default Verification;
