const OpenAI = require("openai");
const dotenv = require("dotenv");
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyzes image metadata and EXIF data to determine authenticity
 * @param {Object} analysisData - Complete data for analysis
 * @returns {Promise<{verdict: string, confidence: number, reasoning: string}>}
 */
exports.analyzeImageAuthenticity = async (analysisData) => {
    try {
        // Log the complete analysis data being sent to AI
        console.log("🤖 AI Analysis Request Data:");
        console.log("=".repeat(50));
        console.log(
            "📊 Raw Analysis Data:",
            JSON.stringify(analysisData, null, 2)
        );
        console.log("=".repeat(50));

        const prompt = buildAnalysisPrompt(analysisData);

        // Log the formatted prompt being sent to GPT
        console.log("📝 GPT Prompt:");
        console.log("-".repeat(30));
        console.log(prompt);
        console.log("-".repeat(30));

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an expert digital forensics analyst specializing in image authenticity verification. 
                    Your task is to analyze provided metadata and return a single-word verdict: AUTHENTIC, SUSPICIOUS, or FAKE.
                    
                    Guidelines:
                    - AUTHENTIC: Image appears genuine with consistent metadata
                    - SUSPICIOUS: Some inconsistencies but not definitively fake
                    - FAKE: Clear evidence of tampering or manipulation
                    
                    Always provide confidence (0-100) and brief reasoning.`,
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.1,
            max_tokens: 200,
        });

        const content = response.choices[0].message.content;

        // Log the AI response
        console.log("🤖 AI Response:");
        console.log("-".repeat(30));
        console.log(content);
        console.log("-".repeat(30));

        const parsedResult = parseGPTResponse(content);

        // Log the parsed result
        console.log(
            "📋 Parsed AI Result:",
            JSON.stringify(parsedResult, null, 2)
        );
        console.log("=".repeat(50));

        return parsedResult;
    } catch (error) {
        console.error("OpenAI analysis error:", error);
        // Fallback to basic analysis if OpenAI fails
        return fallbackAnalysis(analysisData);
    }
};

/**
 * Builds comprehensive analysis prompt with all available data
 */
function buildAnalysisPrompt(data) {
    const { media, projectContext, previousSubmissions } = data;

    let prompt = `Analyze this image submission for authenticity:\n\n`;

    // Media analysis
    prompt += `IMAGE DATA:\n`;
    media.forEach((item, index) => {
        prompt += `Image ${index + 1}:\n`;
        prompt += `- SHA256: ${item.sha256}\n`;
        prompt += `- Perceptual Hash: ${item.pHash}\n`;
        prompt += `- Watermarked: ${item.watermarked}\n`;

        if (item.exif) {
            prompt += `- EXIF Data:\n`;
            prompt += `  * DateTime: ${
                item.exif.DateTimeOriginal || "Missing"
            }\n`;
            prompt += `  * GPS: ${
                item.exif.GPSLatitude
                    ? `${item.exif.GPSLatitude}, ${item.exif.GPSLongitude}`
                    : "Missing"
            }\n`;
            prompt += `  * Camera: ${item.exif.Make || "Unknown"} ${
                item.exif.Model || "Unknown"
            }\n`;
            prompt += `  * Resolution: ${item.exif.ImageWidth || "Unknown"}x${
                item.exif.ImageHeight || "Unknown"
            }\n`;
        }
        prompt += `\n`;
    });

    // Project context
    if (projectContext) {
        prompt += `PROJECT CONTEXT:\n`;
        prompt += `- Project ID: ${projectContext.projectId}\n`;
        prompt += `- Expected Location: ${
            projectContext.expectedLocation || "Unknown"
        }\n`;
        prompt += `- Project Type: ${projectContext.type || "Unknown"}\n`;
        prompt += `- Submission Type: ${
            projectContext.submissionType || "Unknown"
        }\n`;
        prompt += `\n`;
    }

    // Previous submissions for comparison
    if (previousSubmissions && previousSubmissions.length > 0) {
        prompt += `PREVIOUS SUBMISSIONS (for comparison):\n`;
        previousSubmissions.slice(0, 3).forEach((sub, index) => {
            prompt += `Submission ${index + 1}:\n`;
            prompt += `- Date: ${sub.createdAt}\n`;
            prompt += `- Trust Score: ${sub.trustScore}%\n`;
            prompt += `- Status: ${sub.status}\n`;
            if (sub.media && sub.media[0]) {
                prompt += `- Previous pHash: ${sub.media[0].pHash}\n`;
            }
        });
        prompt += `\n`;
    }

    // Trust flags
    if (data.trustFlags && data.trustFlags.length > 0) {
        prompt += `TRUST FLAGS:\n`;
        data.trustFlags.forEach((flag) => {
            prompt += `- ${flag}\n`;
        });
        prompt += `\n`;
    }

    prompt += `Based on this comprehensive data, provide your analysis in this exact format:
VERDICT: [AUTHENTIC/SUSPICIOUS/FAKE]
CONFIDENCE: [0-100]
REASONING: [Brief explanation]`;

    return prompt;
}

/**
 * Parses GPT response to extract structured data
 */
function parseGPTResponse(content) {
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
 * Fallback analysis when OpenAI is unavailable
 */
function fallbackAnalysis(data) {
    const { trustFlags } = data;
    let verdict = "AUTHENTIC";
    let confidence = 80;
    let reasoning = "Basic analysis completed";

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
            confidence = 60;
            reasoning = "Critical trust flags detected";
        }

        if (
            trustFlags.includes("NO_GPS") &&
            trustFlags.includes("NO_EXIF_TIME")
        ) {
            verdict = "FAKE";
            confidence = 30;
            reasoning = "Missing critical metadata";
        }
    }

    return { verdict, confidence, reasoning };
}

/**
 * Batch analysis for multiple images
 */
exports.analyzeBatchAuthenticity = async (submissions) => {
    try {
        const results = await Promise.all(
            submissions.map(async (submission) => {
                const analysis = await this.analyzeImageAuthenticity(
                    submission
                );
                return {
                    submissionId: submission.id,
                    ...analysis,
                };
            })
        );

        return results;
    } catch (error) {
        console.error("Batch analysis error:", error);
        throw error;
    }
};
