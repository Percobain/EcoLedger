const { exiftool } = require('exiftool-vendored');

exports.readExif = async (filePath) => {
  try {
    const meta = await exiftool.read(filePath);
    return {
      DateTimeOriginal: meta.DateTimeOriginal || meta.CreateDate || null,
      GPSLatitude: meta.GPSLatitude || null,
      GPSLongitude: meta.GPSLongitude || null,
      Make: meta.Make || null,
      Model: meta.Model || null
    };
  } catch(e) {
    console.warn('exif read failed', e.message);
    return {};
  }
};
