require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Initialize express
const app = express();

// Connect to MongoDB (using config file)
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/condos', require('./routes/condos'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/condos', require('./routes/condos'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// Catch-all route to serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));