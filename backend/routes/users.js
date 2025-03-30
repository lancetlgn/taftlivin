const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/s3Upload');
const path = require('path');
const fs = require('fs');

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (req.body.bio !== undefined) {
      user.bio = req.body.bio;
    }
    
    await user.save();
    
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      userType: user.userType,
      bio: user.bio
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Create profile pictures directory if it doesn't exist
const profilePicsDir = path.join(__dirname, '../public/uploads/users/profile');
if (!fs.existsSync(profilePicsDir)) {
    fs.mkdirSync(profilePicsDir, { recursive: true });
}



// Change password
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update your profile picture upload route
router.post('/upload/profile-picture', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    console.log('Profile picture upload handler called');
    console.log('Request file:', req.file);
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // S3 files have the URL in the location property
    const fileUrl = req.file.location;
    console.log('File uploaded to S3, URL:', fileUrl);
    
    if (!fileUrl) {
      console.log('No file URL returned from S3');
      return res.status(500).json({ message: 'File upload failed - no URL returned' });
    }
    
    user.profilePicture = fileUrl;
    await user.save();
    
    res.json({ 
      fileUrl, 
      message: 'Profile picture updated successfully' 
    });
  } catch (error) {
    console.error('Error in profile picture upload:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;