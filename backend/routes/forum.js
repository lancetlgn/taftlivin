const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const mongoose = require('mongoose');
const { protect, admin } = require('../middleware/auth');

// this is a placeholder!!!!
router.get('/', (req, res) => {
  res.json({ message: 'Forum endpoint (to be implemented)' });
});

module.exports = router;