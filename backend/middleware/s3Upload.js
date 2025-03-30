const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');

// Add console logs to debug AWS config
console.log('S3 Middleware - AWS Region:', process.env.AWS_REGION);
console.log('S3 Middleware - AWS Bucket:', process.env.AWS_BUCKET_NAME);
console.log('S3 Middleware - AWS Key ID exists:', !!process.env.AWS_ACCESS_KEY_ID);
console.log('S3 Middleware - AWS Secret exists:', !!process.env.AWS_SECRET_ACCESS_KEY);

// Configure S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Test S3 connection
console.log('S3 client initialized, testing connection...');

// Configure upload for different file types
const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET_NAME,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, cb) {
    let folder = 'general';
    
    // Determine folder based on field name
    if (file.fieldname === 'mainImage') {
      folder = 'condos/main';
    } else if (file.fieldname === 'galleryImages') {
      folder = 'condos/gallery';
    } else if (file.fieldname === 'profilePicture') {
      folder = 'users/profile';
    } else if (file.fieldname === 'testImage') {
      folder = 'test';
    }
    
    const filename = `${folder}/${Date.now()}-${path.basename(file.originalname)}`;
    console.log('Uploading to S3:', filename);
    cb(null, filename);
  }
});

// Create the multer instance with our storage configuration
const uploadConfig = {
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP and GIF are allowed.'));
    }
  }
};

// Create multer instance
const upload = multer(uploadConfig);

// Export multer instance
module.exports = upload;