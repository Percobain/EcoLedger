const fs = require("fs");
const { createHash } = require("crypto");
const imghash = require("imghash");

exports.sha256File = async (filePath) => {
    const buf = fs.readFileSync(filePath);
    return createHash("sha256").update(buf).digest("hex");
};

exports.pHashFile = async (filePath) => {
    // imghash returns path to pHash string
    const hash = await imghash.hash(filePath, 16, "hex");
    return hash;
};

exports.hammingDistanceHex = (a, b) => {
    const A = BigInt("0x" + a);
    const B = BigInt("0x" + b);
    let x = A ^ B;
    let dist = 0;
    while (x) {
        dist += Number(x & 1n);
        x >>= 1n;
    }
    return dist;
};
