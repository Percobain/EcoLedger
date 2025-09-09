const mongoose = require("mongoose");
const { Schema } = mongoose;

const MediaSchema = new Schema({
    cloudflareUrl: String,      // Changed from pinataCid
    cloudflareKey: String,      // R2 object key
    sha256: String,
    pHash: String,
    exif: Schema.Types.Mixed,
    watermarked: { type: Boolean, default: false },
});

const SubmissionSchema = new Schema({
    projectId: { type: Schema.Types.ObjectId, required: true, ref: "Project" },
    orgId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    type: {
        type: String,
        enum: ["BASELINE", "MONTHLY", "QUARTERLY"],
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
    status: {
        type: String,
        enum: ["PENDING", "VERIFIED", "REJECTED"],
        default: "PENDING",
    },
    createdAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
});

module.exports = mongoose.model("Submission", SubmissionSchema);
