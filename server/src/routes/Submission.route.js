const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "/tmp/uploads" });
const submissionsController = require("../controllers/Submission.controller");

// upload images + submission JSON (multipart)
router.post(
    "/:projectId",
    upload.array("files", 6),
    submissionsController.createSubmission
);

// simple verify endpoint for centralized verifier (Suresh)
router.post("/:submissionId/verify", submissionsController.verifySubmission);

// Get submissions for a project
router.get(
    "/project/:projectId",
    submissionsController.getSubmissionsByProject
);

// Get all pending submissions for review
router.get("/pending", submissionsController.getPendingSubmissions);

// Batch verify multiple submissions with AI
router.post("/batch-verify", submissionsController.batchVerifySubmissions);

module.exports = router;
