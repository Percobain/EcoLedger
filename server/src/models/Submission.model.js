const mongoose = require("mongoose");
const { Schema } = mongoose;

const MediaSchema = new Schema({
    cloudflareUrl: String, // Changed from pinataCid
    cloudflareKey: String, // R2 object key
    sha256: String,
    pHash: String,
    exif: Schema.Types.Mixed,
    watermarked: { type: Boolean, default: false },
});

const SubmissionSchema = new Schema({
    projectId: { type: String, required: true }, // Changed to String to support blockchain project IDs
    orgId: { type: String, required: true }, // Changed to String for consistency
    type: {
        type: String,
        enum: ["BASELINE", "MONTHLY", "QUARTERLY", "DAO_VERIFICATION"],
        default: "MONTHLY",
    },
    report: Schema.Types.Mixed,
    media: [MediaSchema],
    gpsCentroid: {
        type: { type: String, default: "Point" },
        coordinates: [Number],
    },
    trustScore: { type: Number, default: 0 },
    autoFlags: [String],
    aiAnalysis: {
        verdict: { type: String, enum: ["AUTHENTIC", "SUSPICIOUS", "FAKE"] },
        confidence: { type: Number, min: 0, max: 100 },
        reasoning: String,
    },
    finalVerdict: {
        type: String,
        enum: ["AUTHENTIC", "SUSPICIOUS", "FAKE"],
        default: "SUSPICIOUS",
    },
    status: {
        type: String,
        enum: ["PENDING", "VERIFIED", "REJECTED"],
        default: "PENDING",
    },
    // DAO verification specific fields
    daoVerification: {
        originalReportId: { type: String }, // Reference to the original NGO report
        daoMemberId: { type: String }, // DAO member who submitted verification
        verificationType: {
            type: String,
            enum: ["APPROVE", "REJECT"],
            default: "APPROVE",
        },
        daoVote: {
            type: String,
            enum: ["APPROVE", "REJECT"],
            required: function () {
                return this.type === "DAO_VERIFICATION";
            },
        },
        daoReasoning: String, // DAO member's reasoning for their vote
    },
    createdAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
});

module.exports = mongoose.model("Submission", SubmissionSchema);
