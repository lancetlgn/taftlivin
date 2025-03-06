const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const uploadDir = path.join(__dirname, '../public/uploads');
const condoMainDir = path.join(uploadDir, 'condos/main');
const condoGalleryDir = path.join(uploadDir, 'condos/gallery');

// Make sure directories exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(condoMainDir)) {
    fs.mkdirSync(condoMainDir, { recursive: true });
}

if (!fs.existsSync(condoGalleryDir)) {
    fs.mkdirSync(condoGalleryDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Determine directory based on field name
        if (file.fieldname === 'mainImage') {
            cb(null, condoMainDir);
        } else if (file.fieldname === 'galleryImages') {
            cb(null, condoGalleryDir);
        } else {
            cb(null, uploadDir);
        }
    },
    filename: function(req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${fileExt}`);
    }
});

// Create multer upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function(req, file, cb) {
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

module.exports = upload;