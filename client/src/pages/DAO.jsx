import { useEffect, useState } from "react";
import {
    Check,
    X,
    Eye,
    Users,
    ThumbsUp,
    ThumbsDown,
    Image,
    Building2,
    MapPin,
    Calendar,
    Upload,
    CheckCircle,
    Camera,
} from "lucide-react";
import { toast } from "sonner";
import { useReportingStore } from "../stores/useReportingStore";
import { useWeb3 } from "../contexts/Web3Context";
import NBCard from "../components/NBCard";
import NBButton from "../components/NBButton";

const DAO = () => {
    const { isConnected, account, web3Service } = useWeb3();
    const {
        pendingReports,
        loading: reportsLoading,
        error: reportsError,
        fetchPendingReports,
        verifyReport,
    } = useReportingStore();

    const [verifiedProjects, setVerifiedProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [daoUploadedImages, setDaoUploadedImages] = useState([]);
    const [projectReports, setProjectReports] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [daoReasoning, setDaoReasoning] = useState("");
    const [daoVote, setDaoVote] = useState("APPROVE");

    // Helper function to convert IPFS URL to gateway URL
    const getImageUrl = (ipfsUrl) => {
        if (!ipfsUrl) return "/mock-images/placeholder-project.jpg";

        if (ipfsUrl.startsWith("ipfs://")) {
            return ipfsUrl.replace(
                "ipfs://",
                "https://gateway.pinata.cloud/ipfs/"
            );
        }

        if (ipfsUrl.startsWith("https://")) {
            return ipfsUrl;
        }

        if (ipfsUrl.startsWith("Qm") || ipfsUrl.startsWith("bafy")) {
            return `https://gateway.pinata.cloud/ipfs/${ipfsUrl}`;
        }

        return "/mock-images/placeholder-project.jpg";
    };

    // Helper function to format budget display
    const formatBudget = (budget) => {
        if (!budget || budget === 0) return "₹0";

        if (budget < 1000) {
            return `₹${budget} L`;
        }

        const lakhs = budget / 100000;
        return `₹${lakhs.toFixed(1)} L`;
    };

    // Fetch verified projects from blockchain (same logic as CarbonMarketplace and Reporting)
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
                            allImages = metadata.files.map((file) =>
                                getImageUrl(file)
                            );

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
                            metadata.attributes
                                ?.find((attr) => attr.trait_type === "Budget")
                                ?.value?.replace(/[^\d]/g, "") ||
                            metadata.project_details?.estimated_budget ||
                            10; // Default 10 lakhs for demo
                    } else {
                        estimatedBudget = 10; // Default when no metadata
                    }

                    return {
                        id: project.id,
                        title:
                            metadata?.name ||
                            project.projectName ||
                            `Project #${project.id}`,
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
                            metadata?.about_project?.project_description ||
                            metadata?.project_details?.description ||
                            "Verified blue carbon restoration project with government approval.",
                        speciesPlanted:
                            metadata?.about_project?.species ||
                            metadata?.project_details?.species_planted ||
                            metadata?.attributes?.find(
                                (attr) => attr.trait_type === "Species"
                            )?.value ||
                            "Native mangrove species",
                        targetPlants:
                            metadata?.about_project?.target_plants ||
                            metadata?.project_details?.target_plants ||
                            metadata?.attributes?.find(
                                (attr) => attr.trait_type === "Target Plants"
                            )?.value ||
                            25000,
                        estimatedBudget: estimatedBudget,
                        photos: allImages || [],
                    };
                })
            );

            // Filter for verified projects (same logic as CarbonMarketplace and Reporting)
            const verifiedOnly = processedProjects.filter(
                (project) =>
                    project.isValidated &&
                    !project.isFraud &&
                    (project.status === "VALIDATED" ||
                        project.status === "FUNDED")
            );

            setVerifiedProjects(verifiedOnly);
        } catch (error) {
            console.error("Error fetching verified projects:", error);
            setError(error.message);
            toast.error("Failed to fetch verified projects: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isConnected) {
            fetchVerifiedProjects();
        }
    }, [isConnected, account]);

    useEffect(() => {
        fetchPendingReports();
    }, [fetchPendingReports]);

    const handleSelectProject = (project) => {
        setSelectedProject(project);
        setSelectedReport(null);
        setDaoUploadedImages([]);
        // Fetch reports for this project
        fetchProjectReports(project.id);
    };

    const handleViewReport = (report) => {
        console.log("Selected report:", report);
        console.log("Report media:", report.media);
        console.log("Extracted images:", getReportImages(report));
        setSelectedReport(report);
        setDaoUploadedImages([]);
        setSelectedFiles([]);
        setDaoReasoning("");
        setDaoVote("APPROVE");
    };

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);

        // Validate file types
        const validTypes = ["image/jpeg", "image/jpg", "image/png"];
        const invalidFiles = files.filter(
            (file) => !validTypes.includes(file.type)
        );

        if (invalidFiles.length > 0) {
            toast.error("Please select only JPEG or PNG images");
            return;
        }

        // Limit to 6 files max
        if (files.length > 6) {
            toast.error("Maximum 6 files allowed");
            return;
        }

        setSelectedFiles(files);
        toast.success(`${files.length} file(s) selected for DAO verification`);
    };

    const handleCameraCapture = () => {
        // Create a file input with camera capture
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.capture = "environment"; // Use back camera
        input.multiple = true;

        input.onchange = (e) => {
            const files = Array.from(e.target.files);

            // Validate file types
            const validTypes = ["image/jpeg", "image/jpg", "image/png"];
            const invalidFiles = files.filter(
                (file) => !validTypes.includes(file.type)
            );

            if (invalidFiles.length > 0) {
                toast.error("Please select only JPEG or PNG images");
                return;
            }

            // Limit to 6 files max
            if (files.length > 6) {
                toast.error("Maximum 6 files allowed");
                return;
            }

            setSelectedFiles(files);
            toast.success(
                `${files.length} photo(s) captured for DAO verification`
            );
        };

        input.click();
    };

    const fetchProjectReports = async (projectId) => {
        try {
            const response = await fetch(
                `https://ecoledger.onrender.com/api/projects/${projectId}/with-reports`
            );
            if (response.ok) {
                const data = await response.json();
                setProjectReports(data.reports || []);
            }
        } catch (error) {
            console.error("Error fetching project reports:", error);
            setProjectReports([]);
        }
    };

    const handleDaoImageUpload = () => {
        // This function is no longer needed as we use the real file upload
        // Keeping for backward compatibility but not used in the new UI
        const mockImages = [
            "/api/placeholder/600/400",
            "/api/placeholder/600/400",
        ];

        setDaoUploadedImages(mockImages);
        toast.success("DAO verification photos uploaded!");
    };

    const handleDAOVerificationSubmit = async () => {
        if (!selectedProject || !selectedReport || selectedFiles.length === 0) {
            toast.error(
                "Please select a project, report, and upload verification images"
            );
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();

            // Add files
            selectedFiles.forEach((file) => {
                formData.append("images", file);
            });

            // Add DAO verification data
            formData.append("daoMemberId", account || "dao-member-1");
            formData.append("daoVote", daoVote);
            formData.append("daoReasoning", daoReasoning);

            const response = await fetch(
                `https://ecoledger.onrender.com/api/dao-verification/${selectedProject.id}/reports/${selectedReport._id}/verify`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "Failed to submit DAO verification"
                );
            }

            const result = await response.json();

            // Enhanced success message with AI analysis
            if (result.autoVerified) {
                toast.success(
                    `✅ DAO Verification submitted! Trust: ${result.trustScore}% | AI Verdict: ${result.finalVerdict}`
                );
            } else {
                const verdictMessage =
                    result.finalVerdict === "SUSPICIOUS"
                        ? "⚠️ DAO Verification submitted but flagged for review"
                        : "📋 DAO Verification submitted successfully! Awaiting final review.";
                toast.success(verdictMessage);
            }

            // Reset form
            setSelectedFiles([]);
            setDaoReasoning("");
            setDaoVote("APPROVE");

            // Reset file input
            const fileInput = document.getElementById("dao-file-upload");
            if (fileInput) fileInput.value = "";

            // Refresh project reports
            fetchProjectReports(selectedProject.id);
        } catch (error) {
            toast.error("Failed to submit DAO verification: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleVerifyReport = async (approve) => {
        if (!selectedReport) return;

        try {
            await verifyReport(selectedReport.id, daoUploadedImages);

            if (approve) {
                toast.success(
                    "Report approved! NGO will be notified of successful verification."
                );
            } else {
                toast.error(
                    "Report rejected. NGO will need to resubmit with corrections."
                );
            }

            setSelectedReport(null);
            setDaoUploadedImages([]);
            fetchPendingReports();
        } catch (error) {
            toast.error("Failed to submit verification");
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Helper function to get image URLs from report (same as Reporting.jsx)
    const getReportImages = (report) => {
        // Handle both API response and mock data formats
        if (report.ngoUpload && Array.isArray(report.ngoUpload)) {
            return report.ngoUpload;
        }
        if (report.media && Array.isArray(report.media)) {
            return report.media
                .filter((m) => m.cloudflareUrl) // Filter out items without cloudflareUrl
                .map((m) => m.cloudflareUrl);
        }
        return [];
    };

    // Helper function to get AI verdict color and icon (same as Reporting.jsx)
    const getVerdictDisplay = (verdict) => {
        switch (verdict) {
            case "AUTHENTIC":
                return {
                    color: "text-green-600",
                    bg: "bg-green-100",
                    icon: CheckCircle,
                    text: "Authentic",
                };
            case "SUSPICIOUS":
                return {
                    color: "text-yellow-600",
                    bg: "bg-yellow-100",
                    icon: Eye,
                    text: "Suspicious",
                };
            case "FAKE":
                return {
                    color: "text-red-600",
                    bg: "bg-red-100",
                    icon: X,
                    text: "Fake",
                };
            default:
                return {
                    color: "text-gray-600",
                    bg: "bg-gray-100",
                    icon: Eye,
                    text: "Unknown",
                };
        }
    };

    // Show connection prompt if not connected
    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <NBCard className="max-w-md w-full text-center">
                    <Building2
                        size={64}
                        className="text-nb-ink/30 mx-auto mb-4"
                    />
                    <h2 className="text-2xl font-display font-bold text-nb-ink mb-2">
                        Connect Wallet
                    </h2>
                    <p className="text-nb-ink/70 mb-6">
                        Please connect your wallet to access DAO verification
                        for verified projects.
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
                        Loading verified projects...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-nb-error mb-4">
                        Error loading projects: {error}
                    </p>
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
                        DAO Verification
                    </h1>
                    <p className="text-lg text-nb-ink/70">
                        Review and verify NGO progress reports through
                        decentralized voting
                    </p>
                    <p className="text-sm text-nb-ink/50 mt-1">
                        Connected: {account?.slice(0, 8)}...{account?.slice(-4)}{" "}
                        | Sepolia Testnet
                    </p>
                </div>

                {/* DAO Info */}
                <NBCard className="mb-8 bg-gradient-to-r from-nb-accent-2/10 to-purple-500/10">
                    <div className="flex items-start gap-4">
                        <Users size={32} className="text-nb-accent-2 mt-1" />
                        <div>
                            <h3 className="text-xl font-display font-bold text-nb-ink mb-2">
                                Decentralized Verification Process
                            </h3>
                            <p className="text-nb-ink/70 mb-4">
                                As a DAO member, you help ensure the integrity
                                of blue carbon projects by verifying NGO
                                progress reports. Your votes are recorded on the
                                blockchain for full transparency.
                            </p>
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Check size={16} className="text-nb-ok" />
                                    <span>Upload verification photos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Eye
                                        size={16}
                                        className="text-nb-accent-2"
                                    />
                                    <span>Compare with NGO submissions</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users
                                        size={16}
                                        className="text-purple-500"
                                    />
                                    <span>
                                        Vote approve/reject collectively
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </NBCard>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Projects List */}
                    <div className="lg:col-span-1">
                        <h2 className="text-xl font-display font-bold text-nb-ink mb-4">
                            Verified Projects ({verifiedProjects.length})
                        </h2>

                        {verifiedProjects.length > 0 ? (
                            <div className="space-y-4">
                                {verifiedProjects.map((project) => (
                                    <NBCard
                                        key={project.id}
                                        className={`cursor-pointer transition-all ${
                                            selectedProject?.id === project.id
                                                ? "ring-2 ring-nb-accent-2"
                                                : "hover:shadow-nb-sm"
                                        }`}
                                        onClick={() =>
                                            handleSelectProject(project)
                                        }
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-nb-ink text-sm line-clamp-1">
                                                {project.title}
                                            </h3>
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                                Verified
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-nb-ink/70 mb-1">
                                            <MapPin size={12} />
                                            <span className="truncate">
                                                {project.location}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-nb-ink/70 mb-1">
                                            <span className="font-medium">
                                                Budget:
                                            </span>
                                            <span>
                                                {formatBudget(
                                                    project.estimatedBudget
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-nb-ink/60">
                                            <span>
                                                NFT: #{project.nftTokenId}
                                            </span>
                                        </div>
                                        {projectReports.length > 0 &&
                                            selectedProject?.id ===
                                                project.id && (
                                                <div className="mt-2 pt-2 border-t border-nb-ink/20">
                                                    <div className="flex items-center gap-2 text-xs text-nb-ink/60">
                                                        <Image size={12} />
                                                        <span>
                                                            {
                                                                projectReports.length
                                                            }{" "}
                                                            reports available
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                    </NBCard>
                                ))}
                            </div>
                        ) : (
                            <NBCard className="text-center">
                                <Check
                                    size={48}
                                    className="text-nb-ok mx-auto mb-4"
                                />
                                <h3 className="font-semibold text-nb-ink mb-2">
                                    No Projects Available
                                </h3>
                                <p className="text-sm text-nb-ink/70">
                                    No verified projects are currently available
                                    for DAO verification.
                                </p>
                            </NBCard>
                        )}
                    </div>

                    {/* Verification Interface */}
                    <div className="lg:col-span-2">
                        {selectedProject ? (
                            <div className="space-y-6">
                                {/* Project Information */}
                                <NBCard>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-display font-bold text-nb-ink">
                                            {selectedProject.title}
                                        </h2>
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                            Verified Project
                                        </span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <span className="text-sm text-nb-ink/60">
                                                Location:
                                            </span>
                                            <p className="font-semibold flex items-center gap-1">
                                                <MapPin size={14} />
                                                {selectedProject.location}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-nb-ink/60">
                                                Budget:
                                            </span>
                                            <p className="font-semibold">
                                                {formatBudget(
                                                    selectedProject.estimatedBudget
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-nb-ink/60">
                                                Target Plants:
                                            </span>
                                            <p className="font-semibold">
                                                {selectedProject.targetPlants?.toLocaleString() ||
                                                    "25,000"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-nb-ink/60">
                                                NFT ID:
                                            </span>
                                            <p className="font-semibold font-mono">
                                                #{selectedProject.nftTokenId}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <span className="text-sm text-nb-ink/60">
                                            Description:
                                        </span>
                                        <p className="text-nb-ink/80 mt-1">
                                            {selectedProject.description}
                                        </p>
                                    </div>
                                </NBCard>

                                {/* Project Reports */}
                                {projectReports.length > 0 ? (
                                    <NBCard>
                                        <h3 className="text-lg font-semibold text-nb-ink mb-4">
                                            Project Reports (
                                            {projectReports.length})
                                        </h3>
                                        <div className="space-y-4">
                                            {projectReports.map((report) => (
                                                <div
                                                    key={report._id}
                                                    className={`p-4 border rounded-nb cursor-pointer transition-all ${
                                                        selectedReport?._id ===
                                                        report._id
                                                            ? "border-nb-accent-2 bg-nb-accent-2/10"
                                                            : "border-nb-ink/20 hover:border-nb-accent-2/50"
                                                    }`}
                                                    onClick={() =>
                                                        handleViewReport(report)
                                                    }
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-semibold text-nb-ink">
                                                            Report #
                                                            {report._id.slice(
                                                                -6
                                                            )}
                                                        </h4>
                                                        <span
                                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                                                report.status ===
                                                                "VERIFIED"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : report.status ===
                                                                      "REJECTED"
                                                                    ? "bg-red-100 text-red-800"
                                                                    : "bg-yellow-100 text-yellow-800"
                                                            }`}
                                                        >
                                                            {report.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-nb-ink/70">
                                                        <Calendar size={12} />
                                                        <span>
                                                            Submitted:{" "}
                                                            {formatDate(
                                                                report.createdAt
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-nb-ink/70 mt-1">
                                                        <Image size={12} />
                                                        <span>
                                                            {report.media
                                                                ?.length ||
                                                                0}{" "}
                                                            photos
                                                        </span>
                                                    </div>
                                                    {report.trustScore && (
                                                        <div className="flex items-center gap-2 text-sm text-nb-ink/70 mt-1">
                                                            <span>
                                                                Trust Score:{" "}
                                                                {
                                                                    report.trustScore
                                                                }
                                                                %
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Show Images Directly in Report List */}
                                                    {report.media &&
                                                        report.media.length >
                                                            0 && (
                                                            <div className="mt-3">
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    {report.media
                                                                        .slice(
                                                                            0,
                                                                            3
                                                                        )
                                                                        .map(
                                                                            (
                                                                                media,
                                                                                imgIndex
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        imgIndex
                                                                                    }
                                                                                    className="aspect-square bg-gray-200 rounded overflow-hidden border border-nb-ink/20"
                                                                                >
                                                                                    <img
                                                                                        src={
                                                                                            media.cloudflareUrl
                                                                                        }
                                                                                        alt={`Report ${
                                                                                            imgIndex +
                                                                                            1
                                                                                        }`}
                                                                                        className="w-full h-full object-cover"
                                                                                        onError={(
                                                                                            e
                                                                                        ) => {
                                                                                            console.error(
                                                                                                "Failed to load image:",
                                                                                                media.cloudflareUrl
                                                                                            );
                                                                                            e.target.style.display =
                                                                                                "none";
                                                                                            e.target.nextSibling.style.display =
                                                                                                "flex";
                                                                                        }}
                                                                                    />
                                                                                    <div
                                                                                        className="w-full h-full flex items-center justify-center bg-gray-100"
                                                                                        style={{
                                                                                            display:
                                                                                                "none",
                                                                                        }}
                                                                                    >
                                                                                        <div className="text-center">
                                                                                            <Image
                                                                                                size={
                                                                                                    16
                                                                                                }
                                                                                                className="text-nb-ink/30 mx-auto mb-1"
                                                                                            />
                                                                                            <p className="text-xs text-nb-ink/60">
                                                                                                Failed
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    {report
                                                                        .media
                                                                        .length >
                                                                        3 && (
                                                                        <div className="aspect-square bg-gray-100 rounded flex items-center justify-center border border-nb-ink/20">
                                                                            <span className="text-xs text-nb-ink/60">
                                                                                +
                                                                                {report
                                                                                    .media
                                                                                    .length -
                                                                                    3}{" "}
                                                                                more
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    {/* Quick DAO Verification Button */}
                                                    <div className="mt-3 pt-2 border-t border-nb-ink/20">
                                                        <NBButton
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleViewReport(
                                                                    report
                                                                );
                                                            }}
                                                            className="w-full"
                                                        >
                                                            <Upload
                                                                size={14}
                                                                className="mr-2"
                                                            />
                                                            Verify This Report
                                                        </NBButton>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </NBCard>
                                ) : (
                                    <NBCard className="text-center">
                                        <Image
                                            size={48}
                                            className="text-nb-ink/30 mx-auto mb-4"
                                        />
                                        <h3 className="font-semibold text-nb-ink mb-2">
                                            No Reports Yet
                                        </h3>
                                        <p className="text-sm text-nb-ink/70">
                                            This project doesn't have any
                                            progress reports yet.
                                        </p>
                                    </NBCard>
                                )}

                                {/* DAO Verification Upload - Always visible when project is selected */}
                                {selectedProject && (
                                    <NBCard>
                                        <h3 className="text-lg font-semibold text-nb-ink mb-4">
                                            DAO Verification
                                        </h3>

                                        {selectedReport ? (
                                            <div className="space-y-4">
                                                <div className="p-4 bg-blue-50 rounded-nb">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle
                                                            size={20}
                                                            className="text-blue-600"
                                                        />
                                                        <span className="font-semibold text-nb-ink">
                                                            Verifying Report #
                                                            {selectedReport._id.slice(
                                                                -6
                                                            )}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-nb-ink/70">
                                                        Upload your verification
                                                        photos to compare with
                                                        the NGO submission
                                                    </p>
                                                </div>

                                                <div className="border-2 border-dashed border-nb-ink rounded-nb p-8 text-center">
                                                    {selectedFiles.length >
                                                    0 ? (
                                                        <div>
                                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                                {selectedFiles.map(
                                                                    (
                                                                        file,
                                                                        index
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                index
                                                                            }
                                                                            className="aspect-square bg-gray-200 rounded-nb overflow-hidden"
                                                                        >
                                                                            <img
                                                                                src={URL.createObjectURL(
                                                                                    file
                                                                                )}
                                                                                alt={`DAO Verification ${
                                                                                    index +
                                                                                    1
                                                                                }`}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-center gap-2 text-nb-ok">
                                                                <CheckCircle
                                                                    size={20}
                                                                />
                                                                <span>
                                                                    {
                                                                        selectedFiles.length
                                                                    }{" "}
                                                                    file(s)
                                                                    selected
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <Upload
                                                                size={48}
                                                                className="text-nb-ink/30 mx-auto mb-4"
                                                            />
                                                            <p className="text-nb-ink/70 mb-4">
                                                                Upload
                                                                verification
                                                                photos from the
                                                                same location to
                                                                compare with NGO
                                                                submissions
                                                            </p>
                                                            <input
                                                                id="dao-file-upload"
                                                                type="file"
                                                                multiple
                                                                accept="image/jpeg,image/jpg,image/png"
                                                                onChange={
                                                                    handleFileSelect
                                                                }
                                                                className="hidden"
                                                            />
                                                            <div className="flex gap-3 justify-center">
                                                                <NBButton
                                                                    variant="secondary"
                                                                    onClick={() =>
                                                                        document
                                                                            .getElementById(
                                                                                "dao-file-upload"
                                                                            )
                                                                            .click()
                                                                    }
                                                                >
                                                                    <Upload
                                                                        size={
                                                                            16
                                                                        }
                                                                        className="mr-2"
                                                                    />
                                                                    Choose Files
                                                                </NBButton>
                                                                <NBButton
                                                                    variant="secondary"
                                                                    onClick={
                                                                        handleCameraCapture
                                                                    }
                                                                    className="bg-nb-accent-2 text-white hover:bg-nb-accent-2/90"
                                                                >
                                                                    <Camera
                                                                        size={
                                                                            16
                                                                        }
                                                                        className="mr-2"
                                                                    />
                                                                    Take Photos
                                                                </NBButton>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {selectedFiles.length > 0 && (
                                                    <div className="space-y-4">
                                                        {/* Vote Selection */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-nb-ink mb-2">
                                                                Your Vote
                                                            </label>
                                                            <div className="grid md:grid-cols-2 gap-4">
                                                                <div
                                                                    className={`p-4 border rounded-nb cursor-pointer transition-all ${
                                                                        daoVote ===
                                                                        "APPROVE"
                                                                            ? "border-nb-ok bg-nb-ok/10"
                                                                            : "border-nb-ink/20 hover:border-nb-ok/50"
                                                                    }`}
                                                                    onClick={() =>
                                                                        setDaoVote(
                                                                            "APPROVE"
                                                                        )
                                                                    }
                                                                >
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <ThumbsUp
                                                                            size={
                                                                                20
                                                                            }
                                                                            className="text-nb-ok"
                                                                        />
                                                                        <span className="font-semibold text-nb-ink">
                                                                            Approve
                                                                            Report
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-nb-ink/70">
                                                                        The NGO
                                                                        photos
                                                                        match
                                                                        current
                                                                        site
                                                                        conditions
                                                                        and show
                                                                        genuine
                                                                        progress.
                                                                    </p>
                                                                </div>

                                                                <div
                                                                    className={`p-4 border rounded-nb cursor-pointer transition-all ${
                                                                        daoVote ===
                                                                        "REJECT"
                                                                            ? "border-nb-error bg-nb-error/10"
                                                                            : "border-nb-ink/20 hover:border-nb-error/50"
                                                                    }`}
                                                                    onClick={() =>
                                                                        setDaoVote(
                                                                            "REJECT"
                                                                        )
                                                                    }
                                                                >
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <ThumbsDown
                                                                            size={
                                                                                20
                                                                            }
                                                                            className="text-nb-error"
                                                                        />
                                                                        <span className="font-semibold text-nb-ink">
                                                                            Reject
                                                                            Report
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-nb-ink/70">
                                                                        The
                                                                        photos
                                                                        don't
                                                                        match
                                                                        site
                                                                        conditions
                                                                        or show
                                                                        insufficient
                                                                        progress.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Reasoning */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-nb-ink mb-2">
                                                                Reasoning
                                                                (Optional)
                                                            </label>
                                                            <textarea
                                                                value={
                                                                    daoReasoning
                                                                }
                                                                onChange={(e) =>
                                                                    setDaoReasoning(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="Explain your vote decision..."
                                                                className="w-full p-3 border border-nb-ink/20 rounded-nb resize-none"
                                                                rows={3}
                                                            />
                                                        </div>

                                                        {/* Submit Button */}
                                                        <NBButton
                                                            variant="primary"
                                                            onClick={
                                                                handleDAOVerificationSubmit
                                                            }
                                                            disabled={uploading}
                                                            className="w-full"
                                                        >
                                                            {uploading
                                                                ? "Submitting DAO Verification..."
                                                                : "Submit DAO Verification"}
                                                        </NBButton>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center p-6">
                                                <Eye
                                                    size={48}
                                                    className="text-nb-ink/30 mx-auto mb-4"
                                                />
                                                <h4 className="font-semibold text-nb-ink mb-2">
                                                    Select a Report to Verify
                                                </h4>
                                                <p className="text-sm text-nb-ink/70">
                                                    Choose a report from the
                                                    list above to begin DAO
                                                    verification
                                                </p>
                                            </div>
                                        )}
                                    </NBCard>
                                )}
                            </div>
                        ) : selectedReport ? (
                            <div className="space-y-6">
                                {/* Report Details */}
                                <NBCard>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-display font-bold text-nb-ink">
                                            Verify Report #
                                            {selectedReport._id.slice(-6)}
                                        </h2>
                                        <span className="text-sm text-nb-ink/60">
                                            Submitted:{" "}
                                            {formatDate(
                                                selectedReport.createdAt
                                            )}
                                        </span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <span className="text-sm text-nb-ink/60">
                                                Project ID:
                                            </span>
                                            <p className="font-semibold">
                                                {selectedReport.projectId}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-nb-ink/60">
                                                Trust Score:
                                            </span>
                                            <p className="font-semibold flex items-center gap-1">
                                                <Check
                                                    size={16}
                                                    className="text-nb-ok"
                                                />
                                                {selectedReport.trustScore || 0}
                                                %
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-nb-ink/60">
                                                Status:
                                            </span>
                                            <p className="font-semibold">
                                                {selectedReport.status}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-nb-ink/60">
                                                AI Verdict:
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {selectedReport.finalVerdict ? (
                                                    (() => {
                                                        const verdictDisplay =
                                                            getVerdictDisplay(
                                                                selectedReport.finalVerdict
                                                            );
                                                        const IconComponent =
                                                            verdictDisplay.icon;
                                                        return (
                                                            <span
                                                                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${verdictDisplay.bg} ${verdictDisplay.color}`}
                                                            >
                                                                <IconComponent
                                                                    size={12}
                                                                />
                                                                {
                                                                    verdictDisplay.text
                                                                }
                                                            </span>
                                                        );
                                                    })()
                                                ) : (
                                                    <span className="text-sm text-nb-ink/60">
                                                        PENDING
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Debug Info */}
                                    <div className="mb-4 p-3 bg-yellow-50 rounded-nb border border-yellow-200">
                                        <h4 className="text-sm font-medium text-nb-ink mb-2">
                                            Debug Info:
                                        </h4>
                                        <div className="text-xs text-nb-ink/70 space-y-1">
                                            <div>
                                                Media array length:{" "}
                                                {selectedReport.media?.length ||
                                                    0}
                                            </div>
                                            <div>
                                                Extracted images:{" "}
                                                {
                                                    getReportImages(
                                                        selectedReport
                                                    ).length
                                                }
                                            </div>
                                            <div>
                                                First media item:{" "}
                                                {JSON.stringify(
                                                    selectedReport.media?.[0] ||
                                                        "No media"
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Report Images Preview */}
                                    {getReportImages(selectedReport).length >
                                        0 && (
                                        <div className="mb-4">
                                            <span className="text-sm text-nb-ink/60 mb-2 block">
                                                NGO Submitted Images:
                                            </span>
                                            <div className="grid grid-cols-4 gap-2">
                                                {getReportImages(selectedReport)
                                                    .slice(0, 4)
                                                    .map((image, index) => (
                                                        <div
                                                            key={index}
                                                            className="aspect-square bg-gray-200 rounded overflow-hidden border border-nb-ink/20"
                                                        >
                                                            <img
                                                                src={image}
                                                                alt={`Report ${
                                                                    index + 1
                                                                }`}
                                                                className="w-full h-full object-cover"
                                                                onError={(
                                                                    e
                                                                ) => {
                                                                    console.error(
                                                                        "Failed to load preview image:",
                                                                        image
                                                                    );
                                                                    e.target.style.display =
                                                                        "none";
                                                                    e.target.nextSibling.style.display =
                                                                        "flex";
                                                                }}
                                                            />
                                                            <div
                                                                className="w-full h-full flex items-center justify-center bg-gray-100"
                                                                style={{
                                                                    display:
                                                                        "none",
                                                                }}
                                                            >
                                                                <div className="text-center">
                                                                    <Image
                                                                        size={
                                                                            16
                                                                        }
                                                                        className="text-nb-ink/30 mx-auto mb-1"
                                                                    />
                                                                    <p className="text-xs text-nb-ink/60">
                                                                        Failed
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                {getReportImages(selectedReport)
                                                    .length > 4 && (
                                                    <div className="aspect-square bg-gray-100 rounded flex items-center justify-center border border-nb-ink/20">
                                                        <span className="text-xs text-nb-ink/60">
                                                            +
                                                            {getReportImages(
                                                                selectedReport
                                                            ).length - 4}{" "}
                                                            more
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Analysis Details */}
                                    {selectedReport.aiAnalysis && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-nb">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle
                                                    size={16}
                                                    className="text-blue-600"
                                                />
                                                <span className="text-sm font-medium text-nb-ink">
                                                    AI Analysis Details
                                                </span>
                                            </div>
                                            {selectedReport.aiAnalysis
                                                .confidence && (
                                                <div className="text-sm text-nb-ink/70 mb-2">
                                                    <span className="font-medium">
                                                        Confidence:{" "}
                                                    </span>
                                                    {
                                                        selectedReport
                                                            .aiAnalysis
                                                            .confidence
                                                    }
                                                    %
                                                </div>
                                            )}
                                            {selectedReport.aiAnalysis
                                                .reasoning && (
                                                <div className="text-sm text-nb-ink/70">
                                                    <span className="font-medium">
                                                        Analysis:{" "}
                                                    </span>
                                                    {
                                                        selectedReport
                                                            .aiAnalysis
                                                            .reasoning
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </NBCard>

                                {/* Photo Comparison */}
                                <NBCard>
                                    <h3 className="text-lg font-semibold text-nb-ink mb-4">
                                        Photo Comparison
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* NGO Photos */}
                                        <div>
                                            <h4 className="font-medium text-nb-ink mb-3 flex items-center gap-2">
                                                <span>
                                                    NGO Submitted Photos
                                                </span>
                                                <span className="px-2 py-1 rounded text-xs bg-nb-accent text-nb-ink">
                                                    {
                                                        getReportImages(
                                                            selectedReport
                                                        ).length
                                                    }{" "}
                                                    photos
                                                </span>
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {getReportImages(selectedReport)
                                                    .length > 0 ? (
                                                    getReportImages(
                                                        selectedReport
                                                    ).map((image, index) => (
                                                        <div
                                                            key={index}
                                                            className="aspect-square bg-gray-200 rounded-nb overflow-hidden border border-nb-ink"
                                                        >
                                                            <img
                                                                src={image}
                                                                alt={`NGO Photo ${
                                                                    index + 1
                                                                }`}
                                                                className="w-full h-full object-cover"
                                                                onError={(
                                                                    e
                                                                ) => {
                                                                    console.error(
                                                                        "Failed to load image:",
                                                                        image
                                                                    );
                                                                    e.target.style.display =
                                                                        "none";
                                                                    e.target.nextSibling.style.display =
                                                                        "flex";
                                                                }}
                                                            />
                                                            <div
                                                                className="w-full h-full flex items-center justify-center bg-gray-100"
                                                                style={{
                                                                    display:
                                                                        "none",
                                                                }}
                                                            >
                                                                <div className="text-center">
                                                                    <Image
                                                                        size={
                                                                            24
                                                                        }
                                                                        className="text-nb-ink/30 mx-auto mb-1"
                                                                    />
                                                                    <p className="text-xs text-nb-ink/60">
                                                                        Failed
                                                                        to load
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-2 aspect-square bg-gray-100 rounded-nb flex items-center justify-center border border-nb-ink/20">
                                                        <div className="text-center">
                                                            <Image
                                                                size={32}
                                                                className="text-nb-ink/30 mx-auto mb-2"
                                                            />
                                                            <p className="text-sm text-nb-ink/60">
                                                                No photos
                                                                available
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* DAO Photos */}
                                        <div>
                                            <h4 className="font-medium text-nb-ink mb-3 flex items-center gap-2">
                                                <span>
                                                    DAO Verification Photos
                                                </span>
                                                {daoUploadedImages.length >
                                                    0 && (
                                                    <span className="px-2 py-1 rounded text-xs bg-nb-accent-2 text-white">
                                                        {
                                                            daoUploadedImages.length
                                                        }{" "}
                                                        photos
                                                    </span>
                                                )}
                                            </h4>

                                            {daoUploadedImages.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {daoUploadedImages.map(
                                                        (photo, index) => (
                                                            <div
                                                                key={index}
                                                                className="aspect-square bg-gray-200 rounded-nb overflow-hidden border border-nb-ink"
                                                            >
                                                                <img
                                                                    src={photo}
                                                                    alt={`DAO Photo ${
                                                                        index +
                                                                        1
                                                                    }`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="border-2 border-dashed border-nb-ink rounded-nb p-6 text-center">
                                                    <Image
                                                        size={32}
                                                        className="text-nb-ink/30 mx-auto mb-3"
                                                    />
                                                    <p className="text-sm text-nb-ink/70 mb-3">
                                                        Upload your verification
                                                        photos from the same
                                                        location
                                                    </p>
                                                    <NBButton
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={
                                                            handleDaoImageUpload
                                                        }
                                                    >
                                                        Upload Photos
                                                    </NBButton>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </NBCard>

                                {/* Voting Stats */}
                                <NBCard className="bg-nb-accent-2/10">
                                    <h3 className="text-lg font-semibold text-nb-ink mb-4">
                                        Current Voting Status
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <div className="text-2xl font-bold text-nb-ok">
                                                8
                                            </div>
                                            <div className="text-sm text-nb-ink/60">
                                                Approve Votes
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-nb-error">
                                                2
                                            </div>
                                            <div className="text-sm text-nb-ink/60">
                                                Reject Votes
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-nb-ink">
                                                12
                                            </div>
                                            <div className="text-sm text-nb-ink/60">
                                                Threshold
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-center text-sm text-nb-ink/70 mt-4">
                                        4 more votes needed to reach decision
                                        threshold
                                    </p>
                                </NBCard>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-96">
                                <div className="text-center">
                                    <Eye
                                        size={64}
                                        className="text-nb-ink/30 mx-auto mb-4"
                                    />
                                    <h3 className="text-xl font-display font-bold text-nb-ink mb-2">
                                        Select a Project
                                    </h3>
                                    <p className="text-nb-ink/70">
                                        Choose a verified project from the left
                                        to view its reports and begin DAO
                                        verification.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* DAO Guidelines */}
                <NBCard className="mt-8 bg-purple-500/10">
                    <h3 className="text-lg font-semibold text-nb-ink mb-4">
                        DAO Verification Guidelines
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-nb-ink mb-2">
                                Verification Process
                            </h4>
                            <ul className="text-sm text-nb-ink/70 space-y-1">
                                <li>• Visit the project site if possible</li>
                                <li>• Upload photos from the same location</li>
                                <li>
                                    • Compare NGO photos with current conditions
                                </li>
                                <li>
                                    • Vote based on actual progress observed
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-nb-ink mb-2">
                                Voting Guidelines
                            </h4>
                            <ul className="text-sm text-nb-ink/70 space-y-1">
                                <li>
                                    • Approve if photos show genuine progress
                                </li>
                                <li>
                                    • Reject if photos seem outdated or fake
                                </li>
                                <li>
                                    • 12 votes needed to reach decision
                                    threshold
                                </li>
                                <li>• All votes are recorded on blockchain</li>
                            </ul>
                        </div>
                    </div>
                </NBCard>
            </div>
        </div>
    );
};

export default DAO;
