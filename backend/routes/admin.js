const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Condo = require('../models/Condo');
const upload = require('../middleware/upload');
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
    const condoCount = await Condo.countDocuments(); // Add this line
    
    res.json({
      userCount,
      condoCount,  // Now returns real count
      reviewCount: 0  // update this for Review model
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

// Get all condos (admin view)
router.get('/condos', async (req, res) => {
  try {
    // Get all condos with most recent first
    const condos = await Condo.find().sort({ createdAt: -1 });
    
    res.json({
      condos
    });
  } catch (error) {
    console.error('Error fetching condos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single condo
router.get('/condos/:id', async (req, res) => {
  try {
    const condo = await Condo.findById(req.params.id);
    
    if (!condo) {
      return res.status(404).json({ message: 'Condo not found' });
    }
    
    res.json({
      condo
    });
  } catch (error) {
    console.error('Error fetching condo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new condo
router.post('/condos', async (req, res) => {
  try {
    const { name, address, description, image, gallery, amenities, distance, contactInfo } = req.body;
    
    // Validate required fields
    if (!name || !address || !description) {
      return res.status(400).json({ message: 'Please provide name, address and description' });
    }
    
    // Create new condo
    const newCondo = new Condo({
      name,
      address,
      description,
      createdBy: req.user._id,
      distance: distance || 150, // Default distance
      contactInfo: contactInfo || {}
    });
    
    // Handle main image
    if (image) {
      newCondo.image = image;
    }
    
    // Handle gallery images
    if (gallery && Array.isArray(gallery)) {
      // Get default gallery images
      const defaultGallery = [
        '../images/default-gallery-1.jpg',
        '../images/default-gallery-2.jpg',
        '../images/default-gallery-3.jpg',
        '../images/default-gallery-4.jpg'
      ];
      
      // Take up to 4 images from the provided gallery
      const userGallery = gallery.slice(0, 4);
      
      // Fill remaining slots with default images if needed
      while (userGallery.length < 4) {
        userGallery.push(defaultGallery[userGallery.length]);
      }
      
      newCondo.gallery = userGallery;
    }
    
    // Add amenities if provided
    if (amenities && Array.isArray(amenities)) {
      newCondo.amenities = amenities;
    }
    
    // Save to database
    const savedCondo = await newCondo.save();
    
    res.status(201).json({
      condo: savedCondo
    });
  } catch (error) {
    console.error('Error creating condo:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update condo
router.put('/condos/:id', async (req, res) => {
  try {
    const { name, address, description, image, gallery, amenities, distance, contactInfo } = req.body;
    
    // Find condo
    const condo = await Condo.findById(req.params.id);
    if (!condo) {
      return res.status(404).json({ message: 'Condo not found' });
    }
    
    // Update basic fields
    if (name) condo.name = name;
    if (address) condo.address = address;
    if (description) condo.description = description;
    if (distance !== undefined) condo.distance = distance;
    if (contactInfo) condo.contactInfo = contactInfo;
    
    // Update main image if provided
    if (image) {
      condo.image = image;
    }
    
    // Handle gallery images
    if (gallery && Array.isArray(gallery)) {
      // Get default gallery images
      const defaultGallery = [
        '../images/default-gallery-1.jpg',
        '../images/default-gallery-2.jpg',
        '../images/default-gallery-3.jpg',
        '../images/default-gallery-4.jpg'
      ];
      
      // Add provided gallery images (up to 4)
      const userGallery = gallery.slice(0, 4);
      
      // If less than 4 images provided, fill with defaults
      while (userGallery.length < 4) {
        userGallery.push(defaultGallery[userGallery.length]);
      }
      
      condo.gallery = userGallery;
    }
    
    // Update amenities if provided
    if (amenities && Array.isArray(amenities)) {
      condo.amenities = amenities;
    }
    
    // Save changes
    const updatedCondo = await Condo.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          address,
          description,
          image,
          gallery,
          amenities,
          distance,
          contactInfo
        }
      },
      { 
        new: true,       // Return the updated document
        runValidators: false  // Skip validation on update
      }
    );
    
    if (!updatedCondo) {
      return res.status(404).json({ message: 'Condo not found' });
    }
    
    res.json({
      condo: updatedCondo
    });
  } catch (error) {
    console.error('Error updating condo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete condo
router.delete('/condos/:id', async (req, res) => {
  try {
    const condo = await Condo.findById(req.params.id);
    
    if (!condo) {
      return res.status(404).json({ message: 'Condo not found' });
    }
    
    // Delete the condo
    await Condo.deleteOne({ _id: req.params.id });
    
    // Also delete associated reviews
    const Review = require('../models/Review');
    await Review.deleteMany({ condo: req.params.id });
    
    res.json({ message: 'Condo deleted successfully' });
  } catch (error) {
    console.error('Error deleting condo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;