const express = require("express");
const router = express.Router();
const multer = require("multer");
const daoVerificationController = require("../controllers/DAOVerification.controller");

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "/tmp/uploads");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `dao-verification-${uniqueSuffix}-${file.originalname}`);
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"), false);
        }
    },
});

// Create DAO verification submission
router.post(
    "/:projectId/reports/:originalReportId/verify",
    upload.array("images", 6), // Allow up to 6 images
    daoVerificationController.createDAOVerification
);

// Get DAO verifications for a specific report
router.get(
    "/reports/:originalReportId/verifications",
    daoVerificationController.getDAOVerificationsForReport
);

// Get all DAO verifications for a project
router.get(
    "/:projectId/verifications",
    daoVerificationController.getDAOVerificationsForProject
);

// Get DAO verification summary for a report
router.get(
    "/reports/:originalReportId/summary",
    daoVerificationController.getDAOVerificationSummary
);

module.exports = router;
