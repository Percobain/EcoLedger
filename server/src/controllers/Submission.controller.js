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

            const mediaItem = {
                cloudflareUrl: uploadResult.url,
                cloudflareKey: uploadResult.key,
                sha256,
                pHash,
                exif,
                watermarked: true,
            };

            console.log(`📸 Media Item ${mediaArr.length + 1}:`);
            console.log(`   SHA256: ${sha256}`);
            console.log(`   Perceptual Hash: ${pHash}`);
            console.log(`   EXIF Data:`, exif);
            console.log(`   Cloudflare URL: ${uploadResult.url}`);

            mediaArr.push(mediaItem);

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

        // Get previous submissions for context
        const previousSubmissions = await Submission.find({ projectId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        console.log("📋 Submission Context:");
        console.log(`   Project ID: ${projectId}`);
        console.log(`   Media Count: ${mediaArr.length}`);
        console.log(`   Previous Submissions: ${previousSubmissions.length}`);
        console.log(
            `   GPS Centroid: ${
                gpsCentroid ? JSON.stringify(gpsCentroid) : "None"
            }`
        );

        // compute trust score & flags with AI analysis
        console.log("🚀 Starting Trust Computation with AI Analysis...");
        const trustResult = await trustSvc.computeTrustWithContext(
            { media: mediaArr },
            { projectId, gpsCentroid },
            previousSubmissions
        );

        const { trustScore, flags, aiAnalysis, finalVerdict } = trustResult;

        console.log("✅ Trust Computation Complete:");
        console.log(`   Final Trust Score: ${trustScore}%`);
        console.log(`   AI Verdict: ${finalVerdict}`);
        console.log(`   AI Analysis:`, aiAnalysis);
        console.log(`   Flags:`, flags);

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
            aiAnalysis,
            finalVerdict,
            status: finalVerdict === "AUTHENTIC" ? "VERIFIED" : "PENDING",
        });

        await submission.save();

        console.log(
            `Submission created: ${submission._id}, trust: ${trustScore}%, verdict: ${finalVerdict}`
        );
        res.json({
            ok: true,
            submission: submission,
            trustScore,
            flags,
            aiAnalysis,
            finalVerdict,
            autoVerified: finalVerdict === "AUTHENTIC",
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

exports.batchVerifySubmissions = async (req, res) => {
    try {
        const { submissionIds } = req.body;

        if (!submissionIds || !Array.isArray(submissionIds)) {
            return res.status(400).json({
                error: "submissionIds array is required",
            });
        }

        const submissions = await Submission.find({
            _id: { $in: submissionIds },
            status: "PENDING",
        });

        if (submissions.length === 0) {
            return res.status(404).json({
                error: "No pending submissions found",
            });
        }

        const verificationResults = await trustSvc.batchVerifySubmissions(
            submissions
        );

        // Update submissions with new verification results
        const updatePromises = verificationResults.map(async (result) => {
            const submission = submissions.find(
                (s) => s._id.toString() === result.submissionId
            );
            if (submission) {
                submission.aiAnalysis = {
                    verdict: result.verdict,
                    confidence: result.confidence,
                    reasoning: result.reasoning,
                };
                submission.finalVerdict = result.verdict;
                submission.status =
                    result.verdict === "AUTHENTIC" ? "VERIFIED" : "PENDING";
                await submission.save();
            }
        });

        await Promise.all(updatePromises);

        res.json({
            ok: true,
            message: `Batch verification completed for ${verificationResults.length} submissions`,
            results: verificationResults,
        });
    } catch (err) {
        console.error("Batch verification error:", err);
        res.status(500).json({
            error: "Failed to batch verify submissions",
            details: err.message,
        });
    }
};
