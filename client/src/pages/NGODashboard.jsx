import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, TreePine, CheckCircle, Clock, DollarSign, Wallet, AlertTriangle, RefreshCw, ExternalLink, Coins, MapPin, FileText } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { toast } from 'sonner';
import NBButton from '../components/NBButton';
import StatPill from '../components/StatPill';
import NBCard from '../components/NBCard';
import web3Service from '../services/web3Service';

const NGODashboard = () => {
  const { isConnected, account, web3Service } = useWeb3();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    funded: 0
  });
  const [pendingWithdrawal, setPendingWithdrawal] = useState('0');
  const [carbonBalance, setCarbonBalance] = useState('0');
  const [statusFilter, setStatusFilter] = useState('');

  // Helper function to convert IPFS URL to gateway URL (FIXED for better reliability)
  const getImageUrl = (ipfsUrl) => {
    if (!ipfsUrl) return '/mock-images/placeholder-project.jpg';
    
    // Convert ipfs:// to https://gateway.pinata.cloud/ipfs/
    if (ipfsUrl.startsWith('ipfs://')) {
      return ipfsUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    
    // If it's already a gateway URL, return as is
    if (ipfsUrl.startsWith('https://')) {
      return ipfsUrl;
    }
    
    // If it's just a hash, add the gateway prefix
    if (ipfsUrl.startsWith('Qm') || ipfsUrl.startsWith('bafy')) {
      return `https://gateway.pinata.cloud/ipfs/${ipfsUrl}`;
    }
    
    return '/mock-images/placeholder-project.jpg';
  };

  // Helper function to display amounts in INR (multiplied from ETH)
  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Fetch user projects from EcoLedger
  const fetchUserProjects = async () => {
    if (!isConnected || !web3Service) return;
    
    setLoading(true);
    try {
      const userProjects = await web3Service.getUserProjects(account);
      
      // Process projects with metadata and images
      const projectsWithMetadata = await Promise.all(
        userProjects.map(async (project) => {
          let metadata = null;
          let coverImage = '/mock-images/placeholder-project.jpg';
          let allImages = [];
          
          // Try to fetch metadata from IPFS
          if (project.metadataUri) {
            try {
              const ipfsUrl = project.metadataUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
              const response = await fetch(ipfsUrl);
              if (response.ok) {
                metadata = await response.json();
                
                // FIXED: Get cover image from metadata - priority to metadata.image
                if (metadata.image) {
                  coverImage = getImageUrl(metadata.image);
                  console.log('Found cover image:', coverImage); // Debug log
                }
                
                // Get all images from files array and convert them
                if (metadata.files && Array.isArray(metadata.files)) {
                  allImages = metadata.files.map(file => getImageUrl(file));
                  
                  // If no main image but we have files, use first file as cover
                  if (!metadata.image && allImages.length > 0) {
                    coverImage = allImages[0];
                    console.log('Using first file as cover:', coverImage); // Debug log
                  }
                }
                
                console.log('Processed project:', {
                  name: metadata.name,
                  coverImage,
                  allImages,
                  originalImage: metadata.image
                }); // Debug log
              }
            } catch (error) {
              console.warn('Failed to fetch metadata for project:', project.id, error);
            }
          }
          
          return {
            ...project,
            metadata,
            coverImage,
            allImages,
            // Use metadata financial details if available, otherwise defaults
            quotationAmount: metadata?.financial_details?.estimated_budget_eth || '0',
            securityDeposit: metadata?.financial_details?.security_deposit_eth || '0',
            displayBudget: metadata?.financial_details?.estimated_budget_inr || project.fakeINRBudget || 0,
            displayDeposit: metadata?.financial_details?.security_deposit_inr || project.fakeINRDeposit || 0
          };
        })
      );
      
      setProjects(projectsWithMetadata);
      
      // Calculate stats
      const newStats = {
        total: projectsWithMetadata.length,
        verified: projectsWithMetadata.filter(p => p.isValidated).length,
        pending: projectsWithMetadata.filter(p => !p.isValidated && !p.isFraud).length,
        funded: projectsWithMetadata.filter(p => p.fundsReleased).length
      };
      setStats(newStats);
      
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending withdrawal amount
  const fetchPendingWithdrawal = async () => {
    if (!isConnected || !web3Service) return;
    
    try {
      const pending = await web3Service.getPendingWithdrawal(account);
      setPendingWithdrawal(pending);
    } catch (error) {
      console.error('Error fetching pending withdrawal:', error);
    }
  };

  // Fetch carbon balance
  const fetchCarbonBalance = async () => {
    if (!isConnected || !web3Service) return;
    
    try {
      const balance = await web3Service.getCarbonBalance(account);
      setCarbonBalance(balance);
    } catch (error) {
      console.error('Error fetching carbon balance:', error);
    }
  };

  // Withdraw funds
  const handleWithdraw = async () => {
    if (!isConnected || !web3Service) return;
    
    try {
      toast.loading('Processing withdrawal...', { id: 'withdraw' });
      const txHash = await web3Service.withdraw();
      toast.success(`Withdrawal successful! TX: ${txHash.slice(0, 10)}...`, { id: 'withdraw' });
      
      // Refresh data
      fetchPendingWithdrawal();
    } catch (error) {
      console.error('Withdrawal failed:', error);
      toast.error('Withdrawal failed: ' + error.message, { id: 'withdraw' });
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchUserProjects();
      fetchPendingWithdrawal();
      fetchCarbonBalance();
    }
  }, [isConnected, account]);

  // Filter projects
  const filteredProjects = projects.filter(project => {
    if (!statusFilter) return true;
    
    switch (statusFilter) {
      case 'pending':
        return !project.isValidated && !project.isFraud;
      case 'verified':
        return project.isValidated;
      case 'funded':
        return project.fundsReleased;
      case 'fraud':
        return project.isFraud;
      default:
        return true;
    }
  });

  const getStatusBadge = (project) => {
    if (project.isFraud) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Fraud</span>;
    }
    if (project.isValidated) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Verified</span>;
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Under Review</span>;
  };

  // Project Card Component with FIXED image loading
  const ProjectCard = ({ project }) => (
    <NBCard className="overflow-hidden hover:-translate-y-1 transition-transform">
      {/* Cover Image */}
      <div className="relative h-48 -m-5 mb-4 overflow-hidden">
        <img
          src={project.coverImage}
          alt={project.metadata?.name || project.projectName}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Image failed to load:', project.coverImage);
            e.target.src = '/mock-images/placeholder-project.jpg';
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', project.coverImage);
          }}
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {getStatusBadge(project)}
          {project.fundsReleased && (
            <span className="bg-nb-accent text-nb-ink text-xs font-medium px-2 py-1 rounded border border-nb-ink">
              Funded
            </span>
          )}
        </div>
        {/* Image count indicator */}
        {project.allImages && project.allImages.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
            📷 {project.allImages.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div>
          <h3 className="font-display font-bold text-lg text-nb-ink line-clamp-2">
            {project.metadata?.name || project.projectName}
          </h3>
          <div className="flex items-center text-sm text-nb-ink/70 mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            {project.location}
          </div>
          {/* Show species and target plants if available from metadata */}
          {project.metadata?.project_details?.species_planted && (
            <div className="text-xs text-nb-ink/60 mt-1">
              Species: {project.metadata.project_details.species_planted}
            </div>
          )}
          {project.metadata?.project_details?.target_plants && (
            <div className="text-xs text-nb-ink/60">
              Target: {project.metadata.project_details.target_plants.toLocaleString()} plants
            </div>
          )}
        </div>

        {/* Financial Info */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-nb-ink/70">Budget:</span>
            <span className="font-semibold text-nb-ink">₹{project.displayBudget} L</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-nb-ink/70">Deposit:</span>
            <span className="font-semibold text-nb-ink">₹{project.displayDeposit} L</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-nb-ink/70">NFT ID:</span>
            <span className="font-mono text-sm text-nb-ink">#{project.nftTokenId}</span>
          </div>
        </div>

        {/* Description from metadata */}
        {project.metadata?.description && (
          <div className="pt-2 border-t border-nb-ink/10">
            <p className="text-xs text-nb-ink/70 line-clamp-2">
              {project.metadata.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {project.metadataUri && (
            <NBButton 
              variant="ghost" 
              size="sm"
              className="flex-1"
              onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${project.metadataUri.replace('ipfs://', '')}`, '_blank')}
            >
              <ExternalLink size={14} className="mr-1" />
              Metadata
            </NBButton>
          )}
          <NBButton 
            variant="secondary" 
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/ngo/project/${project.id}`)} // Navigate to project details
          >
            <FileText size={14} className="mr-1" />
            Details
          </NBButton>
        </div>
      </div>
    </NBCard>
  );

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <NBCard className="max-w-md w-full text-center">
          <Wallet size={64} className="text-nb-ink/30 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-nb-ink mb-2">
            Connect Wallet
          </h2>
          <p className="text-nb-ink/70 mb-6">
            Please connect your wallet to access the NGO dashboard.
          </p>
        </NBCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-nb-ink mb-2">
              NGO Dashboard
            </h1>
            <p className="text-lg text-nb-ink/70">
              Manage your blue carbon restoration projects
            </p>
            <p className="text-sm text-nb-ink/50 mt-1">
              Account: {account?.slice(0, 8)}...{account?.slice(-4)} | Sepolia Testnet
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <NBButton variant="ghost" onClick={fetchUserProjects} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </NBButton>
            <Link to="/ngo/new">
              <NBButton variant="primary" size="lg" icon={<Plus size={20} />}>
                Add New Project
              </NBButton>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <StatPill 
            label="Total Projects" 
            value={stats.total} 
            icon={<TreePine size={24} />}
          />
          <StatPill 
            label="Verified" 
            value={stats.verified} 
            icon={<CheckCircle size={24} />}
          />
          <StatPill 
            label="Under Review" 
            value={stats.pending} 
            icon={<Clock size={24} />}
          />
          <StatPill 
            label="Funded" 
            value={stats.funded} 
            icon={<DollarSign size={24} />}
          />
          <StatPill 
            label="Available Balance" 
            value={web3Service.fakeINRDisplay(pendingWithdrawal)}
            icon={<Wallet size={24} />}
            onClick={parseFloat(pendingWithdrawal) > 0 ? handleWithdraw : undefined}
            className={parseFloat(pendingWithdrawal) > 0 ? 'cursor-pointer hover:bg-nb-accent/20' : ''}
          />
          <StatPill 
            label="Carbon Credits" 
            value={parseFloat(carbonBalance).toFixed(0)} 
            icon={<Coins size={24} />}
          />
        </div>

        {/* Projects Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-nb-ink">
              Your Projects ({filteredProjects.length})
            </h2>
            <div className="flex gap-2">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-card text-nb-ink focus:outline-none focus:ring-2 focus:ring-nb-accent"
              >
                <option value="">All Status</option>
                <option value="pending">Under Review</option>
                <option value="verified">Verified</option>
                <option value="funded">Funded</option>
                <option value="fraud">Fraud</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-nb-accent mx-auto mb-4"></div>
              <p className="text-lg text-nb-ink/70">Loading your projects...</p>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TreePine size={64} className="text-nb-ink/30 mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold text-nb-ink mb-2">
                {statusFilter ? `No ${statusFilter} projects found` : 'No Projects Yet'}
              </h3>
              <p className="text-nb-ink/70 mb-6">
                {statusFilter 
                  ? 'Try changing the filter or create a new project.'
                  : 'Start your first blue carbon restoration project to make an impact.'
                }
              </p>
              <Link to="/ngo/new">
                <NBButton variant="primary" icon={<Plus size={20} />}>
                  Create Your First Project
                </NBButton>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-nb-card rounded-nb border-2 border-nb-ink p-6">
          <h3 className="text-xl font-display font-bold text-nb-ink mb-4">
            Quick Actions
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            <Link to="/ngo/new">
              <NBButton variant="ghost" className="w-full justify-start">
                <Plus size={16} className="mr-2" />
                Submit New Project
              </NBButton>
            </Link>
            {parseFloat(pendingWithdrawal) > 0 && (
              <NBButton variant="secondary" className="w-full justify-start" onClick={handleWithdraw}>
                <Wallet size={16} className="mr-2" />
                Withdraw {web3Service.fakeINRDisplay(pendingWithdrawal)}
              </NBButton>
            )}
            <NBButton variant="ghost" className="w-full justify-start" onClick={fetchUserProjects}>
              <RefreshCw size={16} className="mr-2" />
              Refresh Projects
            </NBButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGODashboard;
