import { useEffect, useState } from "react";
import {
  Check,
  X,
  Eye,
  Users,
  User,
  Vote,
  MapPin,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useWeb3 } from "../contexts/Web3Context";
import NBCard from "../components/NBCard";
import NBButton from "../components/NBButton";
import { useTransaction } from '../hooks/useTransaction';

const Verification = () => {
  const { isConnected, account, web3Service } = useWeb3();
  const { executeTransaction } = useTransaction();
  const [pendingProjects, setPendingProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationMode, setVerificationMode] = useState("centralized");
  const [selectedProject, setSelectedProject] = useState(null);

  // Helper function to convert IPFS URL to gateway URL
  const getImageUrl = (ipfsUrl) => {
    if (!ipfsUrl)
      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop&crop=center";

    if (ipfsUrl.startsWith("ipfs://")) {
      return ipfsUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }

    if (ipfsUrl.startsWith("https://")) {
      return ipfsUrl;
    }

    if (ipfsUrl.startsWith("Qm") || ipfsUrl.startsWith("bafy")) {
      return `https://gateway.pinata.cloud/ipfs/${ipfsUrl}`;
    }

    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop&crop=center";
  };

  // Helper function to format budget display
  const formatBudget = (budget) => {
    if (!budget || budget === 0) return "₹0";

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
      console.log("Fetched projects:", allProjects); // Debug log

      // Process projects and filter for pending ones
      const processedProjects = await Promise.all(
        allProjects.map(async (project) => {
          let metadata = project.metadata;
          let coverImage = "/mock-images/placeholder-project.jpg";
          let allImages = [];

          // If metadata wasn't fetched in getAllProjects, try to fetch it here
          if (!metadata && project.metadataUri) {
            try {
              const ipfsUrl = project.metadataUri.replace(
                "ipfs://",
                "https://gateway.pinata.cloud/ipfs/"
              );
              const response = await fetch(ipfsUrl);
              if (response.ok) {
                metadata = await response.json();
                console.log(
                  "Fetched metadata for project",
                  project.id,
                  ":",
                  metadata
                ); // Debug log
              }
            } catch (error) {
              console.warn(
                "Failed to fetch metadata for project:",
                project.id,
                error
              );
            }
          }

          if (metadata) {
            // Get cover image from metadata
            if (metadata.image) {
              coverImage = getImageUrl(metadata.image);
            }

            // Get all images from files array
            if (metadata.files && Array.isArray(metadata.files)) {
              allImages = metadata.files.map((file) => getImageUrl(file));

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
              metadata.attributes
                ?.find((attr) => attr.trait_type === "Budget")
                ?.value?.replace(/[^\d]/g, "") ||
              metadata.project_details?.estimated_budget ||
              10; // Default 10 lakhs for demo
          } else {
            estimatedBudget = 10; // Default when no metadata
          }

          console.log("Budget for project", project.id, ":", estimatedBudget); // Debug log

          return {
            id: project.id,
            title:
              metadata?.name || project.projectName || `Project #${project.id}`,
            location:
              project.location ||
              metadata?.project_details?.location ||
              "Location not specified",
            ngo: project.ngo,
            projectName: project.projectName,
            status: project.status,
            isValidated: project.isValidated,
            isFraud: project.isFraud,
            isDisputed: project.isDisputed,
            createdAt: project.createdAt
              ? new Date(Number(project.createdAt) * 1000)
              : new Date(),
            metadataUri: project.metadataUri,
            nftTokenId: project.nftTokenId?.toString(),
            fundsReleased: project.fundsReleased,
            metadata,
            coverImage,
            allImages,
            // Extract details from metadata
            description:
              metadata?.description ||
              metadata?.project_details?.description ||
              "No description available",
            speciesPlanted:
              metadata?.project_details?.species_planted ||
              metadata?.attributes?.find(
                (attr) => attr.trait_type === "Species"
              )?.value ||
              "Not specified",
            targetPlants:
              metadata?.project_details?.target_plants ||
              metadata?.attributes?.find(
                (attr) => attr.trait_type === "Target Plants"
              )?.value ||
              0,
            estimatedBudget: estimatedBudget,
            securityDeposit:
              metadata?.financial_details?.security_deposit_inr || 5, // Default for demo
            photos: allImages || [],
          };
        })
      );

      console.log("Processed projects:", processedProjects); // Debug log

      // Filter for pending projects (not validated, not fraud)
      const pendingOnly = processedProjects.filter(
        (project) =>
          !project.isValidated &&
          !project.isFraud &&
          project.status === "PENDING"
      );

      console.log("Pending projects:", pendingOnly); // Debug log
      setPendingProjects(pendingOnly);
    } catch (error) {
      console.error("Error fetching pending projects:", error);
      setError(error.message);
      toast.error("Failed to fetch pending projects: " + error.message);
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
      toast.error("Please connect your wallet");
      return;
    }

    try {
      await executeTransaction(
        () => web3Service.verifyProject(projectId, true),
        'Project approved successfully!',
        'Failed to approve project: ',
        'verify-project'
      );

      setSelectedProject(null);
      await fetchPendingProjects();
    } catch (error) {
      // Error is already handled by executeTransaction
    }
  };

  const handleReject = async (projectId) => {
    if (!isConnected || !web3Service) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      await executeTransaction(
        () => web3Service.verifyProject(projectId, false),
        'Project rejected successfully!',
        'Failed to reject project: ',
        'verify-project'
      );

      setSelectedProject(null);
      await fetchPendingProjects();
    } catch (error) {
      // Error is already handled by executeTransaction
    }
  };

  const handleViewDetails = (projectId) => {
    const project = pendingProjects.find((p) => p.id === projectId);
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
              src={
                imageError
                  ? "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop&crop=center"
                  : project.coverImage
              }
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
                  <span className="truncate">
                    NGO: {project.ngo?.slice(0, 8)}...{project.ngo?.slice(-4)}
                  </span>
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
                  onClick={() =>
                    window.open(
                      `https://gateway.pinata.cloud/ipfs/${project.metadataUri.replace(
                        "ipfs://",
                        ""
                      )}`,
                      "_blank"
                    )
                  }
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
          <p className="text-lg text-nb-ink/70">
            Loading pending projects from blockchain...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={64} className="text-nb-error mx-auto mb-4" />
          <p className="text-lg text-nb-error mb-4">
            Error loading projects: {error}
          </p>
          <NBButton onClick={fetchPendingProjects}>Try Again</NBButton>
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
            Connected: {account?.slice(0, 8)}...{account?.slice(-4)} | Sepolia
            Testnet
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
                Choose between centralized (government) or decentralized (DAO)
                verification
              </p>
            </div>

            <div className="flex rounded-nb border-2 border-slate-300 overflow-hidden">
              <button
                onClick={() => handleModeChange("centralized")}
                className={`px-6 py-3 flex items-center gap-2 transition-colors ${
                  verificationMode === "centralized"
                    ? "bg-nb-accent text-nb-ink"
                    : "bg-nb-card text-nb-ink/70 hover:bg-nb-accent/20"
                }`}
              >
                <User size={20} />
                Centralized
              </button>
              <button
                onClick={() => handleModeChange("decentralized")}
                className={`px-6 py-3 flex items-center gap-2 transition-colors ${
                  verificationMode === "decentralized"
                    ? "bg-nb-accent-2 text-nb-ink"
                    : "bg-nb-card text-nb-ink/70 hover:bg-nb-accent-2/20"
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
            {verificationMode === "centralized" ? (
              <User size={24} className="text-nb-ink mt-1" />
            ) : (
              <Users size={24} className="text-nb-ink mt-1" />
            )}
            <div>
              <h3 className="text-lg font-display font-bold text-nb-ink mb-2">
                {verificationMode === "centralized"
                  ? "Centralized Verification"
                  : "Decentralized DAO Verification"}
              </h3>
              <p className="text-nb-ink/70">
                {verificationMode === "centralized"
                  ? "Projects are reviewed and approved by certified government officials (NCCR) using blockchain verification."
                  : "Projects are reviewed and voted on by the DAO community members for transparent decision-making on the blockchain."}
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
                <NBButton
                  variant="ghost"
                  onClick={() => setSelectedProject(null)}
                >
                  <X size={20} />
                </NBButton>
              </div>

              {/* Bento Grid Layout */}
              <div className="grid grid-cols-12 gap-6 mb-8">
                {/* Main Image - Large focal point */}
                <div className="col-span-12 md:col-span-5 lg:col-span-4">
                  <div className="bg-nb-card rounded-nb border-2 border-slate-300 overflow-hidden h-80">
                    {selectedProject.photos &&
                    selectedProject.photos.length > 0 ? (
                      <img
                        src={selectedProject.photos[0]}
                        alt="Main project image"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://www.oneearth.org/ecoregions/southern-africa-mangroves/";
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl mb-4">📷</div>
                          <p className="text-xl font-bold text-nb-ink">
                            No Image
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Budget & Financial Info - Prominent section */}
                <div className="col-span-12 md:col-span-7 lg:col-span-4">
                  <div className="grid grid-rows-2 gap-6 h-80">
                    <div className="bg-blue-50 p-6 rounded-nb border-2 border-blue-200">
                      <label className="text-sm font-bold text-blue-700 mb-2 block uppercase tracking-wide">
                        Estimated Budget
                      </label>
                      <p className="text-4xl font-black text-blue-800">
                        {formatBudget(selectedProject.estimatedBudget)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-nb-card p-4 rounded-nb border-2 border-slate-300">
                        <label className="text-xs font-bold text-nb-ink/70 mb-2 block uppercase tracking-wide">
                          Security Deposit
                        </label>
                        <p className="text-xl font-black text-nb-ink">
                          {formatBudget(selectedProject.securityDeposit)}
                        </p>
                      </div>
                      <div className="bg-nb-card p-4 rounded-nb border-2 border-slate-300">
                        <label className="text-xs font-bold text-nb-ink/70 mb-2 block uppercase tracking-wide">
                          NFT Token ID
                        </label>
                        <p className="text-xl font-black text-nb-ink font-mono">
                          #{selectedProject.nftTokenId}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Stats - Compact section */}
                <div className="col-span-12 lg:col-span-4">
                  <div className="grid grid-rows-3 gap-4 h-80">
                    <div className="bg-nb-card p-4 rounded-nb border-2 border-slate-300">
                      <label className="text-xs font-bold text-nb-ink/70 mb-2 block uppercase tracking-wide">
                        Location
                      </label>
                      <p className="text-lg font-bold text-nb-ink">
                        {selectedProject.location}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-nb border-2 border-green-200">
                      <label className="text-xs font-bold text-green-700 mb-2 block uppercase tracking-wide">
                        Target Plants
                      </label>
                      <p className="text-2xl font-black text-green-800">
                        {selectedProject.targetPlants?.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-nb-card p-4 rounded-nb border-2 border-slate-300">
                      <label className="text-xs font-bold text-nb-ink/70 mb-2 block uppercase tracking-wide">
                        Submitted On
                      </label>
                      <p className="text-lg font-semibold text-nb-ink">
                        {selectedProject.createdAt?.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Images - Secondary gallery */}
                {selectedProject.photos &&
                  selectedProject.photos.length > 1 && (
                    <div className="col-span-12 md:col-span-6 lg:col-span-4">
                      {selectedProject.photos
                        .slice(1, 3)
                        .map((photo, index) => (
                          <div
                            key={index + 1}
                            className="bg-nb-card rounded-nb border-2 border-slate-300 overflow-hidden"
                          >
                            <img
                              src={photo}
                              alt={`Project ${index + 2}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src =
                                  "/mock-images/placeholder-project.jpg";
                              }}
                            />
                          </div>
                        ))}
                    </div>
                  )}

                {/* Species & NGO Info - Wide section */}
                <div
                  className={`col-span-12 ${
                    selectedProject.photos && selectedProject.photos.length > 1
                      ? "md:col-span-6 lg:col-span-8"
                      : "lg:col-span-8"
                  }`}
                >
                  <div className="grid grid-rows-2 gap-4 h-48">
                    <div className="bg-nb-card p-5 rounded-nb border-2 border-slate-300">
                      <label className="text-sm font-bold text-nb-ink/70 mb-2 block uppercase tracking-wide">
                        Species Planted
                      </label>
                      <p className="text-xl font-semibold text-nb-ink">
                        {selectedProject.speciesPlanted}
                      </p>
                    </div>
                    <div className="bg-nb-card p-5 rounded-nb border-2 border-slate-300">
                      <label className="text-sm font-bold text-nb-ink/70 mb-2 block uppercase tracking-wide">
                        NGO Address
                      </label>
                      <p className="text-base font-mono text-nb-ink break-all">
                        {selectedProject.ngo}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Project Description - Full width */}
                <div className="col-span-12">
                  <div className="bg-nb-card p-8 rounded-nb border-2 border-slate-300">
                    <label className="text-lg font-bold text-nb-ink/70 mb-4 block uppercase tracking-wide">
                      Project Description
                    </label>
                    <p className="text-lg text-nb-ink leading-relaxed font-medium">
                      {selectedProject.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metadata Link */}
              {selectedProject.metadataUri && (
                <div className="mb-8 p-6 bg-green-50 rounded-nb border-2 border-green-200">
                  <h4 className="text-xl font-display font-bold text-green-800 mb-4">
                    Blockchain Metadata
                  </h4>
                  <p className="text-green-700 mb-6 text-base font-medium">
                    View the complete project metadata stored on IPFS blockchain
                  </p>
                  <NBButton
                    variant="primary"
                    size="md"
                    onClick={() =>
                      window.open(
                        `https://gateway.pinata.cloud/ipfs/${selectedProject.metadataUri.replace(
                          "ipfs://",
                          ""
                        )}`,
                        "_blank"
                      )
                    }
                    className="px-6 py-3 font-bold"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    View Full Metadata on IPFS
                  </NBButton>
                </div>
              )}

              {/* Action Buttons */}
              <div className="bg-nb-card p-8 rounded-nb border-2 border-slate-300">
                <h4 className="text-3xl font-display font-black text-nb-ink mb-8 text-center">
                  VERIFICATION DECISION
                </h4>

                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <NBButton
                    variant="destructive"
                    onClick={() => handleReject(selectedProject.id)}
                    className="px-10 py-5 text-xl font-black flex items-center justify-center gap-3"
                  >
                    <X size={24} />
                    {verificationMode === "centralized"
                      ? "MARK AS FRAUD"
                      : "DAO VOTE: REJECT"}
                  </NBButton>
                  <NBButton
                    variant="primary"
                    onClick={() => handleApprove(selectedProject.id)}
                    className="px-10 py-5 text-xl font-black flex items-center justify-center gap-3"
                  >
                    <Check size={24} />
                    {verificationMode === "centralized"
                      ? "APPROVE PROJECT"
                      : "DAO VOTE: APPROVE"}
                  </NBButton>
                </div>

                {verificationMode === "decentralized" && (
                  <div className="mt-8 p-4 bg-nb-accent/20 rounded-nb border-2 border-slate-300">
                    <div className="flex items-center gap-3 justify-center text-nb-ink">
                      <AlertTriangle className="w-6 h-6" />
                      <p className="font-bold text-lg">
                        Your vote will be permanently recorded on the
                        blockchain. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </NBCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default Verification;
