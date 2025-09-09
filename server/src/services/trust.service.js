const { hammingDistanceHex } = require("./hashing.service");
const booleanPointInPolygon =
    require("@turf/boolean-point-in-polygon").default ||
    require("@turf/boolean-point-in-polygon");
const dotenv = require("dotenv");
dotenv.config();
const AUTO_APPROVE = parseInt(process.env.AUTO_APPROVE_THRESHOLD || "80", 10);
const HUMAN_REVIEW = parseInt(process.env.HUMAN_REVIEW_THRESHOLD || "60", 10);

exports.computeTrust = async (submission, context) => {
    // submission.media = [{ exif, pHash, sha256, ... }]
    let score = 100;
    const flags = [];

    const media = submission.media || [];
    if (media.length === 0) {
        flags.push("NO_MEDIA");
        return { trustScore: 0, flags };
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

    // clamp
    if (score < 0) score = 0;
    if (score > 100) score = 100;

    return { trustScore: score, flags };
};
