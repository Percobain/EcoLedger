import { useEffect, useState } from 'react';
import { Check, X, Eye, Users, User, Vote, MapPin, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useWeb3 } from '../contexts/Web3Context';
import NBCard from '../components/NBCard';
import NBButton from '../components/NBButton';

const Verification = () => {
  const { isConnected, account, web3Service } = useWeb3();
  const [pendingProjects, setPendingProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationMode, setVerificationMode] = useState('centralized');
  const [selectedProject, setSelectedProject] = useState(null);

  // Helper function to convert IPFS URL to gateway URL
  const getImageUrl = (ipfsUrl) => {
    if (!ipfsUrl) return '/mock-images/placeholder-project.jpg';
    
    if (ipfsUrl.startsWith('ipfs://')) {
      return ipfsUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    
    if (ipfsUrl.startsWith('https://')) {
      return ipfsUrl;
    }
    
    if (ipfsUrl.startsWith('Qm') || ipfsUrl.startsWith('bafy')) {
      return `https://gateway.pinata.cloud/ipfs/${ipfsUrl}`;
    }
    
    return '/mock-images/placeholder-project.jpg';
  };

  // Helper function to format budget display
  const formatBudget = (budget) => {
    if (!budget || budget === 0) return '₹0';
    
    // If budget is already in lakhs format (like 10, 50, 100)
    if (budget < 1000) {
      return `₹${budget} L`;
    }
    
    // If budget is in actual INR (like 1000000 for 10 lakhs)
    const lakhs = budget / 100000;
    return `₹${lakhs.toFixed(1)} L`;
  };

  // Fetch all pending (under review) projects from blockchain
  const fetchPendingProjects = async () => {
    if (!isConnected || !web3Service) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get all projects from the EcoLedger contract
      const allProjects = await web3Service.getAllProjects();
      console.log('Fetched projects:', allProjects); // Debug log
      
      // Process projects and filter for pending ones
      const processedProjects = await Promise.all(
        allProjects.map(async (project) => {
          let metadata = project.metadata;
          let coverImage = '/mock-images/placeholder-project.jpg';
          let allImages = [];
          
          // If metadata wasn't fetched in getAllProjects, try to fetch it here
          if (!metadata && project.metadataUri) {
            try {
              const ipfsUrl = project.metadataUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
              const response = await fetch(ipfsUrl);
              if (response.ok) {
                metadata = await response.json();
                console.log('Fetched metadata for project', project.id, ':', metadata); // Debug log
              }
            } catch (error) {
              console.warn('Failed to fetch metadata for project:', project.id, error);
            }
          }
          
          if (metadata) {
            // Get cover image from metadata
            if (metadata.image) {
              coverImage = getImageUrl(metadata.image);
            }
            
            // Get all images from files array
            if (metadata.files && Array.isArray(metadata.files)) {
              allImages = metadata.files.map(file => getImageUrl(file));
              
              // If no main image but we have files, use first image as cover
              if (!metadata.image && allImages.length > 0) {
                coverImage = allImages[0];
              }
            }
          }

          // Extract budget from multiple possible sources
          let estimatedBudget = 0;
          if (metadata) {
            // Try different paths for budget
            estimatedBudget = 
              metadata.financial_details?.estimated_budget_inr ||
              metadata.attributes?.find(attr => attr.trait_type === 'Budget')?.value?.replace(/[^\d]/g, '') ||
              metadata.project_details?.estimated_budget ||
              10; // Default 10 lakhs for demo
          } else {
            estimatedBudget = 10; // Default when no metadata
          }

          console.log('Budget for project', project.id, ':', estimatedBudget); // Debug log
          
          return {
            id: project.id,
            title: metadata?.name || project.projectName || `Project #${project.id}`,
            location: project.location || metadata?.project_details?.location || 'Location not specified',
            ngo: project.ngo,
            projectName: project.projectName,
            status: project.status,
            isValidated: project.isValidated,
            isFraud: project.isFraud,
            isDisputed: project.isDisputed,
            createdAt: project.createdAt ? new Date(Number(project.createdAt) * 1000) : new Date(),
            metadataUri: project.metadataUri,
            nftTokenId: project.nftTokenId?.toString(),
            fundsReleased: project.fundsReleased,
            metadata,
            coverImage,
            allImages,
            // Extract details from metadata
            description: metadata?.description || metadata?.project_details?.description || 'No description available',
            speciesPlanted: metadata?.project_details?.species_planted || metadata?.attributes?.find(attr => attr.trait_type === 'Species')?.value || 'Not specified',
            targetPlants: metadata?.project_details?.target_plants || metadata?.attributes?.find(attr => attr.trait_type === 'Target Plants')?.value || 0,
            estimatedBudget: estimatedBudget,
            securityDeposit: metadata?.financial_details?.security_deposit_inr || 5, // Default for demo
            photos: allImages || []
          };
        })
      );
      
      console.log('Processed projects:', processedProjects); // Debug log
      
      // Filter for pending projects (not validated, not fraud)
      const pendingOnly = processedProjects.filter(project => 
        !project.isValidated && !project.isFraud && project.status === "PENDING"
      );
      
      console.log('Pending projects:', pendingOnly); // Debug log
      setPendingProjects(pendingOnly);
      
    } catch (error) {
      console.error('Error fetching pending projects:', error);
      setError(error.message);
      toast.error('Failed to fetch pending projects: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (mode) => {
    setVerificationMode(mode);
    toast.info(`Switched to ${mode} verification mode`);
  };

  const handleApprove = async (projectId) => {
    if (!isConnected || !web3Service) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      if (verificationMode === 'centralized') {
        toast.loading('Processing centralized approval...', { id: 'verify-project' });
        
        // Call centralized verification function
        const txHash = await web3Service.verifyCentralized(projectId, true);
        
        toast.success(`Project approved by NCCR! TX: ${txHash.slice(0, 10)}...`, { 
          id: 'verify-project' 
        });
      } else {
        toast.loading('Submitting DAO vote for approval...', { id: 'verify-project' });
        
        // Call decentralized dispute resolution (DAO vote)
        const txHash = await web3Service.resolveDispute(projectId, true);
        
        toast.success(`DAO vote submitted! Project approved by community. TX: ${txHash.slice(0, 10)}...`, { 
          id: 'verify-project' 
        });
      }
      
      setSelectedProject(null);
      
      // Refresh the projects list
      await fetchPendingProjects();
      
    } catch (error) {
      console.error('Failed to approve project:', error);
      toast.error('Failed to approve project: ' + error.message, { id: 'verify-project' });
    }
  };

  const handleReject = async (projectId) => {
    if (!isConnected || !web3Service) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      if (verificationMode === 'centralized') {
        toast.loading('Processing centralized rejection...', { id: 'verify-project' });
        
        // Call centralized verification function
        const txHash = await web3Service.verifyCentralized(projectId, false);
        
        toast.error(`Project marked as fraud by NCCR. TX: ${txHash.slice(0, 10)}...`, { 
          id: 'verify-project' 
        });
      } else {
        toast.loading('Submitting DAO vote for rejection...', { id: 'verify-project' });
        
        // Call decentralized dispute resolution (DAO vote)
        const txHash = await web3Service.resolveDispute(projectId, false);
        
        toast.error(`DAO vote submitted! Project rejected by community. TX: ${txHash.slice(0, 10)}...`, { 
          id: 'verify-project' 
        });
      }
      
      setSelectedProject(null);
      
      // Refresh the projects list
      await fetchPendingProjects();
      
    } catch (error) {
      console.error('Failed to reject project:', error);
      toast.error('Failed to reject project: ' + error.message, { id: 'verify-project' });
    }
  };

  const handleViewDetails = (projectId) => {
    const project = pendingProjects.find(p => p.id === projectId);
    setSelectedProject(project);
  };

  // Fetch projects on component mount and when connection changes
  useEffect(() => {
    if (isConnected) {
      fetchPendingProjects();
    }
  }, [isConnected, account]);

  // Project Card Component
  const ProjectCard = ({ project }) => {
    const [imageError, setImageError] = useState(false);
    
    return (
      <NBCard className="overflow-hidden hover:-translate-y-1 transition-transform">
        <div className="flex gap-6">
          {/* Cover Image */}
          <div className="relative w-2/7 h-52 flex-shrink-0 overflow-hidden rounded-nb">
            <img
              src={imageError ? '/mock-images/placeholder-project.jpg' : project.coverImage}
              alt={project.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute top-2 left-2">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full border border-yellow-300">
                Under Review
              </span>
            </div>
            {/* Image count indicator */}
            {project.photos && project.photos.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                📷 {project.photos.length}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-xl text-nb-ink mb-2 line-clamp-1">
                  {project.title}
                </h3>
                <div className="flex items-center text-sm text-nb-ink/70 mb-1">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{project.location}</span>
                </div>
                <div className="flex items-center text-sm text-nb-ink/60">
                  <User className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">NGO: {project.ngo?.slice(0, 8)}...{project.ngo?.slice(-4)}</span>
                </div>
              </div>
            </div>

            {/* Project Info Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {project.speciesPlanted && (
                <div>
                  <div className="text-xs text-nb-ink/60 mb-1">Species</div>
                  <div className="text-sm text-nb-ink font-medium line-clamp-2">
                    {project.speciesPlanted}
                  </div>
                </div>
              )}
              {project.targetPlants > 0 && (
                <div>
                  <div className="text-xs text-nb-ink/60 mb-1">Target</div>
                  <div className="text-sm text-nb-ink font-medium">
                    {project.targetPlants.toLocaleString()} plants
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-nb-ink/60 mb-1">Budget</div>
                <div className="text-sm text-nb-ink font-medium">
                  {formatBudget(project.estimatedBudget)}
                </div>
              </div>
              <div>
                <div className="text-xs text-nb-ink/60 mb-1">NFT ID</div>
                <div className="text-sm text-nb-ink font-mono">
                  #{project.nftTokenId}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <NBButton 
                variant="ghost" 
                size="sm"
                onClick={() => handleViewDetails(project.id)}
              >
                <Eye size={14} className="mr-1" />
                Review
              </NBButton>
              {project.metadataUri && (
                <NBButton 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${project.metadataUri.replace('ipfs://', '')}`, '_blank')}
                >
                  <ExternalLink size={14} className="mr-1" />
                  Metadata
                </NBButton>
              )}
            </div>
          </div>
        </div>
      </NBCard>
    );
  };

  // Show connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <NBCard className="max-w-md w-full text-center">
          <Vote size={64} className="text-nb-ink/30 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-nb-ink mb-2">
            Connect Wallet
          </h2>
          <p className="text-nb-ink/70 mb-6">
            Please connect your wallet to access the verification dashboard.
          </p>
        </NBCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-nb-accent mx-auto mb-4"></div>
          <p className="text-lg text-nb-ink/70">Loading pending projects from blockchain...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={64} className="text-nb-error mx-auto mb-4" />
          <p className="text-lg text-nb-error mb-4">Error loading projects: {error}</p>
          <NBButton onClick={fetchPendingProjects}>
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
          <p className="text-sm text-nb-ink/50 mt-1">
            Connected: {account?.slice(0, 8)}...{account?.slice(-4)} | Sepolia Testnet
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
                  ? 'Projects are reviewed and approved by certified government officials (NCCR) using blockchain verification.'
                  : 'Projects are reviewed and voted on by the DAO community members for transparent decision-making on the blockchain.'
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
            <div className="space-y-4">
              {pendingProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Check size={64} className="text-nb-accent mx-auto mb-4" />
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
                    {selectedProject.photos && selectedProject.photos.length > 0 ? (
                      selectedProject.photos.slice(0, 4).map((photo, index) => (
                        <div key={index} className="aspect-square bg-gray-200 rounded-nb overflow-hidden border border-nb-ink">
                          <img 
                            src={photo} 
                            alt={`Project ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/mock-images/placeholder-project.jpg';
                            }}
                          />
                        </div>
                      ))
                    ) : (
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
                      <label className="text-sm font-medium text-nb-ink/60">NGO Address</label>
                      <p className="text-nb-ink font-mono text-sm">{selectedProject.ngo}</p>
                    </div>
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
                      <p className="text-nb-ink">{formatBudget(selectedProject.estimatedBudget)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Security Deposit</label>
                      <p className="text-nb-ink">{formatBudget(selectedProject.securityDeposit)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">NFT Token ID</label>
                      <p className="text-nb-ink font-mono">#{selectedProject.nftTokenId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Submitted On</label>
                      <p className="text-nb-ink">{selectedProject.createdAt?.toLocaleDateString()}</p>
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

              {/* Metadata Link */}
              {selectedProject.metadataUri && (
                <div className="mb-6 p-4 bg-nb-accent/10 rounded-nb">
                  <h4 className="text-sm font-semibold mb-2">Blockchain Metadata</h4>
                  <NBButton 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${selectedProject.metadataUri.replace('ipfs://', '')}`, '_blank')}
                  >
                    <ExternalLink size={14} className="mr-1" />
                    View Full Metadata on IPFS
                  </NBButton>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end pt-6 border-t border-nb-ink/20">
                <NBButton 
                  variant="destructive" 
                  onClick={() => handleReject(selectedProject.id)}
                  icon={<X size={16} />}
                >
                  {verificationMode === 'centralized' ? 'Mark as Fraud' : 'DAO Vote: Fraud'}
                </NBButton>
                <NBButton 
                  variant="primary" 
                  onClick={() => handleApprove(selectedProject.id)}
                  icon={<Check size={16} />}
                >
                  {verificationMode === 'centralized' ? 'Approve Project' : 'DAO Vote: Approve'}
                </NBButton>
              </div>

              {verificationMode === 'decentralized' && (
                <div className="mt-4 p-4 bg-nb-accent/10 rounded-nb">
                  <p className="text-sm text-nb-ink/70 text-center">
                    Your vote will be recorded on the blockchain. This action cannot be undone.
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
