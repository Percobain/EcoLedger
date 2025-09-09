const { S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const cloudflareSvc = require("../services/cloudflare.service");

// Memory upload of multiple files
exports.uploadImages = async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }

        const bucketName = process.env.CLOUDFLARE_BUCKET_NAME;
        if (!bucketName) {
            return res
                .status(500)
                .json({ message: "Cloudflare bucket not configured" });
        }

        const uploadedFiles = await Promise.all(
            files.map(async (file) => {
                const key = `uploads/${Date.now()}-${file.originalname}`;
                await cloudflareSvc.uploadBufferToR2(
                    file.buffer,
                    key,
                    file.mimetype
                );
                return {
                    url: cloudflareSvc.getPublicUrl(key),
                    fileName: file.originalname,
                };
            })
        );

        res.json({ files: uploadedFiles });
    } catch (error) {
        console.error("Error uploading files:", error);
        res.status(500).json({
            message: "Failed to upload files",
            error: error.message,
        });
    }
};

// Direct upload (signed URL)
exports.getUploadUrl = async (req, res) => {
    try {
        const { fileName, fileType } = req.body;

        if (!fileName || !fileType) {
            return res
                .status(400)
                .json({ message: "fileName and fileType are required" });
        }

        if (!process.env.CLOUDFLARE_BUCKET_NAME) {
            return res
                .status(500)
                .json({ message: "Cloudflare bucket not configured" });
        }

        const key = `uploads/${Date.now()}-${fileName}`;

        const s3Client = new S3Client({
            region: "auto",
            endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
                secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
            },
        });

        const command = new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 300,
        });
        const publicUrl = cloudflareSvc.getPublicUrl(key);

        res.json({ uploadUrl, publicUrl });
    } catch (error) {
        console.error("Error generating upload URL:", error);
        res.status(500).json({
            message: "Failed to generate upload URL",
            error: error.message,
        });
    }
};
