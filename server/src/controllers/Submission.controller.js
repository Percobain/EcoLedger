const Submission = require("../models/Submission.model");
const exifSvc = require("../services/exif.service");
const hashSvc = require("../services/hashing.service");
const imageSvc = require("../services/image.service");
const cloudflareSvc = require("../services/cloudflare.service"); // Changed from pinataSvc
const trustSvc = require("../services/trust.service");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Add this helper function at the top
const isValidObjectId = (id) => {
    return (
        mongoose.Types.ObjectId.isValid(id) &&
        String(new mongoose.Types.ObjectId(id)) === id
    );
};

exports.createSubmission = async (req, res) => {
    try {
        const { projectId } = req.params;
        const orgId = req.body.orgId || "default-org"; // adapt auth
        const type = req.body.type || "MONTHLY";
        const report = req.body.report ? JSON.parse(req.body.report) : {};

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const mediaArr = [];

        // process each file sequentially (ok for MVP)
        for (const file of req.files) {
            console.log("Processing file:", file.filename);

            // 1) read EXIF
            const exif = await exifSvc.readExif(file.path);

            // 2) compute hashes
            const sha256 = await hashSvc.sha256File(file.path);
            const pHash = await hashSvc.pHashFile(file.path);

            // 3) watermark image
            const watermarkText = `Project: ${projectId} | ${new Date().toISOString()}`;
            const watermarkedPath = file.path + ".watermarked.jpg";
            await imageSvc.watermark(file.path, watermarkedPath, watermarkText);

            // 4) upload to Cloudflare R2
            // Derive human-friendly project folder like "proj-003" from ObjectId
            const projectSuffix = projectId.slice(-3);
            const projectFolder = `proj-${projectSuffix}/`;

            const uniqueFileName = cloudflareSvc.generateUniqueFileName(
                file.originalname,
                projectFolder
            );

            // Ensure uploaded filename matches JPEG output extension
            const jpegUploadName = uniqueFileName.replace(
                path.extname(uniqueFileName),
                ".jpeg"
            );

            const uploadResult = await cloudflareSvc.uploadFileToR2(
                watermarkedPath,
                jpegUploadName,
                {
                    projectId,
                    sha256,
                    pHash,
                    originalName: file.originalname,
                }
            );

            mediaArr.push({
                cloudflareUrl: uploadResult.url,
                cloudflareKey: uploadResult.key,
                sha256,
                pHash,
                exif,
                watermarked: true,
            });

            // cleanup temp files
            fs.unlinkSync(file.path);
            fs.unlinkSync(watermarkedPath);
        }

        // compute centroid if first media has GPS
        const firstExif = mediaArr[0].exif || {};
        let gpsCentroid;
        if (firstExif.GPSLatitude && firstExif.GPSLongitude) {
            gpsCentroid = {
                type: "Point",
                coordinates: [firstExif.GPSLongitude, firstExif.GPSLatitude],
            };
        }

        // compute trust score & flags
        const { trustScore, flags } = await trustSvc.computeTrust(
            { media: mediaArr },
            { projectId, gpsCentroid }
        );

        // create submission
        const submission = new Submission({
            projectId,
            orgId,
            type,
            report,
            media: mediaArr,
            gpsCentroid,
            trustScore,
            autoFlags: flags,
            status: trustScore >= 80 ? "VERIFIED" : "PENDING",
        });

        await submission.save();

        console.log(
            `Submission created: ${submission._id}, trust: ${trustScore}%`
        );
        res.json({
            ok: true,
            submission: submission,
            trustScore,
            flags,
            autoVerified: trustScore >= 80,
        });
    } catch (err) {
        console.error("Error creating submission:", err);
        res.status(500).json({
            error: "Failed to create submission",
        });
    }
};

exports.verifySubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { action } = req.body; // 'VERIFIED' or 'REJECTED'

        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({ error: "Submission not found" });
        }

        submission.status = action === "VERIFIED" ? "VERIFIED" : "REJECTED";
        submission.verifiedAt = new Date();

        await submission.save();

        res.json({ ok: true, submission });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getSubmissionsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Validate ObjectId format
        if (!isValidObjectId(projectId)) {
            return res.status(400).json({
                error: "Invalid project ID format. Expected MongoDB ObjectId.",
            });
        }

        const submissions = await Submission.find({ projectId });

        res.json({
            success: true,
            submissions,
        });
    } catch (error) {
        console.error("Error fetching submissions:", error);
        res.status(500).json({
            error: "Failed to fetch submissions",
        });
    }
};

exports.getPendingSubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({ status: "PENDING" }).sort({
            createdAt: -1,
        });

        res.json({ ok: true, submissions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
