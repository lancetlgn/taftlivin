const multer = require('multer');
const path = require('path');
const fs = require('fs');

// upload directories
const uploadDir = path.join(__dirname, '../public/uploads');
const condoMainDir = path.join(uploadDir, 'condos/main');
const condoGalleryDir = path.join(uploadDir, 'condos/gallery');
const profilePicsDir = path.join(uploadDir, 'users/profile');

// directories if they don't exist
[uploadDir, condoMainDir, condoGalleryDir, profilePicsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Determine directory based on field name
        if (file.fieldname === 'mainImage') {
            cb(null, condoMainDir);
        } else if (file.fieldname === 'galleryImages') {
            cb(null, condoGalleryDir);
        } else if (file.fieldname === 'profilePicture') {
            cb(null, profilePicsDir);
        } else {
            cb(null, uploadDir);
        }
    },
    filename: function(req, file, cb) {
        // Generate unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// set up multer with our configuration
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

module.exports = upload;