import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, DollarSign, TreePine, Eye, ShoppingCart, Award, CheckCircle, ExternalLink, X, Building2, Coins, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useWeb3 } from '../contexts/Web3Context';
import NBCard from '../components/NBCard';
import NBButton from '../components/NBButton';

const CarbonMarketplace = () => {
  const { isConnected, account, web3Service } = useWeb3();
  const navigate = useNavigate();
  const [verifiedProjects, setVerifiedProjects] = useState([]);
  const [fundedProjects, setFundedProjects] = useState(new Set()); // Track funded projects locally
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [investmentModal, setInvestmentModal] = useState(false);
  const [investmentData, setInvestmentData] = useState({
    amount: '',
    companyName: '',
    carbonCredits: 1000
  });
  const [filters, setFilters] = useState({
    location: '',
    minBudget: '',
    maxBudget: '',
    searchTerm: '',
    status: 'all' // Add status filter back
  });

  // Load funded projects from localStorage on component mount
  useEffect(() => {
    const savedFundedProjects = localStorage.getItem('fundedProjects');
    if (savedFundedProjects) {
      try {
        const parsedFunded = JSON.parse(savedFundedProjects);
        setFundedProjects(new Set(parsedFunded));
      } catch (error) {
        console.error('Error loading funded projects from localStorage:', error);
      }
    }
  }, []);

  // Save funded projects to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('fundedProjects', JSON.stringify([...fundedProjects]));
  }, [fundedProjects]);

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
    
    if (budget < 1000) {
      return `₹${budget} L`;
    }
    
    const lakhs = budget / 100000;
    return `₹${lakhs.toFixed(1)} L`;
  };

  // Check if project is funded (locally tracked)
  const isProjectFunded = (projectId) => {
    return fundedProjects.has(projectId.toString());
  };

  // Toggle project funded status
  const toggleProjectFundedStatus = (projectId) => {
    const id = projectId.toString();
    setFundedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        toast.info(`Project marked as Verified`);
      } else {
        newSet.add(id);
        toast.success(`Project marked as Funded`);
      }
      return newSet;
    });
  };

  // Fetch verified projects from blockchain
  const fetchVerifiedProjects = async () => {
    if (!isConnected || !web3Service) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get all projects from the EcoLedger contract
      const allProjects = await web3Service.getAllProjects();
      
      // Process projects and filter for verified ones
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
            estimatedBudget = 
              metadata.financial_details?.estimated_budget_inr ||
              metadata.attributes?.find(attr => attr.trait_type === 'Budget')?.value?.replace(/[^\d]/g, '') ||
              metadata.project_details?.estimated_budget ||
              10; // Default 10 lakhs for demo
          } else {
            estimatedBudget = 10; // Default when no metadata
          }
          
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
            description: metadata?.description || metadata?.project_details?.description || 'Verified blue carbon restoration project with government approval.',
            speciesPlanted: metadata?.project_details?.species_planted || metadata?.attributes?.find(attr => attr.trait_type === 'Species')?.value || 'Native mangrove species',
            targetPlants: metadata?.project_details?.target_plants || metadata?.attributes?.find(attr => attr.trait_type === 'Target Plants')?.value || 25000,
            estimatedBudget: estimatedBudget,
            securityDeposit: metadata?.financial_details?.security_deposit_inr || 5,
            photos: allImages || [],
            // Hardcoded additional data for companies
            carbonSequestrationRate: '2.5 tons CO₂/hectare/year',
            projectDuration: '5 years',
            certificationStandard: 'Verified Carbon Standard (VCS)',
            biodiversityImpact: 'High - Mangrove ecosystem restoration',
            communityBenefits: 'Employment for 50+ local families',
            monitoringFrequency: 'Monthly drone surveys + quarterly field visits',
            riskAssessment: 'Low risk - Government backed project',
            // Add local funded status
            isFunded: isProjectFunded(project.id)
          };
        })
      );
      
      // Filter for verified projects (validated and not fraud)
      const verifiedOnly = processedProjects.filter(project => 
        project.isValidated && !project.isFraud && (project.status === "VALIDATED" || project.status === "FUNDED")
      );
      
      setVerifiedProjects(verifiedOnly);
      
    } catch (error) {
      console.error('Error fetching verified projects:', error);
      setError(error.message);
      toast.error('Failed to fetch verified projects: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter projects based on current filters
  const filteredProjects = verifiedProjects.filter(project => {
    if (filters.searchTerm && 
        !project.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
        !project.location.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    
    if (filters.location && 
        !project.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    
    if (filters.minBudget && project.estimatedBudget < parseInt(filters.minBudget)) {
      return false;
    }
    
    if (filters.maxBudget && project.estimatedBudget > parseInt(filters.maxBudget)) {
      return false;
    }

    // Filter by funding status
    if (filters.status === 'verified') {
      return !project.isFunded;
    }
    if (filters.status === 'funded') {
      return project.isFunded;
    }
    
    return true;
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      minBudget: '',
      maxBudget: '',
      searchTerm: '',
      status: 'all'
    });
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
  };

  const handleInvest = (project) => {
    setSelectedProject(project);
    setInvestmentModal(true);
    // Make investment amount and carbon credits the same
    setInvestmentData({
      amount: '10', // Default 10 lakhs
      companyName: '',
      carbonCredits: 10 // Same as amount
    });
  };

  // Handle amount change and sync with carbon credits
  const handleAmountChange = (value) => {
    const amount = parseFloat(value) || 0;
    setInvestmentData(prev => ({
      ...prev,
      amount: value,
      carbonCredits: amount // Make carbon credits equal to investment amount
    }));
  };

  const handleInvestmentSubmit = async () => {
    if (!isConnected || !web3Service) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!investmentData.amount || !investmentData.companyName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      toast.loading('Processing investment...', { id: 'invest-project' });
      
      // Call the smart contract to buy carbon credits
      const txHash = await web3Service.buyCarbon(
        selectedProject.id,
        investmentData.carbonCredits, // This equals the investment amount
        investmentData.companyName,
        {
          amount: parseFloat(investmentData.amount), // Amount in lakhs
          projectTitle: selectedProject.title,
          projectLocation: selectedProject.location
        }
      );
      
      toast.success(`Investment successful! You received ${investmentData.carbonCredits} carbon credits and a certificate NFT. TX: ${txHash.slice(0, 10)}...`, { 
        id: 'invest-project',
        duration: 5000
      });
      
      setInvestmentModal(false);
      setSelectedProject(null);
      
      // Refresh the projects list
      await fetchVerifiedProjects();
      
    } catch (error) {
      console.error('Failed to invest in project:', error);
      toast.error('Failed to process investment: ' + error.message, { id: 'invest-project' });
    }
  };

  // Fetch projects on component mount and when connection changes
  useEffect(() => {
    if (isConnected) {
      fetchVerifiedProjects();
    }
  }, [isConnected, account]);

  // Project Card Component
  const ProjectCard = ({ project }) => {
    const [imageError, setImageError] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const isFunded = project.isFunded;
    
    return (
      <NBCard className="overflow-hidden hover:-translate-y-1 transition-transform">
        {/* Cover Image */}
        <div className="relative h-48 -m-5 mb-4 overflow-hidden">
          <img
            src={imageError ? '/mock-images/placeholder-project.jpg' : project.coverImage}
            alt={project.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          
          {/* Status Badge with Dropdown */}
          <div className="absolute top-3 left-3">
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`px-2 py-1 text-xs rounded-full border flex items-center gap-1 hover:opacity-80 transition-opacity ${
                  isFunded 
                    ? 'bg-blue-100 text-blue-800 border-blue-300' 
                    : 'bg-green-100 text-green-800 border-green-300'
                }`}
              >
                {isFunded ? <Coins size={12} /> : <CheckCircle size={12} />}
                {isFunded ? 'Funded' : 'Verified'}
                <ChevronDown size={10} />
              </button>
              
              {showStatusDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-nb shadow-lg border border-nb-ink/20 z-10 min-w-[120px]">
                  <button
                    onClick={() => {
                      if (isFunded) {
                        toggleProjectFundedStatus(project.id);
                      }
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-green-50 flex items-center gap-2 ${
                      !isFunded ? 'text-green-600 bg-green-50' : 'text-gray-600'
                    }`}
                  >
                    <CheckCircle size={12} />
                    Verified
                  </button>
                  <button
                    onClick={() => {
                      if (!isFunded) {
                        toggleProjectFundedStatus(project.id);
                      }
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-blue-50 flex items-center gap-2 ${
                      isFunded ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
                    }`}
                  >
                    <Coins size={12} />
                    Funded
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-300">
              {project.carbonSequestrationRate}
            </span>
          </div>
          
          {/* Image count indicator */}
          {project.photos && project.photos.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
              📷 {project.photos.length}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div>
            <h3 className="font-display font-bold text-lg text-nb-ink line-clamp-2">
              {project.title}
            </h3>
            <div className="flex items-center text-sm text-nb-ink/70 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {project.location}
            </div>
            <div className="flex items-center text-sm text-nb-ink/60 mt-1">
              <TreePine className="w-4 h-4 mr-1" />
              {project.targetPlants.toLocaleString()} trees planned
            </div>
          </div>

          {/* Project Info */}
          <div className="space-y-2">
            <div className="text-xs text-nb-ink/60">
              Species: {project.speciesPlanted}
            </div>
            <div className="text-xs text-nb-ink/60">
              Duration: {project.projectDuration}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-nb-ink/70">Project Value:</span>
              <span className="font-semibold text-nb-ink">{formatBudget(project.estimatedBudget)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-nb-ink/70">NFT ID:</span>
              <span className="font-mono text-sm text-nb-ink">#{project.nftTokenId}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <NBButton 
              variant="ghost" 
              size="sm"
              className="flex-1"
              onClick={() => handleViewDetails(project)}
            >
              <Eye size={14} className="mr-1" />
              Details
            </NBButton>
            <NBButton 
              variant={isFunded ? "secondary" : "primary"} 
              size="sm"
              className="flex-1"
              onClick={() => handleInvest(project)}
              disabled={isFunded}
            >
              <ShoppingCart size={14} className="mr-1" />
              {isFunded ? 'Funded' : 'Invest'}
            </NBButton>
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
          <Building2 size={64} className="text-nb-ink/30 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-nb-ink mb-2">
            Connect Wallet
          </h2>
          <p className="text-nb-ink/70 mb-6">
            Please connect your wallet to access the Carbon Marketplace and invest in verified projects.
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
          <p className="text-lg text-nb-ink/70">Loading verified projects from blockchain...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-nb-error mb-4">Error loading projects: {error}</p>
          <NBButton onClick={fetchVerifiedProjects}>
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
            Carbon Marketplace
          </h1>
          <p className="text-lg text-nb-ink/70">
            Invest in verified blue carbon restoration projects and receive carbon credits + NFT certificates
          </p>
          <p className="text-sm text-nb-ink/50 mt-1">
            Connected: {account?.slice(0, 8)}...{account?.slice(-4)} | Sepolia Testnet
          </p>
        </div>

        {/* Stats Banner */}
        <NBCard className="mb-8 bg-gradient-to-r from-nb-accent/10 to-nb-accent-2/10">
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-nb-accent">{verifiedProjects.length}</div>
              <div className="text-sm text-nb-ink/60">Total Projects</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-nb-accent-2">{verifiedProjects.filter(p => !p.isFunded).length}</div>
              <div className="text-sm text-nb-ink/60">Available for Investment</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-nb-ok">{fundedProjects.size}</div>
              <div className="text-sm text-nb-ink/60">Successfully Funded</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-nb-accent">VCS</div>
              <div className="text-sm text-nb-ink/60">Certified Standard</div>
            </div>
          </div>
        </NBCard>

        {/* Filters */}
        <NBCard className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-nb-accent" />
            <h3 className="text-lg font-display font-bold">Filter Projects</h3>
          </div>
          
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Search
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nb-ink/50" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nb-ink/50" />
                <input
                  type="text"
                  placeholder="Enter location"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Min Investment (₹L)
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nb-ink/50" />
                <input
                  type="number"
                  placeholder="Min amount"
                  value={filters.minBudget}
                  onChange={(e) => handleFilterChange('minBudget', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Max Investment (₹L)
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nb-ink/50" />
                <input
                  type="number"
                  placeholder="Max amount"
                  value={filters.maxBudget}
                  onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
              >
                <option value="all">All Projects</option>
                <option value="verified">Available (Verified)</option>
                <option value="funded">Successfully Funded</option>
              </select>
            </div>
          </div>
          
          {Object.values(filters).some(value => value !== '' && value !== 'all') && (
            <div className="mt-4 pt-4 border-t border-nb-ink/20">
              <NBButton variant="ghost" onClick={clearFilters}>
                Clear All Filters
              </NBButton>
            </div>
          )}
        </NBCard>

        {/* Results */}
        <div className="mb-6">
          <p className="text-lg text-nb-ink/70">
            Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            {filters.status === 'verified' && ' available for investment'}
            {filters.status === 'funded' && ' successfully funded'}
          </p>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TreePine size={64} className="text-nb-ink/30 mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-nb-ink mb-2">
              No Projects Found
            </h3>
            <p className="text-nb-ink/70 mb-6">
              {Object.values(filters).some(value => value !== '' && value !== 'all') 
                ? 'Try adjusting your filters to find more projects.'
                : 'No verified projects are currently available for investment.'
              }
            </p>
            {Object.values(filters).some(value => value !== '' && value !== 'all') && (
              <NBButton variant="primary" onClick={clearFilters}>
                Clear Filters
              </NBButton>
            )}
          </div>
        )}

        {/* Project Details Modal */}
        {selectedProject && !investmentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <NBCard className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-display font-bold text-nb-ink">
                    {selectedProject.title}
                  </h3>
                  {selectedProject.isFunded && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-300 flex items-center gap-1">
                      <Coins size={14} />
                      Funded
                    </span>
                  )}
                </div>
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

                {/* Investment Opportunity */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">
                    {selectedProject.isFunded ? 'Investment Completed' : 'Investment Opportunity'}
                  </h4>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-nb border ${
                      selectedProject.isFunded 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {selectedProject.isFunded ? (
                          <Coins size={16} className="text-blue-600" />
                        ) : (
                          <CheckCircle size={16} className="text-green-600" />
                        )}
                        <span className={`font-semibold ${
                          selectedProject.isFunded ? 'text-blue-800' : 'text-green-800'
                        }`}>
                          {selectedProject.isFunded ? 'Successfully Funded' : 'Government Verified'}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        selectedProject.isFunded ? 'text-blue-700' : 'text-green-700'
                      }`}>
                        {selectedProject.isFunded 
                          ? 'This project has received investment and is now being implemented.'
                          : 'This project has been approved by NCCR and meets all regulatory standards.'
                        }
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Project Value</label>
                      <p className="text-xl font-bold text-nb-ink">{formatBudget(selectedProject.estimatedBudget)}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Carbon Sequestration</label>
                      <p className="text-nb-ink">{selectedProject.carbonSequestrationRate}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Certification Standard</label>
                      <p className="text-nb-ink">{selectedProject.certificationStandard}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Risk Assessment</label>
                      <p className="text-nb-ink">{selectedProject.riskAssessment}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Details Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Environmental Impact</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Target Trees</label>
                      <p className="text-nb-ink">{selectedProject.targetPlants.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Species</label>
                      <p className="text-nb-ink">{selectedProject.speciesPlanted}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Biodiversity Impact</label>
                      <p className="text-nb-ink">{selectedProject.biodiversityImpact}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4">Project Timeline</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Duration</label>
                      <p className="text-nb-ink">{selectedProject.projectDuration}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Monitoring</label>
                      <p className="text-nb-ink">{selectedProject.monitoringFrequency}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Started</label>
                      <p className="text-nb-ink">{selectedProject.createdAt?.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4">Social Impact</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Location</label>
                      <p className="text-nb-ink">{selectedProject.location}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">Community Benefits</label>
                      <p className="text-nb-ink">{selectedProject.communityBenefits}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-nb-ink/60">NFT Certificate</label>
                      <p className="text-nb-ink">#{selectedProject.nftTokenId}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4">Project Description</h4>
                <p className="text-nb-ink/80 leading-relaxed">
                  {selectedProject.description}
                </p>
              </div>

              {/* Metadata Link */}
              {selectedProject.metadataUri && (
                <div className="mb-6 p-4 bg-nb-accent/10 rounded-nb">
                  <h4 className="text-sm font-semibold mb-2">Blockchain Verification</h4>
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
                  variant="ghost" 
                  onClick={() => setSelectedProject(null)}
                >
                  Close
                </NBButton>
                {!selectedProject.isFunded && (
                  <NBButton 
                    variant="primary" 
                    onClick={() => handleInvest(selectedProject)}
                    icon={<ShoppingCart size={16} />}
                  >
                    Invest in Project
                  </NBButton>
                )}
              </div>
            </NBCard>
          </div>
        )}

        {/* Investment Modal */}
        {investmentModal && selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <NBCard className="max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-bold text-nb-ink">
                  Invest in Project
                </h3>
                <NBButton variant="ghost" onClick={() => setInvestmentModal(false)}>
                  <X size={20} />
                </NBButton>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-nb-accent/10 rounded-nb">
                  <h4 className="font-semibold text-nb-ink mb-2">{selectedProject.title}</h4>
                  <p className="text-sm text-nb-ink/70">{selectedProject.location}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-nb-ink mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your company name"
                    value={investmentData.companyName}
                    onChange={(e) => setInvestmentData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-nb-ink mb-2">
                    Investment Amount (₹ Lakhs) *
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount in lakhs"
                    value={investmentData.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
                  />
                  <p className="text-xs text-nb-ink/60 mt-1">
                    You will receive {investmentData.carbonCredits} carbon credits (1:1 ratio)
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-nb border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <Award size={16} />
                    What You'll Receive
                  </h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• {investmentData.carbonCredits} Carbon Credits (ERC20 tokens)</li>
                    <li>• NFT Investment Certificate with your company name</li>
                    <li>• CSR compliance documentation</li>
                    <li>• Carbon neutrality verification</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end pt-6 border-t border-nb-ink/20 mt-6">
                <NBButton 
                  variant="ghost" 
                  onClick={() => setInvestmentModal(false)}
                >
                  Cancel
                </NBButton>
                <NBButton 
                  variant="primary" 
                  onClick={handleInvestmentSubmit}
                  disabled={!investmentData.amount || !investmentData.companyName}
                >
                  Complete Investment
                </NBButton>
              </div>
            </NBCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarbonMarketplace;
