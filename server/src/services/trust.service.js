const { hammingDistanceHex } = require("./hashing.service");
const booleanPointInPolygon =
    require("@turf/boolean-point-in-polygon").default ||
    require("@turf/boolean-point-in-polygon");
const openaiService = require("./openai.service");
const geminiService = require("./gemini.service");
const fs = require("fs");
const https = require("https");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
const AUTO_APPROVE = parseInt(process.env.AUTO_APPROVE_THRESHOLD || "80", 10);
const HUMAN_REVIEW = parseInt(process.env.HUMAN_REVIEW_THRESHOLD || "60", 10);

/**
 * Downloads an image from URL for analysis
 */
async function downloadImageForAnalysis(imageUrl) {
    return new Promise((resolve, reject) => {
        const tempDir = "/tmp/gemini_analysis";
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const filename = `analysis_${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}.jpg`;
        const filePath = path.join(tempDir, filename);

        const file = fs.createWriteStream(filePath);

        https
            .get(imageUrl, (response) => {
                response.pipe(file);

                file.on("finish", () => {
                    file.close();
                    console.log(
                        `📥 Downloaded image for analysis: ${filePath}`
                    );
                    resolve(filePath);
                });

                file.on("error", (err) => {
                    fs.unlink(filePath, () => {}); // Delete the file on error
                    reject(err);
                });
            })
            .on("error", (err) => {
                reject(err);
            });
    });
}

exports.computeTrust = async (submission, context) => {
    // submission.media = [{ exif, pHash, sha256, ... }]
    let score = 100;
    const flags = [];

    const media = submission.media || [];
    if (media.length === 0) {
        flags.push("NO_MEDIA");
        return { trustScore: 0, flags, aiAnalysis: null };
    }

    // 1) GPS check (first media)
    const exif = media[0].exif || {};
    if (!exif.GPSLatitude || !exif.GPSLongitude) {
        score -= 30;
        flags.push("NO_GPS");
    } else {
        if (context.gpsCentroid && context.gpsCentroid.coordinates) {
            const point = {
                type: "Point",
                coordinates: context.gpsCentroid.coordinates,
            }; // [lon,lat]
            const poly = context.projectGeoJson || context.projectPolygon;
            if (poly) {
                const inside = booleanPointInPolygon(point, poly);
                if (!inside) {
                    score -= 40;
                    flags.push("GPS_OUTSIDE_POLYGON");
                }
            }
        }
    }

    // 2) timestamp check
    if (!exif.DateTimeOriginal) {
        score -= 20;
        flags.push("NO_EXIF_TIME");
    } else {
        // optionally check recency - skipped for MVP
    }

    // 3) pHash similarity to earlier (we won't access DB here; caller can pass previous pHashes)
    if (
        context.previousPHashes &&
        context.previousPHashes.length > 0 &&
        media[0].pHash
    ) {
        for (const prev of context.previousPHashes) {
            const d = hammingDistanceHex(media[0].pHash, prev);
            if (d <= 6) {
                score -= 15;
                flags.push("PHASH_SIMILAR");
                break;
            }
        }
    }

    // 4) resolution check
    // add more penalties if images are too small (caller can add data)

    // 5) AI Analysis with Gemini Vision API
    let aiAnalysis = null;
    try {
        console.log("🔍 Starting Gemini Image Analysis for Trust Computation");
        console.log("📈 Current Trust Score (before AI):", score);
        console.log("🚩 Current Flags:", flags);

        // Use the first image for analysis (primary image)
        const primaryImage = media[0];
        if (primaryImage && primaryImage.cloudflareUrl) {
            // Download the image for analysis
            const imagePath = await downloadImageForAnalysis(
                primaryImage.cloudflareUrl
            );

            const analysisData = {
                exif: primaryImage.exif,
                projectContext: {
                    projectId: context.projectId,
                    expectedLocation: context.expectedLocation,
                    type: context.projectType,
                    submissionType: submission.type,
                },
                trustFlags: flags,
            };

            console.log("📤 Sending image to Gemini for visual analysis...");
            aiAnalysis = await geminiService.analyzeImageContent(
                imagePath,
                analysisData
            );
            console.log("📥 Received Gemini analysis result:", aiAnalysis);

            // Clean up temporary file
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        } else {
            console.log(
                "⚠️ No image available for Gemini analysis, falling back to metadata analysis"
            );
            // Fallback to OpenAI metadata analysis
            const analysisData = {
                media,
                projectContext: {
                    projectId: context.projectId,
                    expectedLocation: context.expectedLocation,
                    type: context.projectType,
                    submissionType: submission.type,
                },
                previousSubmissions: context.previousSubmissions || [],
                trustFlags: flags,
            };
            aiAnalysis = await openaiService.analyzeImageAuthenticity(
                analysisData
            );
        }

        // Adjust score based on AI verdict
        if (aiAnalysis.verdict === "FAKE") {
            score = Math.min(score, 20); // Cap at 20% for fake
            flags.push("AI_VERDICT_FAKE");
        } else if (aiAnalysis.verdict === "SUSPICIOUS") {
            score = Math.min(score, 60); // Cap at 60% for suspicious
            flags.push("AI_VERDICT_SUSPICIOUS");
        } else if (aiAnalysis.verdict === "AUTHENTIC") {
            // Boost score for authentic verdict
            score = Math.min(score + 10, 100);
        }

        // Factor in AI confidence
        const confidenceMultiplier = aiAnalysis.confidence / 100;
        const oldScore = score;
        score = Math.round(
            score * confidenceMultiplier +
                (100 - confidenceMultiplier * 100) * 0.5
        );

        console.log("📊 AI Score Adjustment:");
        console.log(`   Original Score: ${oldScore}`);
        console.log(`   AI Confidence: ${aiAnalysis.confidence}%`);
        console.log(`   Confidence Multiplier: ${confidenceMultiplier}`);
        console.log(`   Final Score: ${score}`);
    } catch (error) {
        console.error("AI analysis failed, using traditional scoring:", error);
        flags.push("AI_ANALYSIS_FAILED");
    }

    // clamp
    if (score < 0) score = 0;
    if (score > 100) score = 100;

    return {
        trustScore: score,
        flags,
        aiAnalysis,
        finalVerdict:
            aiAnalysis?.verdict ||
            (score >= AUTO_APPROVE
                ? "AUTHENTIC"
                : score >= HUMAN_REVIEW
                ? "SUSPICIOUS"
                : "FAKE"),
    };
};

/**
 * Enhanced trust computation with previous submissions context
 */
exports.computeTrustWithContext = async (
    submission,
    context,
    previousSubmissions = []
) => {
    // Extract previous pHashes for similarity checking
    const previousPHashes = previousSubmissions
        .flatMap((sub) => sub.media || [])
        .map((media) => media.pHash)
        .filter(Boolean);

    const enhancedContext = {
        ...context,
        previousPHashes,
        previousSubmissions: previousSubmissions.slice(0, 5), // Last 5 submissions
    };

    return await this.computeTrust(submission, enhancedContext);
};

/**
 * Batch verification for multiple submissions
 */
exports.batchVerifySubmissions = async (submissions) => {
    try {
        const results = await openaiService.analyzeBatchAuthenticity(
            submissions
        );
        return results;
    } catch (error) {
        console.error("Batch verification error:", error);
        throw error;
    }
};
