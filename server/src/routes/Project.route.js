const express = require("express");
const router = express.Router();
const projectController = require("../controllers/Project.controller");

// Get all projects with their reports
router.get("/with-reports", projectController.getProjectsWithReports);

// Get a specific project with its reports
router.get("/:projectId/with-reports", projectController.getProjectWithReports);

module.exports = router;
