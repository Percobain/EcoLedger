import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MapPin, Calendar, TreePine, Leaf, FileText, ExternalLink, Star, User, Shield, CheckCircle, Clock, DollarSign, Camera, Download, Eye, ArrowRight } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { reportingService } from '../services/reportingService';
import NBCard from '../components/NBCard';
import NBButton from '../components/NBButton';
import { 
  ReactFlow, 
  Background, 
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Add animation keyframes
const animationStyles = `
  @keyframes fadeIn {
    0% {
      opacity: 0;
      transform: translateX(-30px);
    }
    30% {
      opacity: 0.3;
      transform: translateX(-20px);
    }
    70% {
      opacity: 0.7;
      transform: translateX(-10px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

// Add style tag to head
if (!document.getElementById('flow-animations')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'flow-animations';
  styleTag.textContent = animationStyles;
  document.head.appendChild(styleTag);
}

// Custom Timeline Node Component
const TimelineNode = ({ data, selected, isAnimating, animationIndex }) => {
  const nodeRef = useRef(null);
  
  useEffect(() => {
    if (nodeRef.current && isAnimating) {
      nodeRef.current.style.transform = 'translateX(0)';
      nodeRef.current.style.opacity = '1';
    }
  }, [isAnimating]);
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-br from-green-50 to-green-100 border-green-500 text-green-800 shadow-green-200/50';
      case 'in_progress':
        return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500 text-blue-800 shadow-blue-200/50';
      case 'pending':
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-400 text-gray-600 shadow-gray-200/50';
      default:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-400 text-gray-600 shadow-gray-200/50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'pending':
        return <Calendar className="w-5 h-5 text-gray-500" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-500" />;
    }
  };

  const getProgressPercentage = (status) => {
    switch (status) {
      case 'completed':
        return 100;
      case 'in_progress':
        return 60;
      case 'pending':
        return 0;
      default:
        return 0;
    }
  };

  return (
    <div 
      ref={nodeRef}
      style={{
        transform: 'translateX(-100%)',
        opacity: 0,
        animation: `fadeIn 1s ease-out ${data.index * 0.8}s forwards`,
        animationFillMode: 'forwards'
      }}
      className={`relative px-5 py-4 shadow-lg rounded-nb border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${getStatusColor(data.status)} ${selected ? 'ring-2 ring-nb-accent ring-offset-2' : ''} min-w-[220px] max-w-[280px]`}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-nb overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${data.status === 'completed' ? 'bg-green-500' : data.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'}`}
          style={{ width: `${getProgressPercentage(data.status)}%` }}
        />
      </div>

      {/* Status badge */}
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-current flex items-center justify-center">
        {getStatusIcon(data.status)}
      </div>

      <div className="pt-2">
        <div className="flex items-start justify-between mb-2">
          <div className="font-semibold text-sm leading-tight">{data.stage}</div>
          <div className="text-xs opacity-75 ml-2">{data.date}</div>
        </div>
        
        <div className="text-xs leading-relaxed mb-3 opacity-90">{data.description}</div>
        
        {/* Progress percentage indicator */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium">Progress</span>
          <span className="text-xs font-bold">{getProgressPercentage(data.status)}%</span>
        </div>

        {data.images && data.images.length > 0 && (
          <div className="mt-3 flex space-x-1">
            {data.images.slice(0, 3).map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${data.stage} - Image ${index + 1}`}
                className="w-8 h-8 object-cover rounded border-2 border-white shadow-sm hover:scale-110 transition-transform"
              />
            ))}
            {data.images.length > 3 && (
              <div className="w-8 h-8 bg-white/80 rounded border-2 border-white shadow-sm flex items-center justify-center text-xs font-medium">
                +{data.images.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  timeline: TimelineNode,
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isConnected, web3Service } = useWeb3();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedStage, setSelectedStage] = useState(null);
  const [animationStep, setAnimationStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Create flow nodes and edges from progress data
  const createTimelineFlow = useCallback((progressData) => {
    setIsAnimating(true);
    
    const flowNodes = progressData.map((stage, index) => ({
      id: `timeline-${index}`,
      type: 'timeline',
      position: { x: index * 320, y: 80 },
      data: {
        stage: stage.stage,
        date: stage.date,
        status: stage.status,
        description: stage.description,
        images: stage.images,
        index: index,
        isAnimating: true
      },
      draggable: false,
    }));

    // Create edges with animation delay
    const flowEdges = progressData.slice(0, -1).map((stage, index) => {
      const currentStatus = stage.status;
      const nextStatus = progressData[index + 1]?.status;
      
      // Edge styling based on completion status with dotted lines
      let edgeStyle = { 
        strokeWidth: 4,
        opacity: 0,
        animation: `fadeIn 0.8s ease-out ${(index + 1) * 0.8 + 0.5}s forwards`
      };
      let animated = false;
      let markerColor = '#9ca3af';
      
      if (currentStatus === 'completed') {
        edgeStyle.stroke = '#10b981';
        edgeStyle.strokeDasharray = '8,4';
        markerColor = '#10b981';
        animated = true;
      } else if (currentStatus === 'in_progress') {
        edgeStyle.stroke = '#3b82f6';
        edgeStyle.strokeDasharray = '6,6';
        markerColor = '#3b82f6';
        animated = true;
      } else {
        edgeStyle.stroke = '#d1d5db';
        edgeStyle.strokeDasharray = '4,8';
        edgeStyle.strokeOpacity = 0.7;
      }

      return {
        id: `edge-${index}`,
        source: `timeline-${index}`,
        target: `timeline-${index + 1}`,
        type: 'smoothstep',
        animated,
        style: edgeStyle,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: markerColor,
          width: 16,
          height: 16,
        },
        label: currentStatus === 'completed' ? '●' : currentStatus === 'in_progress' ? '●' : '○',
        labelStyle: { 
          fill: markerColor, 
          fontSize: 14, 
          fontWeight: 'bold',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '4px 6px',
          borderRadius: '50%',
          border: `2px solid ${markerColor}`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        },
        labelBgStyle: { fill: 'rgba(255, 255, 255, 0.95)', fillOpacity: 1 },
        labelShowBg: true,
        labelBgPadding: [4, 4],
        labelBgBorderRadius: 50,
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedStage(node.data);
  }, []);

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

  // Fetch submissions from backend
  const fetchSubmissions = async (projectId) => {
    try {
      setSubmissionsLoading(true);
      const submissionData = await reportingService.getReports(projectId);
      setSubmissions(submissionData);
      return submissionData;
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast.error('Failed to load project submissions');
      return [];
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Convert submissions to progress stages
  const convertSubmissionsToProgress = (submissions) => {
    if (!submissions || submissions.length === 0) {
      return generateHardcodedProgressData();
    }

    return submissions.map((submission, index) => {
      const submittedDate = new Date(submission.submittedAt).toLocaleDateString('en-CA');
      const verifiedDate = submission.verifiedAt ? new Date(submission.verifiedAt).toLocaleDateString('en-CA') : null;
      
      // Determine status based on submission status
      let status = 'pending';
      if (submission.status === 'verified') {
        status = 'completed';
      } else if (submission.status === 'pending' && submission.trustScore && submission.trustScore > 70) {
        status = 'in_progress';
      }

      return {
        stage: `Progress Report ${index + 1}`,
        date: verifiedDate || submittedDate,
        status: status,
        description: `${status === 'completed' ? 'Verified' : status === 'in_progress' ? 'Under review' : 'Submitted'} progress report with trust score: ${submission.trustScore || 'N/A'}${submission.flags && submission.flags.length > 0 ? ` (${submission.flags.length} flags)` : ''}`,
        images: submission.ngoUpload || [],
        submissionId: submission.id,
        trustScore: submission.trustScore,
        flags: submission.flags || [],
        autoVerified: submission.autoVerified || false
      };
    });
  };

  // Generate hardcoded realistic progress data as fallback
  const generateHardcodedProgressData = () => {
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

        // Fetch submissions and create progress data
        const submissionsData = await fetchSubmissions(foundProject.id);
        const progressData = convertSubmissionsToProgress(submissionsData);

        // Create enhanced project object with real data from IPFS
        const enhancedProject = {
          ...foundProject,
          metadata,
          images: projectImages,
          documents: projectDocuments,
          progress: progressData,
          impact: generateImpactMetrics(),
          // Use real data from IPFS metadata instead of hardcoded values
          description: metadata?.description || metadata?.about_project?.project_description || "This blue carbon restoration project focuses on rehabilitating coastal ecosystems through strategic mangrove plantation and conservation efforts. The initiative aims to enhance biodiversity, protect coastal communities from erosion, and contribute significantly to carbon sequestration goals.",
          projectType: "Blue Carbon Restoration",
          ecosystem: metadata?.about_project?.ecosystem || metadata?.project_details?.ecosystem || (metadata?.project_details?.species_planted?.includes('Rhizophora') ? "Mangrove Forest" : "Coastal Wetland"),
          startDate: metadata?.about_project?.start_date || metadata?.project_details?.start_date || "2024-01-15",
          expectedCompletion: "2024-12-15", // This could be calculated from start date + duration
          totalArea: metadata?.about_project?.total_area || metadata?.project_details?.total_area || "15.7 hectares",
          estimatedCarbonCapture: metadata?.about_project?.carbon_capture || metadata?.project_details?.carbon_capture || "500 tonnes CO2/year",
          biodiversityScore: metadata?.about_project?.biodiversity_score || metadata?.project_details?.biodiversity_score || "8.4/10",
          communityImpact: metadata?.about_project?.community_impact || metadata?.project_details?.community_impact || "High",
          verificationStatus: foundProject.isValidated ? "Verified by NCCR" : "Under Review",
          lastUpdated: "2024-03-28",
          // Additional fields from IPFS
          speciesPlanted: metadata?.about_project?.species || metadata?.project_details?.species_planted || foundProject.speciesPlanted,
          targetPlants: metadata?.about_project?.target_plants || metadata?.project_details?.target_plants || foundProject.targetPlants
        };

        setProject(enhancedProject);
        
        // Create timeline flow
        createTimelineFlow(enhancedProject.progress);

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
  }, [id, navigate, isConnected, web3Service, createTimelineFlow]);

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
    { id: 'submissions', label: `Submissions (${submissions.length})` },
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
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-bold text-lg text-nb-ink">
                        Project Progress Timeline
                      </h3>
                      
                      {/* Timeline Legend */}
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span className="text-nb-ink/70">Completed</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span className="text-nb-ink/70">In Progress</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span className="text-nb-ink/70">Pending</span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-green-50 border border-green-200 rounded-nb p-3 text-center">
                        <div className="text-2xl font-bold text-green-700">{project.progress.filter(p => p.status === 'completed').length}</div>
                        <div className="text-xs text-green-600">Completed</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-nb p-3 text-center">
                        <div className="text-2xl font-bold text-blue-700">{project.progress.filter(p => p.status === 'in_progress').length}</div>
                        <div className="text-xs text-blue-600">In Progress</div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-nb p-3 text-center">
                        <div className="text-2xl font-bold text-gray-700">{project.progress.filter(p => p.status === 'pending').length}</div>
                        <div className="text-xs text-gray-600">Pending</div>
                      </div>
                      <div className="bg-nb-accent border border-nb-ink/20 rounded-nb p-3 text-center">
                        <div className="text-2xl font-bold text-nb-ink">
                          {Math.round((project.progress.filter(p => p.status === 'completed').length / project.progress.length) * 100)}%
                        </div>
                        <div className="text-xs text-nb-ink/70">Overall Progress</div>
                      </div>
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-nb p-4 mb-6 border border-nb-ink/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-nb-ink">Project Timeline Progress</span>
                        <span className="text-sm font-bold text-nb-ink">
                          {Math.round((project.progress.filter(p => p.status === 'completed').length / project.progress.length) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000 shadow-sm relative overflow-hidden"
                          style={{ 
                            width: `${(project.progress.filter(p => p.status === 'completed').length / project.progress.length) * 100}%` 
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-nb-ink/60 mt-2">
                        <span className="flex items-center space-x-1">
                          <TreePine className="w-3 h-3" />
                          <span>{project.progress.filter(p => p.status === 'completed').length} of {project.progress.length} stages completed</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Started {project.startDate}</span>
                        </span>
                      </div>
                    </div>
                    
                    {/* React Flow Timeline */}
                    <div className="border border-nb-ink/20 rounded-nb mb-6 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                      <div style={{ width: '100%', height: '350px' }}>
                        <ReactFlow
                          nodes={nodes}
                          edges={edges}
                          onNodesChange={onNodesChange}
                          onEdgesChange={onEdgesChange}
                          onConnect={onConnect}
                          onNodeClick={onNodeClick}
                          nodeTypes={nodeTypes}
                          connectionLineType={ConnectionLineType.SmoothStep}
                          fitView
                          fitViewOptions={{ padding: 0.1, maxZoom: 1.5, minZoom: 0.3 }}
                          className="bg-transparent"
                          proOptions={{ hideAttribution: true }}
                        >
                          <Background 
                            color="#d1d5db" 
                            gap={20} 
                            size={1}
                            variant="dots"
                          />
                          <Controls 
                            className="bg-white/90 backdrop-blur border border-nb-ink/20 rounded-nb shadow-lg" 
                            showInteractive={false}
                          />
                        </ReactFlow>
                      </div>
                    </div>

                    {/* Selected Stage Detail Panel */}
                    {selectedStage && (
                      <div className="bg-white border border-nb-ink/20 rounded-nb p-6 mb-6 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-display font-bold text-lg text-nb-ink flex items-center space-x-2">
                            <span>Stage Details: {selectedStage.stage}</span>
                            {selectedStage.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                            {selectedStage.status === 'in_progress' && <Clock className="w-5 h-5 text-blue-600" />}
                            {selectedStage.status === 'pending' && <Calendar className="w-5 h-5 text-gray-500" />}
                          </h4>
                          <NBButton 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedStage(null)}
                            className="text-nb-ink/60 hover:text-nb-ink"
                          >
                            ✕
                          </NBButton>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="space-y-3">
                              <div>
                                <span className="text-sm font-medium text-nb-ink/70">Date:</span>
                                <span className="ml-2 text-sm text-nb-ink">{selectedStage.date}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-nb-ink/70">Status:</span>
                                <span className="ml-2 text-sm text-nb-ink capitalize">{selectedStage.status.replace('_', ' ')}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-nb-ink/70">Description:</span>
                                <p className="mt-1 text-sm text-nb-ink/80 leading-relaxed">{selectedStage.description}</p>
                              </div>
                              
                              {/* Show submission-specific details if available */}
                              {selectedStage.submissionId && (
                                <>
                                  <div>
                                    <span className="text-sm font-medium text-nb-ink/70">Submission ID:</span>
                                    <span className="ml-2 text-xs font-mono text-nb-ink">{selectedStage.submissionId}</span>
                                  </div>
                                  {selectedStage.trustScore && (
                                    <div>
                                      <span className="text-sm font-medium text-nb-ink/70">Trust Score:</span>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <div className="w-20 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className={`h-2 rounded-full ${
                                              selectedStage.trustScore > 80 ? 'bg-green-500' :
                                              selectedStage.trustScore > 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${selectedStage.trustScore}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-sm font-medium text-nb-ink">{selectedStage.trustScore}%</span>
                                      </div>
                                    </div>
                                  )}
                                  {selectedStage.flags && selectedStage.flags.length > 0 && (
                                    <div>
                                      <span className="text-sm font-medium text-nb-ink/70">Flags:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {selectedStage.flags.map((flag, flagIndex) => (
                                          <span key={flagIndex} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                            {flag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          {selectedStage.images && selectedStage.images.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-nb-ink/70 mb-2 block">Progress Images:</span>
                              <div className="grid grid-cols-2 gap-2">
                                {selectedStage.images.map((image, index) => (
                                  <img
                                    key={index}
                                    src={image}
                                    alt={`${selectedStage.stage} - Image ${index + 1}`}
                                    className="w-full h-24 object-cover rounded border border-nb-ink/20 hover:scale-105 transition-transform cursor-pointer"
                                    onClick={() => window.open(image, '_blank')}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!selectedStage && (
                      <div className="bg-blue-50 border border-blue-200 rounded-nb p-4 mb-6">
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-700">Click on any stage in the timeline above to view detailed information</span>
                        </div>
                      </div>
                    )}

                    {/* Detailed Progress List */}
                    <div className="space-y-4">
                      <h4 className="font-display font-semibold text-md text-nb-ink">Detailed Progress</h4>
                      {project.progress.map((stage, index) => (
                        <div key={index} className="border border-nb-ink/20 rounded-nb p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-nb-ink">{stage.stage}</h5>
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

                {activeTab === 'submissions' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-bold text-lg text-nb-ink">
                        Project Submissions
                      </h3>
                      {submissionsLoading && (
                        <div className="flex items-center space-x-2 text-sm text-nb-ink/70">
                          <div className="animate-spin rounded-full h-4 w-4 border-b border-nb-accent"></div>
                          <span>Loading submissions...</span>
                        </div>
                      )}
                    </div>

                    {submissions.length > 0 ? (
                      <div className="space-y-4">
                        {submissions.map((submission, index) => (
                          <div key={submission.id} className="border border-nb-ink/20 rounded-nb p-6 bg-white">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  submission.status === 'verified' ? 'bg-green-500' :
                                  submission.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                                }`}></div>
                                <h4 className="font-semibold text-nb-ink">Submission #{index + 1}</h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  submission.status === 'verified' ? 'bg-green-100 text-green-800' :
                                  submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                                </span>
                              </div>
                              <div className="text-sm text-nb-ink/70">
                                {submission.submittedAt}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                              <div className="space-y-3">
                                <div>
                                  <span className="text-sm font-medium text-nb-ink/70">Trust Score:</span>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full ${
                                          (submission.trustScore || 0) > 80 ? 'bg-green-500' :
                                          (submission.trustScore || 0) > 60 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${submission.trustScore || 0}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-medium text-nb-ink">{submission.trustScore || 0}%</span>
                                  </div>
                                </div>
                                
                                {submission.flags && submission.flags.length > 0 && (
                                  <div>
                                    <span className="text-sm font-medium text-nb-ink/70">Flags:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {submission.flags.map((flag, flagIndex) => (
                                        <span key={flagIndex} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                          {flag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {submission.autoVerified && (
                                  <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-green-700">Auto-verified</span>
                                  </div>
                                )}
                              </div>

                              {submission.ngoUpload && submission.ngoUpload.length > 0 && (
                                <div>
                                  <span className="text-sm font-medium text-nb-ink/70 mb-2 block">Uploaded Images ({submission.ngoUpload.length}):</span>
                                  <div className="grid grid-cols-3 gap-2">
                                    {submission.ngoUpload.slice(0, 6).map((image, imgIndex) => (
                                      <img
                                        key={imgIndex}
                                        src={image}
                                        alt={`Submission ${index + 1} - Image ${imgIndex + 1}`}
                                        className="w-full h-16 object-cover rounded border border-nb-ink/20 hover:scale-105 transition-transform cursor-pointer"
                                        onClick={() => window.open(image, '_blank')}
                                      />
                                    ))}
                                    {submission.ngoUpload.length > 6 && (
                                      <div className="w-full h-16 bg-gray-100 rounded border border-nb-ink/20 flex items-center justify-center">
                                        <span className="text-xs text-nb-ink/70">+{submission.ngoUpload.length - 6}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {submission.verifiedAt && (
                              <div className="text-sm text-nb-ink/70 border-t border-nb-ink/10 pt-3">
                                <span className="font-medium">Verified on:</span> {submission.verifiedAt}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText size={48} className="text-nb-ink/30 mx-auto mb-4" />
                        <h4 className="font-medium text-nb-ink mb-2">No submissions yet</h4>
                        <p className="text-nb-ink/70">Project submissions will appear here once uploaded by the NGO.</p>
                      </div>
                    )}
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

            {/* Submission Stats */}
            <NBCard>
              <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
                Submission Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-nb-ink/70">Total Submissions</span>
                  <span className="text-sm font-medium text-nb-ink">{submissions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-nb-ink/70">Verified</span>
                  <span className="text-sm font-medium text-green-600">
                    {submissions.filter(s => s.status === 'verified').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-nb-ink/70">Pending</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {submissions.filter(s => s.status === 'pending').length}
                  </span>
                </div>
                {submissions.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-nb-ink/70">Avg Trust Score</span>
                    <span className="text-sm font-medium text-nb-ink">
                      {Math.round(submissions.reduce((acc, s) => acc + (s.trustScore || 0), 0) / submissions.length)}%
                    </span>
                  </div>
                )}
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
