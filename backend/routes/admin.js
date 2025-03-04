const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// Admin middleware - checks if user is admin
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.userType === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as admin' });
  }
};

// Apply authentication middleware to all routes
router.use(protect);
router.use(adminMiddleware);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    // Create search filter if provided
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get users with pagination
    const users = await User.find(filter)
      .select('-password')
      .limit(limit)
      .skip(skip)
      .sort({ dateJoined: -1 });
    
    const total = await User.countDocuments(filter);
    
    res.json({
      users,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user type if provided
      if (req.body.userType) {
        user.userType = req.body.userType;
      }
      
      // Add this section to handle password updates
      if (req.body.password) {
        user.password = req.body.password;
      }
      
      await user.save();
      
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        userType: user.userType
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    await User.deleteOne({ _id: user._id });
    
    res.json({ message: 'User removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get admin dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    
    res.json({
      userCount,
      condoCount: 0,  // You can update this when you have a Condo model
      reviewCount: 0  // You can update this when you have a Review model
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user (admin only)
router.post('/users', async (req, res) => {
    try {
      const { username, email, password, userType } = req.body;
      
      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
      }
      
      // Check if user already exists
      const userExists = await User.findOne({ 
        $or: [
          { email },
          { username }
        ]
      });
      
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Create new user
      const user = new User({
        username,
        email,
        password,
        userType: userType || 'user'
      });
      
      await user.save();
      
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        userType: user.userType
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

module.exports = router;