const Submission = require("../models/Submission.model");

// Get all projects with their reports
exports.getProjectsWithReports = async (req, res) => {
    try {
        // Get all unique project IDs from submissions
        const projectIds = await Submission.distinct("projectId");

        // Get reports for each project
        const projectsWithReports = await Promise.all(
            projectIds.map(async (projectId) => {
                const reports = await Submission.find({ projectId })
                    .sort({ createdAt: -1 })
                    .lean();

                return {
                    projectId,
                    reportsCount: reports.length,
                    latestReport: reports[0] || null,
                    reports: reports,
                };
            })
        );

        res.json({
            success: true,
            projects: projectsWithReports,
        });
    } catch (error) {
        console.error("Error fetching projects with reports:", error);
        res.status(500).json({
            error: "Failed to fetch projects with reports",
        });
    }
};

// Get a specific project with its reports
exports.getProjectWithReports = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Validate project ID format (supports both ObjectId and blockchain IDs)
        const isValidProjectId = (id) => {
            // Check if it's a valid ObjectId (24 hex chars)
            if (/^[0-9a-fA-F]{24}$/.test(id)) {
                return true;
            }
            // Check if it's a valid blockchain project ID (numeric string)
            if (/^\d+$/.test(id)) {
                return true;
            }
            return false;
        };

        if (!isValidProjectId(projectId)) {
            return res.status(400).json({
                error: "Invalid project ID format. Expected MongoDB ObjectId or blockchain project ID.",
            });
        }

        const reports = await Submission.find({ projectId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            projectId,
            reportsCount: reports.length,
            reports: reports,
        });
    } catch (error) {
        console.error("Error fetching project with reports:", error);
        res.status(500).json({
            error: "Failed to fetch project with reports",
        });
    }
};
