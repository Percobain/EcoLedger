const impactMetricsService = require('../services/impactMetrics.service');

/**
 * Generate environmental impact metrics for a project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.generateImpactMetrics = async (req, res) => {
    try {
        const { projectData } = req.body;

        if (!projectData) {
            return res.status(400).json({
                success: false,
                error: 'Project data is required'
            });
        }

        console.log('🌱 Generating impact metrics for project:', projectData.name || 'Unknown');

        const metrics = await impactMetricsService.generateImpactMetrics(projectData);

        res.json({
            success: true,
            metrics: metrics,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating impact metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate impact metrics',
            details: error.message
        });
    }
};

/**
 * Get impact metrics for multiple projects (batch processing)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.generateBatchImpactMetrics = async (req, res) => {
    try {
        const { projects } = req.body;

        if (!projects || !Array.isArray(projects)) {
            return res.status(400).json({
                success: false,
                error: 'Projects array is required'
            });
        }

        console.log(`🌱 Generating impact metrics for ${projects.length} projects`);

        const results = await Promise.all(
            projects.map(async (project) => {
                try {
                    const metrics = await impactMetricsService.generateImpactMetrics(project);
                    return {
                        projectId: project.id || project.name,
                        success: true,
                        metrics: metrics
                    };
                } catch (error) {
                    console.error(`Error processing project ${project.id || project.name}:`, error);
                    return {
                        projectId: project.id || project.name,
                        success: false,
                        error: error.message,
                        metrics: null
                    };
                }
            })
        );

        res.json({
            success: true,
            results: results,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating batch impact metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate batch impact metrics',
            details: error.message
        });
    }
};
