const express = require('express');
const router = express.Router();
const impactMetricsController = require('../controllers/ImpactMetrics.controller');

// Generate impact metrics for a single project
router.post('/generate', impactMetricsController.generateImpactMetrics);

// Generate impact metrics for multiple projects
router.post('/generate-batch', impactMetricsController.generateBatchImpactMetrics);

module.exports = router;
