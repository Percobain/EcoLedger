const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const uploadController = require("../controllers/Upload.controller");

// Buffer-based multi-upload
router.post(
    "/images",
    upload.array("files", 10),
    uploadController.uploadImages
);

// Signed URL for direct upload
router.post("/signed-url", upload.none(), uploadController.getUploadUrl);

module.exports = router;
