const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Condo = require('../models/Condo');
const { protect } = require('../middleware/auth');

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { condoId, rating, comment, recommend } = req.body;
    
    if (!condoId || !rating) {
      return res.status(400).json({ message: 'Condo ID and rating are required' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const condoExists = await Condo.findById(condoId);
    if (!condoExists) {
      return res.status(404).json({ message: 'Condo not found' });
    }
    
    const existingReview = await Review.findOne({ 
      user: req.user._id, 
      condo: condoId 
    });
    
    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment;
      existingReview.recommend = recommend;
      existingReview.datePosted = Date.now();
      
      await existingReview.save();
      await updateCondoRating(condoId);
      
      return res.json({ message: 'Review updated successfully' });
    }
    
    const review = new Review({
      user: req.user._id,
      condo: condoId,
      rating,
      comment,
      recommend
    });
    
    await review.save();
    
    // Update condo average rating
    await updateCondoRating(condoId);
    
    res.status(201).json({ message: 'Review added successfully' });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/reviews/condo/:id
// @desc    Get reviews for a condo
// @access  Public
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
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update condo average rating helper function
async function updateCondoRating(condoId) {
  try {
    const reviews = await Review.find({ condo: condoId });
    
    if (reviews.length === 0) {
      // No reviews, set average to 0 and reviewCount to 0
      await Condo.findByIdAndUpdate(condoId, { 
        averageRating: 0,
        reviewCount: 0
      });
      console.log(`Updated condo ${condoId}: No reviews, set to 0`);
      return;
    }
    
    // Calculate average rating
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    const average = sum / reviews.length;
    
    // update condo with both average rating and review count
    const updatedCondo = await Condo.findByIdAndUpdate(
      condoId, 
      { 
        averageRating: average,
        reviewCount: reviews.length
      },
      { new: true } 
    );
    
    console.log(`Updated condo ${condoId}: Rating=${average.toFixed(2)}, Count=${reviews.length}`);
    console.log('Updated condo object:', updatedCondo);
  } catch (error) {
    console.error('Error in updateCondoRating:', error);
  }
}

router.get('/user/condo/:id', protect, async (req, res) => {
  try {
    const review = await Review.findOne({
      user: req.user._id,
      condo: req.params.id
    }).populate('user', 'username profilePicture');
    
    res.json({ review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});


router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this review' });
    }

    const condoId = review.condo;

    await Review.deleteOne({ _id: req.params.id });
    console.log(`Review ${req.params.id} deleted successfully`);
    
    const remainingReviews = await Review.find({ condo: condoId });
    const reviewCount = remainingReviews.length;
    
    let averageRating = 0;
    if (reviewCount > 0) {
      const sum = remainingReviews.reduce((total, rev) => total + rev.rating, 0);
      averageRating = sum / reviewCount;
    }
    
    const updatedCondo = await Condo.findByIdAndUpdate(
      condoId,
      { 
        averageRating: averageRating, 
        reviewCount: reviewCount 
      },
      { new: true }
    );
    
    console.log(`Updated condo ${condoId}: Rating=${averageRating.toFixed(2)}, Count=${reviewCount}`);
    
    res.json({ 
      message: 'Review deleted successfully',
      updatedCondo: {
        averageRating: averageRating,
        reviewCount: reviewCount
      }
    });
    
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update an existing review
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { rating, comment, recommend } = req.body;
    
    if (!rating) {
      return res.status(400).json({ message: 'Rating is required' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    

    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this review' });
    }
    
    review.rating = rating;
    review.comment = comment || review.comment;
    review.recommend = recommend !== undefined ? recommend : review.recommend;
    review.datePosted = Date.now();
    
    await review.save();
    
    // Update condo average rating
    await updateCondoRating(review.condo);
    
    res.json({ message: 'Review updated successfully' });
    
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/user', protect, async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user._id })
            .populate('condo', 'name address')
            .sort({ createdAt: -1 });

        console.log('Found reviews:', reviews); 
        
        res.json({
            success: true,
            reviews: reviews
        });
    } catch (error) {
        console.error('Error in /reviews/user:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews'
        });
    }
});




module.exports = router;