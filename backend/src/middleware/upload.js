const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'submissions');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    // ignore, may not be writable in some test environments
  }
}

let upload;

try {
  // Try to load multer; if it's not installed (e.g., lightweight test runs),
  // provide no-op middleware so routes that import this file won't crash.
  // eslint-disable-next-line global-require
  const multer = require('multer');

  // Configure storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
      cb(null, uniqueName);
    },
  });

  // Optional file validation
  const fileFilter = (req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.zip', '.txt', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Unsupported file type!'));
    }
    cb(null, true);
  };

  // Configure Multer
  upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  });
} catch (err) {
  // Fallback: provide no-op middleware
  upload = {
    single: () => (req, res, next) => next(),
    array: () => (req, res, next) => next(),
    any: () => (req, res, next) => next(),
  };
}

// ✅ Export helpers for use in routes
module.exports = {
  single: (field) => upload.single(field),
  array: (field, maxCount = 5) => upload.array(field, maxCount),
  any: () => upload.any(),
};
