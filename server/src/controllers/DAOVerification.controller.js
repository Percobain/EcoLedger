const Submission = require("../models/Submission.model");
const exifSvc = require("../services/exif.service");
const hashSvc = require("../services/hashing.service");
const imageSvc = require("../services/image.service");
const cloudflareSvc = require("../services/cloudflare.service");
const trustSvc = require("../services/trust.service");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Helper function to validate project ID (supports both ObjectId and blockchain IDs)
const isValidProjectId = (id) => {
    // Check if it's a valid ObjectId (24 hex chars)
    if (
        mongoose.Types.ObjectId.isValid(id) &&
        String(new mongoose.Types.ObjectId(id)) === id
    ) {
        return true;
    }
    // Check if it's a valid blockchain project ID (numeric string)
    if (/^\d+$/.test(id)) {
        return true;
    }
    return false;
};

// Create DAO verification submission
exports.createDAOVerification = async (req, res) => {
    try {
        const { projectId, originalReportId } = req.params;
        const { daoMemberId, daoVote, daoReasoning } = req.body;

        // Validate project ID format
        if (!isValidProjectId(projectId)) {
            return res.status(400).json({
                error: "Invalid project ID format. Expected MongoDB ObjectId or blockchain project ID.",
            });
        }

        // Validate required fields
        if (
            !daoMemberId ||
            !daoVote ||
            !["APPROVE", "REJECT"].includes(daoVote)
        ) {
            return res.status(400).json({
                error: "daoMemberId and daoVote (APPROVE/REJECT) are required",
            });
        }

        // Check if original report exists
        const originalReport = await Submission.findById(originalReportId);
        if (!originalReport) {
            return res.status(404).json({
                error: "Original report not found",
            });
        }

        if (!req.files || req.files.length === 0) {
            return res
                .status(400)
                .json({ error: "No verification images uploaded" });
        }

        const mediaArr = [];

        // Process each file sequentially
        for (const file of req.files) {
            console.log("Processing DAO verification file:", file.filename);

            // 1) Read EXIF
            const exif = await exifSvc.readExif(file.path);

            // 2) Compute hashes
            const sha256 = await hashSvc.sha256File(file.path);
            const pHash = await hashSvc.pHashFile(file.path);

            // 3) Watermark image
            const watermarkText = `DAO Verification | Project: ${projectId} | Report: ${originalReportId} | ${new Date().toISOString()}`;
            const watermarkedPath = file.path + ".watermarked.jpg";
            await imageSvc.watermark(file.path, watermarkedPath, watermarkText);

            // 4) Upload to Cloudflare R2
            const projectSuffix = projectId.slice(-3);
            const projectFolder = `dao-verification/proj-${projectSuffix}/`;

            const uniqueFileName = cloudflareSvc.generateUniqueFileName(
                file.originalname,
                projectFolder
            );

            const jpegUploadName = uniqueFileName.replace(
                path.extname(uniqueFileName),
                ".jpeg"
            );

            const uploadResult = await cloudflareSvc.uploadFileToR2(
                watermarkedPath,
                jpegUploadName,
                {
                    projectId,
                    originalReportId,
                    daoMemberId,
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

            console.log(
                `📸 DAO Verification Media Item ${mediaArr.length + 1}:`
            );
            console.log(`   SHA256: ${sha256}`);
            console.log(`   Perceptual Hash: ${pHash}`);
            console.log(`   EXIF Data:`, exif);
            console.log(`   Cloudflare URL: ${uploadResult.url}`);

            mediaArr.push(mediaItem);

            // Cleanup temp files
            fs.unlinkSync(file.path);
            fs.unlinkSync(watermarkedPath);
        }

        // Compute centroid if first media has GPS
        const firstExif = mediaArr[0].exif || {};
        let gpsCentroid;
        if (firstExif.GPSLatitude && firstExif.GPSLongitude) {
            gpsCentroid = {
                type: "Point",
                coordinates: [firstExif.GPSLongitude, firstExif.GPSLatitude],
            };
        }

        // Get context for AI analysis
        const previousSubmissions = await Submission.find({ projectId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        console.log("🔍 DAO Verification Context:");
        console.log(`   Project ID: ${projectId}`);
        console.log(`   Original Report ID: ${originalReportId}`);
        console.log(`   DAO Member ID: ${daoMemberId}`);
        console.log(`   DAO Vote: ${daoVote}`);
        console.log(`   Media Count: ${mediaArr.length}`);
        console.log(
            `   GPS Centroid: ${
                gpsCentroid ? JSON.stringify(gpsCentroid) : "None"
            }`
        );

        // Compute trust score & flags with AI analysis
        console.log(
            "🚀 Starting DAO Verification Trust Computation with AI Analysis..."
        );
        const trustResult = await trustSvc.computeTrustWithContext(
            { media: mediaArr },
            {
                projectId,
                gpsCentroid,
                originalReportId,
                daoMemberId,
                verificationType: "DAO_VERIFICATION",
            },
            previousSubmissions
        );

        const { trustScore, flags, aiAnalysis, finalVerdict } = trustResult;

        console.log("✅ DAO Verification Trust Computation Complete:");
        console.log(`   Final Trust Score: ${trustScore}%`);
        console.log(`   AI Verdict: ${finalVerdict}`);
        console.log(`   AI Analysis:`, aiAnalysis);
        console.log(`   Flags:`, flags);

        // Create DAO verification submission
        const daoVerification = new Submission({
            projectId,
            orgId: daoMemberId, // Use DAO member ID as orgId
            type: "DAO_VERIFICATION",
            report: {
                originalReportId,
                daoMemberId,
                daoVote,
                daoReasoning: daoReasoning || "",
                verificationTimestamp: new Date().toISOString(),
            },
            media: mediaArr,
            gpsCentroid,
            trustScore,
            autoFlags: flags,
            aiAnalysis,
            finalVerdict,
            status: finalVerdict === "AUTHENTIC" ? "VERIFIED" : "PENDING",
            daoVerification: {
                originalReportId,
                daoMemberId,
                verificationType: daoVote,
                daoVote,
                daoReasoning: daoReasoning || "",
            },
        });

        await daoVerification.save();

        console.log(
            `DAO Verification created: ${daoVerification._id}, trust: ${trustScore}%, verdict: ${finalVerdict}`
        );

        res.json({
            ok: true,
            daoVerification: daoVerification,
            trustScore,
            flags,
            aiAnalysis,
            finalVerdict,
            autoVerified: finalVerdict === "AUTHENTIC",
        });
    } catch (err) {
        console.error("Error creating DAO verification:", err);
        res.status(500).json({
            error: "Failed to create DAO verification",
        });
    }
};

// Get DAO verifications for a specific report
exports.getDAOVerificationsForReport = async (req, res) => {
    try {
        const { originalReportId } = req.params;

        const daoVerifications = await Submission.find({
            type: "DAO_VERIFICATION",
            "daoVerification.originalReportId": originalReportId,
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            daoVerifications,
        });
    } catch (error) {
        console.error("Error fetching DAO verifications:", error);
        res.status(500).json({
            error: "Failed to fetch DAO verifications",
        });
    }
};

// Get all DAO verifications for a project
exports.getDAOVerificationsForProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Validate project ID format
        if (!isValidProjectId(projectId)) {
            return res.status(400).json({
                error: "Invalid project ID format. Expected MongoDB ObjectId or blockchain project ID.",
            });
        }

        const daoVerifications = await Submission.find({
            projectId,
            type: "DAO_VERIFICATION",
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            daoVerifications,
        });
    } catch (error) {
        console.error("Error fetching DAO verifications for project:", error);
        res.status(500).json({
            error: "Failed to fetch DAO verifications for project",
        });
    }
};

// Get DAO verification summary for a report
exports.getDAOVerificationSummary = async (req, res) => {
    try {
        const { originalReportId } = req.params;

        const daoVerifications = await Submission.find({
            type: "DAO_VERIFICATION",
            "daoVerification.originalReportId": originalReportId,
        });

        const summary = {
            totalVotes: daoVerifications.length,
            approveVotes: daoVerifications.filter(
                (v) => v.daoVerification.daoVote === "APPROVE"
            ).length,
            rejectVotes: daoVerifications.filter(
                (v) => v.daoVerification.daoVote === "REJECT"
            ).length,
            averageTrustScore:
                daoVerifications.reduce(
                    (sum, v) => sum + (v.trustScore || 0),
                    0
                ) / daoVerifications.length || 0,
            aiVerdicts: {
                authentic: daoVerifications.filter(
                    (v) => v.finalVerdict === "AUTHENTIC"
                ).length,
                suspicious: daoVerifications.filter(
                    (v) => v.finalVerdict === "SUSPICIOUS"
                ).length,
                fake: daoVerifications.filter((v) => v.finalVerdict === "FAKE")
                    .length,
            },
            latestVerifications: daoVerifications.slice(0, 5),
        };

        res.json({
            success: true,
            summary,
        });
    } catch (error) {
        console.error("Error fetching DAO verification summary:", error);
        res.status(500).json({
            error: "Failed to fetch DAO verification summary",
        });
    }
};
