require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const s3Upload = require('./middleware/s3Upload');

const app = express();

// Connect to MongoDB (using config file)
connectDB();

// Middleware
app.use(cors({
  origin: [
    'https://taftlivin.onrender.com',
    'https://taftlivin.netlify.app',
    'https://www.taftlivin.onrender.com',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploaded files (for local development)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// API Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    mongoDBConnected: !!mongoose.connection.readyState
  });
});

// API Debug routes
app.get('/api/debug/s3-config', (req, res) => {
  res.json({
    region: process.env.AWS_REGION,
    bucketName: process.env.AWS_BUCKET_NAME,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ? "Configured (first chars: " + 
      process.env.AWS_ACCESS_KEY_ID.substring(0, 3) + "...)" : "Not configured",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? "Configured (length: " + 
      process.env.AWS_SECRET_ACCESS_KEY.length + ")" : "Not configured"
  });
});

app.get('/api/debug/env', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV || 'not set',
    port: process.env.PORT || 8000,
    mongoUri: process.env.MONGODB_URI ? 'configured' : 'not configured',
    jwtSecret: process.env.JWT_SECRET ? 'configured' : 'not configured',
    awsRegion: process.env.AWS_REGION || 'not set',
    awsBucket: process.env.AWS_BUCKET_NAME || 'not set',
    hasAwsKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasAwsSecret: !!process.env.AWS_SECRET_ACCESS_KEY
  });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const condos = await mongoose.connection.db.collection('condos').find({}).limit(1).toArray();
    res.json({ status: 'success', data: condos });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Test S3 upload route
app.post('/api/test-s3-upload', s3Upload.single('testImage'), (req, res) => {
  try {
    console.log('Test upload request received');
    console.log('Request file:', req.file);
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    console.log('S3 upload successful, location:', req.file.location);
    
    res.json({ 
      success: true,
      fileUrl: req.file.location,
      fileDetails: {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        location: req.file.location,
        key: req.file.key,
        bucket: req.file.bucket,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Test S3 upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// API Routes 
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/condos', require('./routes/condos'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/reviews', require('./routes/reviews'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({ 
    error: true, 
    message: err.message || 'An unexpected error occurred',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// Catch-all route for SPA - IMPORTANT: This must be the LAST route
app.get('*', (req, res) => {
  // Don't catch API routes that weren't found
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // Serve the SPA for all other routes
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));