import { useEffect, useState } from "react";
import {
    Upload,
    MapPin,
    Calendar,
    CheckCircle,
    Clock,
    Image,
    AlertCircle,
    Brain,
    Shield,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useReportingStore } from "../stores/useReportingStore";
import NBCard from "../components/NBCard";
import NBButton from "../components/NBButton";

const Reporting = () => {
    const {
        reportableProjects,
        reports,
        loading,
        error,
        fetchReportableProjects,
        submitReport,
        fetchReports,
    } = useReportingStore();

    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchReportableProjects();
    }, [fetchReportableProjects]);

    const handleSelectProject = (projectId) => {
        const project = reportableProjects.find((p) => p.id === projectId);
        setSelectedProject(project);
        setSelectedFiles([]); // Clear files when switching projects
        if (project) {
            fetchReports(projectId);
        }
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
        toast.success(`${files.length} file(s) selected`);
    };

    const handleSubmitReport = async () => {
        if (!selectedProject || selectedFiles.length === 0) {
            toast.error("Please select a project and upload images");
            return;
        }

        setUploading(true);

        try {
            const result = await submitReport({
                projectId: selectedProject.id,
                files: selectedFiles,
                reportData: {
                    description: `Progress report for ${selectedProject.title}`,
                    timestamp: new Date().toISOString(),
                },
            });

            // Enhanced success message with AI analysis
            if (result.autoVerified) {
                toast.success(
                    `✅ Report auto-verified! Trust: ${result.trustScore}% | AI Verdict: ${result.finalVerdict}`
                );
            } else {
                const verdictMessage =
                    result.finalVerdict === "SUSPICIOUS"
                        ? "⚠️ Report submitted but flagged for review"
                        : "📋 Report submitted successfully! Awaiting manual verification.";
                toast.success(verdictMessage);
            }

            setSelectedFiles([]);

            // Reset file input
            const fileInput = document.getElementById("file-upload");
            if (fileInput) fileInput.value = "";

            // Refresh data
            fetchReportableProjects();
            fetchReports(selectedProject.id);
        } catch (error) {
            toast.error("Failed to submit report: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Helper function to get image URLs from report
    const getReportImages = (report) => {
        // Handle both API response and mock data formats
        if (report.ngoUpload && Array.isArray(report.ngoUpload)) {
            return report.ngoUpload;
        }
        if (report.media && Array.isArray(report.media)) {
            return report.media.map((m) => m.cloudflareUrl);
        }
        return [];
    };

    // Helper function to get AI verdict color and icon
    const getVerdictDisplay = (verdict) => {
        switch (verdict) {
            case "AUTHENTIC":
                return {
                    color: "text-green-600",
                    bg: "bg-green-100",
                    icon: Shield,
                    text: "Authentic",
                };
            case "SUSPICIOUS":
                return {
                    color: "text-yellow-600",
                    bg: "bg-yellow-100",
                    icon: AlertTriangle,
                    text: "Suspicious",
                };
            case "FAKE":
                return {
                    color: "text-red-600",
                    bg: "bg-red-100",
                    icon: AlertCircle,
                    text: "Fake",
                };
            default:
                return {
                    color: "text-gray-600",
                    bg: "bg-gray-100",
                    icon: Clock,
                    text: "Unknown",
                };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-nb-accent mx-auto mb-4"></div>
                    <p className="text-lg text-nb-ink/70">
                        Loading reportable projects...
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
                    <NBButton onClick={() => fetchReportableProjects()}>
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
                        Project Reporting
                    </h1>
                    <p className="text-lg text-nb-ink/70">
                        Upload geotagged progress photos for your funded
                        projects
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Project Selection */}
                    <div className="lg:col-span-1">
                        <h2 className="text-xl font-display font-bold text-nb-ink mb-4">
                            Select Project ({reportableProjects.length})
                        </h2>

                        {reportableProjects.length > 0 ? (
                            <div className="space-y-4">
                                {reportableProjects.map((project) => (
                                    <NBCard
                                        key={project.id}
                                        className={`cursor-pointer transition-all ${
                                            selectedProject?.id === project.id
                                                ? "ring-2 ring-nb-accent"
                                                : "hover:shadow-nb-sm"
                                        }`}
                                        onClick={() =>
                                            handleSelectProject(project.id)
                                        }
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-nb-ink line-clamp-1">
                                                {project.title}
                                            </h3>
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${
                                                    project.status === "funded"
                                                        ? "bg-nb-accent-2 text-white"
                                                        : "bg-purple-500 text-white"
                                                }`}
                                            >
                                                {project.status === "funded"
                                                    ? "Funded"
                                                    : "In Progress"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-nb-ink/70">
                                            <MapPin size={14} />
                                            <span>{project.location}</span>
                                        </div>
                                        {project.fundedAt && (
                                            <div className="flex items-center gap-2 text-sm text-nb-ink/70 mt-2">
                                                <Calendar size={14} />
                                                <span>
                                                    Funded:{" "}
                                                    {formatDate(
                                                        project.fundedAt
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </NBCard>
                                ))}
                            </div>
                        ) : (
                            <NBCard className="text-center">
                                <Image
                                    size={48}
                                    className="text-nb-ink/30 mx-auto mb-4"
                                />
                                <h3 className="font-semibold text-nb-ink mb-2">
                                    No Projects Available
                                </h3>
                                <p className="text-sm text-nb-ink/70">
                                    You don't have any funded projects that need
                                    reporting yet.
                                </p>
                            </NBCard>
                        )}
                    </div>

                    {/* Upload & Reporting */}
                    <div className="lg:col-span-2">
                        {selectedProject ? (
                            <div className="space-y-6">
                                {/* Project Info */}
                                <NBCard>
                                    <h2 className="text-xl font-display font-bold text-nb-ink mb-4">
                                        Upload Progress Report
                                    </h2>
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <span className="text-sm text-nb-ink/60">
                                                Project:
                                            </span>
                                            <p className="font-semibold">
                                                {selectedProject.title}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-nb-ink/60">
                                                Target Plants:
                                            </span>
                                            <p className="font-semibold">
                                                {selectedProject.targetPlants?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <span className="text-sm text-nb-ink/60">
                                            Description:
                                        </span>
                                        <p className="text-nb-ink/80 mt-1">
                                            {selectedProject.description}
                                        </p>
                                    </div>
                                </NBCard>

                                {/* File Upload */}
                                <NBCard>
                                    <h3 className="text-lg font-semibold text-nb-ink mb-4">
                                        Upload Geotagged Photos
                                    </h3>

                                    <div className="border-2 border-dashed border-nb-ink rounded-nb p-8 text-center mb-6">
                                        {selectedFiles.length > 0 ? (
                                            <div>
                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    {selectedFiles.map(
                                                        (file, index) => (
                                                            <div
                                                                key={index}
                                                                className="aspect-square bg-gray-200 rounded-nb overflow-hidden"
                                                            >
                                                                <img
                                                                    src={URL.createObjectURL(
                                                                        file
                                                                    )}
                                                                    alt={`Selected ${
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
                                                    <CheckCircle size={20} />
                                                    <span>
                                                        {selectedFiles.length}{" "}
                                                        file(s) selected
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
                                                    Upload photos with GPS
                                                    coordinates showing project
                                                    progress
                                                </p>
                                                <input
                                                    id="file-upload"
                                                    type="file"
                                                    multiple
                                                    accept="image/jpeg,image/jpg,image/png"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />
                                                <NBButton
                                                    variant="secondary"
                                                    onClick={() =>
                                                        document
                                                            .getElementById(
                                                                "file-upload"
                                                            )
                                                            .click()
                                                    }
                                                >
                                                    Choose Files
                                                </NBButton>
                                            </div>
                                        )}
                                    </div>

                                    {selectedFiles.length > 0 && (
                                        <div className="space-y-4">
                                            <NBCard className="bg-blue-50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertCircle
                                                        size={20}
                                                        className="text-blue-600"
                                                    />
                                                    <span className="font-semibold text-nb-ink">
                                                        Ready for Upload
                                                    </span>
                                                </div>
                                                <p className="text-sm text-nb-ink/70">
                                                    Files will be processed for
                                                    EXIF data, GPS coordinates,
                                                    and AI-powered authenticity
                                                    verification.
                                                </p>
                                            </NBCard>

                                            <NBButton
                                                variant="primary"
                                                onClick={handleSubmitReport}
                                                disabled={uploading}
                                                className="w-full"
                                            >
                                                {uploading
                                                    ? "Uploading & Processing..."
                                                    : "Submit Progress Report"}
                                            </NBButton>
                                        </div>
                                    )}
                                </NBCard>

                                {/* Previous Reports */}
                                {reports.length > 0 && (
                                    <NBCard>
                                        <h3 className="text-lg font-semibold text-nb-ink mb-4">
                                            Previous Reports
                                        </h3>
                                        <div className="space-y-4">
                                            {reports.map((report) => {
                                                const images =
                                                    getReportImages(report);

                                                return (
                                                    <div
                                                        key={report.id}
                                                        className="border border-nb-ink/20 rounded-nb p-4"
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar
                                                                    size={16}
                                                                    className="text-nb-ink/60"
                                                                />
                                                                <span className="text-sm">
                                                                    Submitted:{" "}
                                                                    {formatDate(
                                                                        report.submittedAt ||
                                                                            report.createdAt
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {report.trustScore && (
                                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                                        Trust:{" "}
                                                                        {
                                                                            report.trustScore
                                                                        }
                                                                        %
                                                                    </span>
                                                                )}

                                                                {/* AI Verdict Display */}
                                                                {report.finalVerdict &&
                                                                    (() => {
                                                                        const verdictDisplay =
                                                                            getVerdictDisplay(
                                                                                report.finalVerdict
                                                                            );
                                                                        const IconComponent =
                                                                            verdictDisplay.icon;
                                                                        return (
                                                                            <span
                                                                                className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${verdictDisplay.bg} ${verdictDisplay.color}`}
                                                                            >
                                                                                <Brain
                                                                                    size={
                                                                                        12
                                                                                    }
                                                                                />
                                                                                <IconComponent
                                                                                    size={
                                                                                        12
                                                                                    }
                                                                                />
                                                                                {
                                                                                    verdictDisplay.text
                                                                                }
                                                                            </span>
                                                                        );
                                                                    })()}

                                                                {/* AI Confidence */}
                                                                {report
                                                                    .aiAnalysis
                                                                    ?.confidence && (
                                                                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                                                        AI:{" "}
                                                                        {
                                                                            report
                                                                                .aiAnalysis
                                                                                .confidence
                                                                        }
                                                                        %
                                                                    </span>
                                                                )}

                                                                <span
                                                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                                                        report.status ===
                                                                            "verified" ||
                                                                        report.status ===
                                                                            "VERIFIED"
                                                                            ? "bg-nb-ok text-white"
                                                                            : report.status ===
                                                                                  "pending" ||
                                                                              report.status ===
                                                                                  "PENDING"
                                                                            ? "bg-nb-warn text-white"
                                                                            : "bg-nb-error text-white"
                                                                    }`}
                                                                >
                                                                    {report.status ===
                                                                        "verified" ||
                                                                    report.status ===
                                                                        "VERIFIED"
                                                                        ? "Verified"
                                                                        : report.status ===
                                                                              "pending" ||
                                                                          report.status ===
                                                                              "PENDING"
                                                                        ? "Pending Review"
                                                                        : "Rejected"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {images.length > 0 && (
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {images
                                                                    .slice(0, 3)
                                                                    .map(
                                                                        (
                                                                            image,
                                                                            index
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    index
                                                                                }
                                                                                className="aspect-square bg-gray-200 rounded overflow-hidden"
                                                                            >
                                                                                <img
                                                                                    src={
                                                                                        image
                                                                                    }
                                                                                    alt={`Report ${
                                                                                        index +
                                                                                        1
                                                                                    }`}
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            </div>
                                                                        )
                                                                    )}
                                                            </div>
                                                        )}

                                                        {/* {report.flags &&
                                                            report.flags
                                                                .length > 0 && (
                                                                <div className="mt-2">
                                                                    <p className="text-xs text-orange-600">
                                                                        Flags:{" "}
                                                                        {report.flags.join(
                                                                            ", "
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            )} */}

                                                        {/* AI Analysis Reasoning */}
                                                        {/* {report.aiAnalysis
                                                            ?.reasoning && (
                                                            <div className="mt-2 p-2 bg-gray-50 rounded">
                                                                <div className="flex items-center gap-1 mb-1">
                                                                    <Brain
                                                                        size={
                                                                            12
                                                                        }
                                                                        className="text-blue-600"
                                                                    />
                                                                    <span className="text-xs font-medium text-gray-700">
                                                                        AI
                                                                        Analysis:
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-600">
                                                                    {
                                                                        report
                                                                            .aiAnalysis
                                                                            .reasoning
                                                                    }
                                                                </p>
                                                            </div>
                                                        )} */}

                                                        {/* {report.autoFlags &&
                                                            report.autoFlags
                                                                .length > 0 && (
                                                                <div className="mt-2">
                                                                    <p className="text-xs text-orange-600">
                                                                        Flags:{" "}
                                                                        {report.autoFlags.join(
                                                                            ", "
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            )} */}

                                                        {(report.status ===
                                                            "verified" ||
                                                            report.status ===
                                                                "VERIFIED") &&
                                                            report.verifiedAt && (
                                                                <p className="text-sm text-nb-ok mt-2">
                                                                    ✓ Verified
                                                                    on{" "}
                                                                    {formatDate(
                                                                        report.verifiedAt
                                                                    )}
                                                                </p>
                                                            )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </NBCard>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-96">
                                <div className="text-center">
                                    <Image
                                        size={64}
                                        className="text-nb-ink/30 mx-auto mb-4"
                                    />
                                    <h3 className="text-xl font-display font-bold text-nb-ink mb-2">
                                        Select a Project
                                    </h3>
                                    <p className="text-nb-ink/70">
                                        Choose a funded project from the left to
                                        upload progress reports.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Guidelines */}
                <NBCard className="mt-8 bg-nb-accent/10">
                    <h3 className="text-lg font-semibold text-nb-ink mb-4">
                        Reporting Guidelines
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-nb-ink mb-2">
                                Photo Requirements
                            </h4>
                            <ul className="text-sm text-nb-ink/70 space-y-1">
                                <li>
                                    • Photos must be taken at the project
                                    location
                                </li>
                                <li>
                                    • GPS coordinates will be automatically
                                    verified
                                </li>
                                <li>
                                    • Upload clear, high-resolution images
                                    (JPEG/PNG)
                                </li>
                                <li>• Maximum 6 files per submission</li>
                                <li>
                                    • Show progress of plantation activities
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-nb-ink mb-2">
                                AI-Powered Verification
                            </h4>
                            <ul className="text-sm text-nb-ink/70 space-y-1">
                                <li>
                                    • AI analyzes EXIF data, GPS coordinates,
                                    and image metadata
                                </li>
                                <li>
                                    • Single-word verdicts: AUTHENTIC,
                                    SUSPICIOUS, or FAKE
                                </li>
                                <li>
                                    • Authentic reports are auto-verified
                                    instantly
                                </li>
                                <li>
                                    • Suspicious reports require manual review
                                </li>
                                <li>
                                    • Watermarks and hashes ensure image
                                    integrity
                                </li>
                            </ul>
                        </div>
                    </div>
                </NBCard>
            </div>
        </div>
    );
};

export default Reporting;
