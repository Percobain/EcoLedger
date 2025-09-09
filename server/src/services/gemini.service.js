const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyzes image content using Gemini Vision API for authenticity verification
 * @param {string} imagePath - Path to the image file
 * @param {Object} metadata - Image metadata and context
 * @returns {Promise<{verdict: string, confidence: number, reasoning: string}>}
 */
exports.analyzeImageContent = async (imagePath, metadata) => {
    try {
        console.log("🔍 Starting Gemini Image Analysis");
        console.log("📁 Image Path:", imagePath);
        console.log("📊 Metadata:", JSON.stringify(metadata, null, 2));

        // Read the image file
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString("base64");

        // Get the model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Build the analysis prompt
        const prompt = buildImageAnalysisPrompt(metadata);

        console.log("📝 Gemini Prompt:");
        console.log("-".repeat(50));
        console.log(prompt);
        console.log("-".repeat(50));

        // Analyze the image
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        const content = response.text();

        console.log("🤖 Gemini Response:");
        console.log("-".repeat(50));
        console.log(content);
        console.log("-".repeat(50));

        // Parse the response
        const parsedResult = parseGeminiResponse(content);

        console.log(
            "📋 Parsed Gemini Result:",
            JSON.stringify(parsedResult, null, 2)
        );
        console.log("=".repeat(50));

        return parsedResult;
    } catch (error) {
        console.error("Gemini analysis error:", error);
        // Fallback to basic analysis
        return fallbackImageAnalysis(metadata);
    }
};

/**
 * Builds comprehensive prompt for image analysis
 */
function buildImageAnalysisPrompt(metadata) {
    const { exif, projectContext, trustFlags } = metadata;

    let prompt = `You are an expert digital forensics analyst specializing in image authenticity verification. 
Analyze this image for authenticity and provide a single-word verdict: AUTHENTIC, SUSPICIOUS, or FAKE.

CRITICAL ANALYSIS POINTS:
1. IMAGE CONTENT ANALYSIS:
   - Look for signs of digital manipulation, editing, or tampering
   - Check for inconsistencies in lighting, shadows, and perspective
   - Identify if this appears to be a real environmental photo vs. stock image/artificial
   - Look for signs of AI generation or deepfake technology
   - Check for watermarking or branding that might indicate authenticity

2. ENVIRONMENTAL CONSISTENCY:
   - Does the image show a realistic outdoor environment?
   - Are there natural elements like trees, soil, vegetation that match reforestation projects?
   - Does the lighting and weather conditions appear natural?
   - Are there any signs this is a studio setup or artificial environment?

3. METADATA CONSISTENCY:
   - EXIF Data: ${exif ? JSON.stringify(exif) : "No EXIF data available"}
   - Trust Flags: ${trustFlags ? trustFlags.join(", ") : "None"}
   - Project Context: ${
       projectContext ? JSON.stringify(projectContext) : "Unknown"
   }

4. AUTHENTICITY INDICATORS:
   - Natural environmental conditions
   - Consistent lighting and shadows
   - Realistic plant growth patterns
   - Authentic soil and terrain
   - Natural wear and weathering
   - Proper depth of field and focus

5. MANIPULATION RED FLAGS:
   - Unnatural lighting or shadows
   - Inconsistent image quality
   - Signs of copy-paste or cloning
   - Artificial-looking vegetation
   - Inconsistent perspective or scale
   - Overly perfect or staged appearance

VERDICT GUIDELINES:
- AUTHENTIC: Image appears to be a genuine, unmanipulated photo of a real environment
- SUSPICIOUS: Some inconsistencies or concerns but not definitively fake
- FAKE: Clear evidence of manipulation, artificial generation, or stock photo usage

Provide your analysis in this EXACT format:
VERDICT: [AUTHENTIC/SUSPICIOUS/FAKE]
CONFIDENCE: [0-100]
REASONING: [Detailed explanation of what you observed in the image]`;

    return prompt;
}

/**
 * Parses Gemini response to extract structured data
 */
function parseGeminiResponse(content) {
    const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);

    let verdict = "SUSPICIOUS";
    let confidence = 50;
    let reasoning = "Unable to parse response";

    for (const line of lines) {
        if (line.startsWith("VERDICT:")) {
            const v = line.split(":")[1]?.trim().toUpperCase();
            if (["AUTHENTIC", "SUSPICIOUS", "FAKE"].includes(v)) {
                verdict = v;
            }
        } else if (line.startsWith("CONFIDENCE:")) {
            const c = parseInt(line.split(":")[1]?.trim());
            if (!isNaN(c) && c >= 0 && c <= 100) {
                confidence = c;
            }
        } else if (line.startsWith("REASONING:")) {
            reasoning = line.split(":")[1]?.trim() || "No reasoning provided";
        }
    }

    return { verdict, confidence, reasoning };
}

/**
 * Fallback analysis when Gemini is unavailable
 */
function fallbackImageAnalysis(metadata) {
    const { trustFlags } = metadata;
    let verdict = "SUSPICIOUS";
    let confidence = 60;
    let reasoning = "Gemini analysis unavailable, using fallback assessment";

    if (trustFlags) {
        const criticalFlags = [
            "NO_GPS",
            "GPS_OUTSIDE_POLYGON",
            "PHASH_SIMILAR",
        ];
        const hasCritical = trustFlags.some((flag) =>
            criticalFlags.includes(flag)
        );

        if (hasCritical) {
            verdict = "SUSPICIOUS";
            confidence = 40;
            reasoning =
                "Critical trust flags detected, image analysis unavailable";
        }

        if (
            trustFlags.includes("NO_GPS") &&
            trustFlags.includes("NO_EXIF_TIME")
        ) {
            verdict = "FAKE";
            confidence = 20;
            reasoning =
                "Missing critical metadata and no image analysis available";
        }
    }

    return { verdict, confidence, reasoning };
}

/**
 * Batch analysis for multiple images
 */
exports.analyzeBatchImages = async (imagePaths, metadataArray) => {
    try {
        const results = await Promise.all(
            imagePaths.map(async (imagePath, index) => {
                const metadata = metadataArray[index] || {};
                const analysis = await this.analyzeImageContent(
                    imagePath,
                    metadata
                );
                return {
                    imagePath,
                    index,
                    ...analysis,
                };
            })
        );

        return results;
    } catch (error) {
        console.error("Batch image analysis error:", error);
        throw error;
    }
};
