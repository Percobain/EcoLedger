import { mockReports } from "./mockData";
import { projectsService } from "./projectsService";

const API_BASE_URL = `${
    import.meta?.env?.VITE_API_BASE_URL || "http://localhost:3000"
}/api`;

let reports = [...mockReports]; // Keep as fallback

export const reportingService = {
    submitReport: async ({ projectId, files, reportData = {} }) => {
        try {
            // Validate MongoDB ObjectId format on frontend
            if (!/^[0-9a-fA-F]{24}$/.test(projectId)) {
                throw new Error("Invalid project ID format");
            }

            const formData = new FormData();

            // Add files to FormData
            if (files && files.length > 0) {
                files.forEach((file, index) => {
                    formData.append("files", file);
                });
            }

            // Add metadata
            formData.append("orgId", "66e5f1234567890123456101"); // Use valid ObjectId
            formData.append("type", "MONTHLY");
            formData.append("report", JSON.stringify(reportData));

            const response = await fetch(
                `${API_BASE_URL}/submissions/${projectId}`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || `HTTP error! status: ${response.status}`
                );
            }

            const result = await response.json();
            return {
                id: result.submission._id,
                projectId,
                ngoUpload: result.submission.media.map((m) => m.cloudflareUrl),
                status: result.submission.status.toLowerCase(),
                submittedAt: result.submission.createdAt.split("T")[0],
                trustScore: result.trustScore,
                flags: result.flags,
                autoFlags: result.flags, // For backward compatibility
                aiAnalysis: result.aiAnalysis,
                finalVerdict: result.finalVerdict,
                autoVerified: result.autoVerified,
            };
        } catch (error) {
            console.error("Error submitting report:", error);

            // Fallback to mock creation for development
            const mockReport = {
                id: `66e5f1234567890123456${Date.now().toString().slice(-3)}`,
                projectId,
                ngoUpload: files
                    ? files.map((file, index) => URL.createObjectURL(file))
                    : [],
                status: "pending",
                submittedAt: new Date().toISOString().split("T")[0],
                trustScore: Math.floor(Math.random() * 40) + 60,
                flags: [],
                autoVerified: false,
            };

            reports.unshift(mockReport);
            return mockReport;
        }
    },

    getReports: async (projectId) => {
        try {
            // Validate MongoDB ObjectId format
            if (!/^[0-9a-fA-F]{24}$/.test(projectId)) {
                console.warn("Invalid project ID format, using mock data");
                return reports.filter((r) => r.projectId === projectId);
            }

            const response = await fetch(
                `${API_BASE_URL}/submissions/project/${projectId}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || `HTTP error! status: ${response.status}`
                );
            }

            const result = await response.json();

            return result.submissions.map((submission) => ({
                id: submission._id,
                projectId: submission.projectId,
                ngoUpload: submission.media.map((m) => m.cloudflareUrl),
                status: submission.status.toLowerCase(),
                submittedAt: submission.createdAt.split("T")[0],
                verifiedAt: submission.verifiedAt
                    ? submission.verifiedAt.split("T")[0]
                    : null,
                trustScore: submission.trustScore,
                flags: submission.autoFlags,
                autoFlags: submission.autoFlags, // For backward compatibility
                aiAnalysis: submission.aiAnalysis,
                finalVerdict: submission.finalVerdict,
            }));
        } catch (error) {
            console.error("Error fetching reports:", error);
            // Fallback to mock data
            return reports.filter((r) => r.projectId === projectId);
        }
    },

    listPendingReports: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/submissions/pending`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || `HTTP error! status: ${response.status}`
                );
            }

            const result = await response.json();

            return result.submissions.map((submission) => ({
                id: submission._id,
                projectId: submission.projectId,
                ngoUpload: submission.media.map((m) => m.cloudflareUrl),
                status: submission.status.toLowerCase(),
                submittedAt: submission.createdAt.split("T")[0],
                trustScore: submission.trustScore,
                flags: submission.autoFlags,
                autoFlags: submission.autoFlags, // For backward compatibility
                aiAnalysis: submission.aiAnalysis,
                finalVerdict: submission.finalVerdict,
            }));
        } catch (error) {
            console.error("Error fetching pending reports:", error);
            // Fallback to mock data
            return reports.filter(
                (r) => r.status === "PENDING" || r.status === "pending"
            );
        }
    },

    verifyReport: async ({ reportId, action = "VERIFIED" }) => {
        try {
            // Validate MongoDB ObjectId format
            if (!/^[0-9a-fA-F]{24}$/.test(reportId)) {
                throw new Error("Invalid report ID format");
            }

            const response = await fetch(
                `${API_BASE_URL}/submissions/${reportId}/verify`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ action }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || `HTTP error! status: ${response.status}`
                );
            }

            const result = await response.json();

            return {
                id: result.submission._id,
                projectId: result.submission.projectId,
                status: result.submission.status.toLowerCase(),
                verifiedAt: result.submission.verifiedAt.split("T")[0],
            };
        } catch (error) {
            console.error("Error verifying report:", error);

            // Fallback to mock update
            const reportIndex = reports.findIndex((r) => r.id === reportId);
            if (reportIndex !== -1) {
                reports[reportIndex] = {
                    ...reports[reportIndex],
                    status: action.toLowerCase(),
                    verifiedAt: new Date().toISOString().split("T")[0],
                };
                return reports[reportIndex];
            }

            throw error;
        }
    },

    // Keep existing mock methods as fallback
    getReportableProjects: () => {
        return projectsService
            .listAll({ status: "funded" })
            .concat(projectsService.listAll({ status: "reporting" }));
    },
};

export default reportingService;
