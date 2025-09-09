const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

exports.watermark = async (imagePath, outputPath, watermarkText) => {
    try {
        // Prepare base image and get metadata for sizing
        const image = sharp(imagePath);
        const metadata = await image.metadata();

        const imageWidth = metadata.width || 1000;
        const imageHeight = metadata.height || 1000;

        // Compute font size relative to image width (approx 3%)
        const fontSize = Math.max(12, Math.floor(imageWidth * 0.03));
        const padding = Math.max(10, Math.floor(imageWidth * 0.02));

        // SVG overlay for crisp, scalable text watermark with subtle background
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${imageWidth}" height="${imageHeight}" viewBox="0 0 ${imageWidth} ${imageHeight}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .wm-text { font: ${fontSize}px sans-serif; fill: rgba(255,255,255,0.9); }
  </style>
  <rect x="${imageWidth - padding * 2}" y="${
            imageHeight - padding * 2
        }" width="${padding * 2}" height="${padding * 2}" fill="transparent" />
  <text x="${imageWidth - padding}" y="${
            imageHeight - padding
        }" text-anchor="end" class="wm-text" paint-order="stroke" stroke="rgba(0,0,0,0.35)" stroke-width="2">${watermarkText}</text>
</svg>`;

        const overlayBuffer = Buffer.from(svg);

        await image
            .composite([
                {
                    input: overlayBuffer,
                    gravity: "southeast",
                    blend: "over",
                },
            ])
            .jpeg({ quality: 90 })
            .toFile(outputPath);

        return outputPath;
    } catch (error) {
        console.error("Watermark error:", error);
        throw error;
    }
};

// simple ELA generator (optional)
exports.generateELA = async (origPath, elaOutPath) => {
    // quick simple recompress and diff approach (MVP)
    const tmp = origPath + ".re.jpg";
    await sharp(origPath).jpeg({ quality: 90 }).toFile(tmp);

    const orig = await sharp(origPath)
        .raw()
        .toBuffer({ resolveWithObject: true });
    const comp = await sharp(tmp).raw().toBuffer({ resolveWithObject: true });

    // if different shape - skip
    if (
        orig.info.width !== comp.info.width ||
        orig.info.height !== comp.info.height
    ) {
        fs.unlinkSync(tmp);
        return null;
    }

    const out = Buffer.alloc(orig.data.length);
    for (let i = 0; i < orig.data.length; i++) {
        out[i] = Math.min(255, Math.abs(orig.data[i] - comp.data[i]) * 4);
    }

    await sharp(out, {
        raw: {
            width: orig.info.width,
            height: orig.info.height,
            channels: orig.info.channels,
        },
    }).toFile(elaOutPath);

    fs.unlinkSync(tmp);
    return elaOutPath;
};
