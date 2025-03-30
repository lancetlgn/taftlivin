require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

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

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    mongoDBConnected: !!mongoose.connection.readyState
  });
});

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/condos', require('./routes/condos'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/api/test-db', async (req, res) => {
  try {
    const condos = await mongoose.connection.db.collection('condos').find({}).limit(1).toArray();
    res.json({ status: 'success', data: condos });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const s3Upload = require('./middleware/s3Upload');

app.post('/api/test-s3-upload', s3Upload.single('testImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.json({ 
      success: true,
      fileUrl: req.file.location,
      fileInfo: req.file
    });
  } catch (error) {
    console.error('Test S3 upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add these debug endpoints
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


// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));