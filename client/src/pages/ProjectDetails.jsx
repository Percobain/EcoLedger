import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MapPin, Calendar, TreePine, Leaf, FileText, ExternalLink, Star, User, Shield, CheckCircle, Clock, DollarSign, Camera, Download, Eye } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import NBCard from '../components/NBCard';
import NBButton from '../components/NBButton';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isConnected, web3Service } = useWeb3();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  // Generate hardcoded realistic progress data
  const generateProgressData = (projectName) => {
    return [
      {
        stage: "Site Preparation",
        date: "2024-01-15",
        status: "completed",
        description: "Site survey completed, soil testing done, and preparation work finished.",
        images: [
          "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1573160813959-df05c1b19309?w=800&h=600&fit=crop"
        ]
      },
      {
        stage: "Plantation Phase 1",
        date: "2024-02-01",
        status: "completed", 
        description: "First batch of 5,000 saplings planted across 2 hectares.",
        images: [
          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1464822759844-d150baec84ef?w=800&h=600&fit=crop"
        ]
      },
      {
        stage: "Plantation Phase 2", 
        date: "2024-03-15",
        status: "in_progress",
        description: "Second batch of 3,000 saplings being planted. 60% complete.",
        images: [
          "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop"
        ]
      },
      {
        stage: "Monitoring Setup",
        date: "2024-04-01", 
        status: "pending",
        description: "Installation of monitoring equipment and irrigation systems.",
        images: []
      }
    ];
  };

  // Generate hardcoded impact metrics
  const generateImpactMetrics = () => {
    return {
      carbonSequestered: "125.8",
      treesPlanted: "8,247",
      survivalRate: "87.3",
      areaRestored: "4.2",
      wildlifeSpeciesReturned: "23",
      localJobsCreated: "15",
      communityBeneficiaries: "450"
    };
  };

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);

        if (!isConnected || !web3Service) {
          toast.error('Please connect your wallet to view project details');
          navigate('/ngo');
          return;
        }

        // Get user's projects and find the specific one
        const userProjects = await web3Service.getUserProjects(web3Service.getCurrentAccount());
        const foundProject = userProjects.find(p => p.id === id);

        if (!foundProject) {
          toast.error('Project not found');
          navigate('/ngo');
          return;
        }

        // Fetch metadata if available
        let metadata = null;
        let projectImages = ['/mock-images/placeholder-project.jpg'];
        let projectDocuments = [];

        if (foundProject.metadataUri) {
          try {
            const ipfsUrl = foundProject.metadataUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
            const response = await fetch(ipfsUrl);
            if (response.ok) {
              metadata = await response.json();
              
              // Get all images from metadata
              if (metadata.files && Array.isArray(metadata.files)) {
                const images = metadata.files.map(file => getImageUrl(file));
                const docs = metadata.files.filter(file => 
                  !file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
                ).map(file => ({
                  name: file.split('/').pop() || 'Document',
                  url: getImageUrl(file),
                  type: 'PDF',
                  size: '2.4 MB'
                }));
                
                projectImages = images.length > 0 ? images : projectImages;
                projectDocuments = docs;
              }
            }
          } catch (error) {
            console.warn('Failed to fetch metadata:', error);
          }
        }

        // Create enhanced project object with hardcoded data
        const enhancedProject = {
          ...foundProject,
          metadata,
          images: projectImages,
          documents: projectDocuments,
          progress: generateProgressData(foundProject.projectName),
          impact: generateImpactMetrics(),
          // Hardcoded additional details
          description: metadata?.description || "This blue carbon restoration project focuses on rehabilitating coastal ecosystems through strategic mangrove plantation and conservation efforts. The initiative aims to enhance biodiversity, protect coastal communities from erosion, and contribute significantly to carbon sequestration goals.",
          projectType: "Blue Carbon Restoration",
          ecosystem: metadata?.project_details?.species_planted?.includes('Rhizophora') ? "Mangrove Forest" : "Coastal Wetland",
          startDate: "2024-01-15",
          expectedCompletion: "2024-12-15",
          totalArea: "15.7 hectares",
          estimatedCarbonCapture: "500 tonnes CO2/year",
          biodiversityScore: "8.4/10",
          communityImpact: "High",
          verificationStatus: foundProject.isValidated ? "Verified by NCCR" : "Under Review",
          lastUpdated: "2024-03-28"
        };

        setProject(enhancedProject);

      } catch (error) {
        console.error('Failed to load project:', error);
        toast.error('Failed to load project details');
        navigate('/ngo');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProject();
    }
  }, [id, navigate, isConnected, web3Service]);

  const getStatusBadge = (project) => {
    if (project.isFraud) {
      return <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full border border-red-300">Fraud Detected</span>;
    }
    if (project.isValidated) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full border border-green-300">NCCR Verified</span>;
    }
    return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full border border-yellow-300">Under Review</span>;
  };

  const getProgressStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Completed</span>;
      case 'in_progress':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">In Progress</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Pending</span>;
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'progress', label: 'Progress' },
    { id: 'impact', label: 'Impact Metrics' },
    { id: 'documents', label: 'Documents' },
    { id: 'gallery', label: 'Gallery' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-nb-accent"></div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-nb-ink/70 mb-4">
            <button onClick={() => navigate('/ngo')} className="hover:text-nb-ink">
              NGO Dashboard
            </button>
            <span className="mx-2">›</span>
            <span className="text-nb-ink">{project.metadata?.name || project.projectName}</span>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            <div>
              <h1 className="font-display font-bold text-3xl text-nb-ink mb-2">
                {project.metadata?.name || project.projectName}
              </h1>
              <div className="flex items-center text-nb-ink/70 mb-4">
                <MapPin className="w-4 h-4 mr-1" />
                {project.location}
              </div>
              <div className="flex items-center space-x-4 flex-wrap gap-2">
                <span className="px-3 py-1 bg-nb-accent text-nb-ink text-sm rounded border border-nb-ink">
                  {project.ecosystem}
                </span>
                {getStatusBadge(project)}
                {project.fundsReleased && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded border border-blue-300">
                    Funded
                  </span>
                )}
                <div className="flex items-center text-sm text-nb-ink/70">
                  <TreePine className="w-4 h-4 mr-1" />
                  NFT ID: #{project.nftTokenId}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="mb-8">
          <div className="relative h-96 rounded-nb overflow-hidden border-2 border-nb-ink">
            <img
              src={project.images[selectedImageIndex]}
              alt={project.metadata?.name || project.projectName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/mock-images/placeholder-project.jpg';
              }}
            />
            {project.images.length > 1 && (
              <div className="absolute bottom-4 left-4 flex space-x-2">
                {project.images.slice(0, 5).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-3 h-3 rounded-full border-2 ${
                      index === selectedImageIndex ? 'bg-white border-white' : 'bg-white/50 border-white/50'
                    }`}
                  />
                ))}
                {project.images.length > 5 && (
                  <span className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                    +{project.images.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Info Card */}
            <NBCard>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-nb-accent border-2 border-nb-ink rounded-nb flex items-center justify-center">
                  <User className="w-6 h-6 text-nb-ink" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-nb-ink">
                    Submitted by {project.ngo?.slice(0, 6)}...{project.ngo?.slice(-4)}
                  </h3>
                  <div className="flex items-center text-sm text-nb-ink/70">
                    <Shield className="w-3 h-3 mr-1" />
                    <span>Verified NGO • {project.verificationStatus}</span>
                  </div>
                </div>
              </div>
            </NBCard>

            {/* Tabs */}
            <NBCard>
              <div className="border-b-2 border-nb-ink/20 mb-6">
                <nav className="flex space-x-8 overflow-x-auto">
                  {tabs.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === id
                          ? 'border-nb-accent text-nb-ink'
                          : 'border-transparent text-nb-ink/70 hover:text-nb-ink'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="space-y-6">
                {activeTab === 'overview' && (
                  <div>
                    <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
                      About this project
                    </h3>
                    <p className="font-body text-nb-ink/80 leading-relaxed mb-6">
                      {project.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <TreePine className="w-4 h-4 text-nb-ink/60" />
                          <span className="text-sm"><strong>Species:</strong> {project.metadata?.project_details?.species_planted || 'Native species'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Leaf className="w-4 h-4 text-nb-ink/60" />
                          <span className="text-sm"><strong>Target Plants:</strong> {project.metadata?.project_details?.target_plants?.toLocaleString() || 'Multiple varieties'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-nb-ink/60" />
                          <span className="text-sm"><strong>Start Date:</strong> {project.startDate}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-nb-ink/60" />
                          <span className="text-sm"><strong>Total Area:</strong> {project.totalArea}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-nb-ink/60" />
                          <span className="text-sm"><strong>Ecosystem:</strong> {project.ecosystem}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Leaf className="w-4 h-4 text-nb-ink/60" />
                          <span className="text-sm"><strong>Carbon Capture:</strong> {project.estimatedCarbonCapture}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-nb-ink/60" />
                          <span className="text-sm"><strong>Biodiversity Score:</strong> {project.biodiversityScore}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-nb-ink/60" />
                          <span className="text-sm"><strong>Community Impact:</strong> {project.communityImpact}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'progress' && (
                  <div>
                    <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
                      Project Progress Timeline
                    </h3>
                    <div className="space-y-6">
                      {project.progress.map((stage, index) => (
                        <div key={index} className="border border-nb-ink/20 rounded-nb p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-nb-ink">{stage.stage}</h4>
                            <div className="flex items-center space-x-2">
                              {getProgressStatusBadge(stage.status)}
                              <span className="text-sm text-nb-ink/60">{stage.date}</span>
                            </div>
                          </div>
                          <p className="text-sm text-nb-ink/70 mb-3">{stage.description}</p>
                          {stage.images.length > 0 && (
                            <div className="flex space-x-2">
                              {stage.images.map((image, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={image}
                                  alt={`${stage.stage} - Image ${imgIndex + 1}`}
                                  className="w-20 h-20 object-cover rounded border border-nb-ink/20"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'impact' && (
                  <div>
                    <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
                      Environmental Impact Metrics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-green-50 border border-green-200 rounded-nb p-4 text-center">
                        <TreePine className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-800">{project.impact.treesPlanted}</div>
                        <div className="text-sm text-green-600">Trees Planted</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-nb p-4 text-center">
                        <Leaf className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-800">{project.impact.carbonSequestered} t</div>
                        <div className="text-sm text-blue-600">Carbon Sequestered</div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-nb p-4 text-center">
                        <CheckCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-yellow-800">{project.impact.survivalRate}%</div>
                        <div className="text-sm text-yellow-600">Survival Rate</div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-nb p-4 text-center">
                        <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-purple-800">{project.impact.areaRestored} ha</div>
                        <div className="text-sm text-purple-600">Area Restored</div>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-nb p-4 text-center">
                        <User className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-orange-800">{project.impact.communityBeneficiaries}</div>
                        <div className="text-sm text-orange-600">Community Beneficiaries</div>
                      </div>
                      <div className="bg-teal-50 border border-teal-200 rounded-nb p-4 text-center">
                        <Star className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-teal-800">{project.impact.wildlifeSpeciesReturned}</div>
                        <div className="text-sm text-teal-600">Wildlife Species</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div>
                    <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
                      Project Documents
                    </h3>
                    {project.documents.length > 0 ? (
                      <div className="space-y-3">
                        {project.documents.map((doc, index) => (
                          <div key={index} className="border border-nb-ink/20 rounded-nb p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-8 h-8 text-nb-accent" />
                              <div>
                                <h4 className="font-medium text-nb-ink">{doc.name}</h4>
                                <p className="text-sm text-nb-ink/60">{doc.type} • {doc.size}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <NBButton variant="ghost" size="sm" onClick={() => window.open(doc.url, '_blank')}>
                                <Eye size={14} className="mr-1" />
                                View
                              </NBButton>
                              <NBButton variant="ghost" size="sm" onClick={() => window.open(doc.url, '_blank')}>
                                <Download size={14} className="mr-1" />
                                Download
                              </NBButton>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText size={48} className="text-nb-ink/30 mx-auto mb-4" />
                        <p className="text-nb-ink/70">No documents uploaded yet</p>
                      </div>
                    )}
                    
                    {project.metadataUri && (
                      <div className="mt-6 pt-6 border-t border-nb-ink/20">
                        <NBButton
                          variant="secondary"
                          onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${project.metadataUri.replace('ipfs://', '')}`, '_blank')}
                        >
                          <ExternalLink size={16} className="mr-2" />
                          View Full Metadata on IPFS
                        </NBButton>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'gallery' && (
                  <div>
                    <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
                      Project Gallery ({project.images.length} images)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {project.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Project image ${index + 1}`}
                            className="w-full h-48 object-cover rounded-nb border border-nb-ink/20 cursor-pointer hover:opacity-75 transition-opacity"
                            onClick={() => setSelectedImageIndex(index)}
                            onError={(e) => {
                              e.target.src = '/mock-images/placeholder-project.jpg';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-nb flex items-center justify-center">
                            <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </NBCard>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Financial Summary */}
            <NBCard>
              <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
                Financial Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-nb-ink/20">
                  <span className="text-nb-ink/70">Total Budget</span>
                  <span className="font-bold text-nb-ink">₹{project.displayBudget} L</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-nb-ink/20">
                  <span className="text-nb-ink/70">Security Deposit</span>
                  <span className="font-bold text-nb-ink">₹{project.displayDeposit} L</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-nb-ink/20">
                  <span className="text-nb-ink/70">Funding Status</span>
                  <span className={`font-bold ${project.fundsReleased ? 'text-green-600' : 'text-yellow-600'}`}>
                    {project.fundsReleased ? 'Released' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-nb-ink/70">Created</span>
                  <span className="font-bold text-nb-ink">{project.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
            </NBCard>

            {/* Quick Stats */}
            <NBCard>
              <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-nb-ink/70">Blockchain Network</span>
                  <span className="text-sm font-medium text-nb-ink">Sepolia Testnet</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-nb-ink/70">NFT Token ID</span>
                  <span className="text-sm font-mono text-nb-ink">#{project.nftTokenId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-nb-ink/70">Last Updated</span>
                  <span className="text-sm text-nb-ink">{project.lastUpdated}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-nb-ink/70">Images Count</span>
                  <span className="text-sm text-nb-ink">{project.images.length}</span>
                </div>
              </div>
            </NBCard>

            {/* Actions */}
            <NBCard>
              <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
                Actions
              </h3>
              <div className="space-y-3">
                <NBButton variant="primary" className="w-full" disabled>
                  <FileText size={16} className="mr-2" />
                  Generate Report
                </NBButton>
                <NBButton variant="secondary" className="w-full" onClick={() => navigate('/ngo')}>
                  <TreePine size={16} className="mr-2" />
                  Back to Dashboard
                </NBButton>
                {project.metadataUri && (
                  <NBButton 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${project.metadataUri.replace('ipfs://', '')}`, '_blank')}
                  >
                    <ExternalLink size={16} className="mr-2" />
                    View on IPFS
                  </NBButton>
                )}
              </div>
            </NBCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
