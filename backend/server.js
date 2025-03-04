const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

// Initialize express
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/condos', require('./routes/condos'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/forum', require('./routes/forum'));

// Catch-all route to return the main index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));