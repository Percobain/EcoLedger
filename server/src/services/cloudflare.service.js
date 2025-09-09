const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    },
});

const getPublicBase = () => {
    // Prefer explicit public base if provided (e.g., https://pub-xxxx.r2.dev or https://bucket.r2.dev)
    if (process.env.CLOUDFLARE_PUBLIC_URL)
        return process.env.CLOUDFLARE_PUBLIC_URL;
    if (process.env.CLOUDFLARE_R2_PUBLIC_BASE)
        return process.env.CLOUDFLARE_R2_PUBLIC_BASE;
    // Fallback to cloudflarestorage endpoint if nothing else is configured
    return `https://${process.env.CLOUDFLARE_BUCKET_NAME}.${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
};

exports.getPublicUrl = (key) => {
    const publicBase = getPublicBase();
    return `${publicBase}/${key}`;
};

exports.uploadBufferToR2 = async (
    buffer,
    key,
    contentType = "application/octet-stream",
    meta = {}
) => {
    try {
        const command = new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            Metadata: meta,
        });

        const result = await s3Client.send(command);
        const publicBase = getPublicBase();
        return {
            url: `${publicBase}/${key}`,
            key,
            size: buffer.length,
            timestamp: new Date().toISOString(),
            etag: result.ETag,
        };
    } catch (error) {
        console.error("Cloudflare R2 buffer upload error:", error);
        throw error;
    }
};

exports.uploadFileToR2 = async (filePath, fileName, meta = {}) => {
    try {
        const fileContent = fs.readFileSync(filePath);
        const fileExtension = path.extname(fileName).toLowerCase();

        // Determine content type
        let contentType = "application/octet-stream";
        if ([".jpg", ".jpeg"].includes(fileExtension)) {
            contentType = "image/jpeg";
        } else if (fileExtension === ".png") {
            contentType = "image/png";
        } else if (fileExtension === ".gif") {
            contentType = "image/gif";
        } else if (fileExtension === ".webp") {
            contentType = "image/webp";
        }

        const command = new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
            Key: fileName,
            Body: fileContent,
            ContentType: contentType,
            Metadata: meta,
        });

        const result = await s3Client.send(command);

        const publicBase = getPublicBase();
        return {
            url: `${publicBase}/${fileName}`,
            key: fileName,
            size: fileContent.length,
            timestamp: new Date().toISOString(),
            etag: result.ETag,
        };
    } catch (error) {
        console.error("Cloudflare R2 upload error:", error);
        throw error;
    }
};

exports.uploadJSONToR2 = async (jsonData, fileName, meta = {}) => {
    try {
        const jsonString = JSON.stringify(jsonData, null, 2);

        const command = new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
            Key: fileName,
            Body: jsonString,
            ContentType: "application/json",
            Metadata: meta,
        });

        const result = await s3Client.send(command);

        const publicBase = getPublicBase();
        return {
            url: `${publicBase}/${fileName}`,
            key: fileName,
            size: jsonString.length,
            timestamp: new Date().toISOString(),
            etag: result.ETag,
        };
    } catch (error) {
        console.error("Cloudflare R2 JSON upload error:", error);
        throw error;
    }
};

exports.generateUniqueFileName = (originalName, prefix = "") => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);

    return `${prefix}${timestamp}-${random}-${baseName}${extension}`;
};
