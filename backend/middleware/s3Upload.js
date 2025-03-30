const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');

// Check for required environment variables
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('Missing AWS credentials in environment variables');
}

// Debug logging (redacted for security)
console.log('S3 Middleware - AWS Region:', process.env.AWS_REGION);
console.log('S3 Middleware - AWS Bucket:', process.env.AWS_BUCKET_NAME);
console.log('S3 Middleware - AWS Access Key configured:', !!process.env.AWS_ACCESS_KEY_ID);
console.log('S3 Middleware - AWS Secret Key configured:', !!process.env.AWS_SECRET_ACCESS_KEY);

// Create S3 client with clean configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim()
  },
  forcePathStyle: false  // This should be false for standard S3 URLs
});

// Configure upload with error handling
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldname: file.fieldname });
    },
    key: function (req, file, cb) {
      try {
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
        
        const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${folder}/${Date.now()}-${safeFilename}`;
        console.log('Uploading to S3 path:', filename);
        cb(null, filename);
      } catch (error) {
        console.error('Error generating S3 key:', error);
        cb(error);
      }
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP and GIF are allowed.'));
    }
  }
});

module.exports = upload;