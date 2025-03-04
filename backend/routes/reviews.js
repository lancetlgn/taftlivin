const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Condo = require('../models/Condo');
const { protect, admin } = require('../middleware/auth');

// Create review
router.post('/', protect, async (req, res) => {
  try {
    const { condo: condoId, rating, comment, ratings, recommend } = req.body;
    
    // Check if condo exists
    const condoExists = await Condo.findById(condoId);
    if (!condoExists) {
      return res.status(404).json({ message: 'Condo not found' });
    }
    
    // Check if user already reviewed this condo
    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      condo: condoId
    });
    
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Condo already reviewed' });
    }
    
    // Create review
    const review = new Review({
      user: req.user._id,
      condo: condoId,
      rating,
      comment,
      ratings,
      recommend
    });
    
    await review.save();
    
    // Update condo average rating
    const reviews = await Review.find({ condo: condoId });
    const avgRating = reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length;
    
    condoExists.averageRating = avgRating;
    condoExists.reviewCount = reviews.length;
    await condoExists.save();
    
    res.status(201).json({ message: 'Review added' });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get reviews for a condo
router.get('/condo/:id', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find({ condo: req.params.id })
      .populate('user', 'username profilePicture')
      .sort({ datePosted: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Review.countDocuments({ condo: req.params.id });
    
    res.json({
      reviews,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete review (admin or review owner)
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user is review owner or admin
    if (review.user.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await review.remove();
    
    // Update condo average rating
    const condo = await Condo.findById(review.condo);
    const reviews = await Review.find({ condo: review.condo });
    
    if (reviews.length > 0) {
      condo.averageRating = reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length;
    } else {
      condo.averageRating = 0;
    }
    
    condo.reviewCount = reviews.length;
    await condo.save();
    
    res.json({ message: 'Review removed' });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;