// config/uploadFood.js
const path   = require('path');
const multer = require('multer');
const { v4: uuid } = require('uuid');      // unique filenames

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'foods'));
  },
  filename: (req, file, cb) => {
    // e.g. 9b9f23f4-…​.jpg
    const ext = path.extname(file.originalname);
    cb(null, uuid() + ext);
  }
});

const imageFilter = (req, file, cb) => {
  // Accept images only
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false);
  }
  cb(null, true);
};

module.exports = multer({ storage, fileFilter: imageFilter });
