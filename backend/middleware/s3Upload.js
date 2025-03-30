const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');

// Add debug logging for AWS configuration
console.log('S3 Middleware Initializing');
console.log('AWS Region:', process.env.AWS_REGION);
console.log('AWS Bucket:', process.env.AWS_BUCKET_NAME);

// Create S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Configure multer with S3 storage
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldname: file.fieldname });
    },
    key: function (req, file, cb) {
      let folder = 'general';
      
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
      cb(null, filename);
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