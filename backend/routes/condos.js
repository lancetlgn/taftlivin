const express = require('express');
const router = express.Router();
const Condo = require('../models/Condo');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/condos
// @desc    Get all condos
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object from query params
    const filter = {};
    
    // Add search functionality
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { address: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Add price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseInt(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseInt(req.query.maxPrice);
    }
    
    // Get condos with pagination
    const condos = await Condo.find(filter)
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });
    
    // Count total results
    const total = await Condo.countDocuments(filter);
    
    res.json({
      condos,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
  
});

// @route   GET /api/condos/popular
// @desc    Get popular condos (top 6 by review count)
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    // Find top 6 condos sorted by review count
    const condos = await Condo.find()
      .sort({ reviewCount: -1, createdAt: -1 })
      .limit(6);
    
    if (!condos || condos.length === 0) {
      return res.json({ condos: [] });
    }
    
    // Get the Review model using proper path
    const Review = require('../models/Review');
    
    // Process each condo more safely
    const condosWithReviews = [];
    
    for (const condo of condos) {
      try {
        // Create a plain object from the Mongoose document
        const condoObj = condo.toObject();
        
        try {
          // Find the most recent review for this condo
          const mostRecentReview = await Review.findOne({ condo: condo._id })
            .sort({ datePosted: -1 })
            .populate('user', 'username');
          
          // Add the most recent review if available
          if (mostRecentReview) {
            condoObj.recentReview = {
              comment: mostRecentReview.comment || 'Great place!',
              username: mostRecentReview.user ? mostRecentReview.user.username : 'Anonymous'
            };
          }
        } catch (reviewError) {
          console.error(`Error fetching review for condo ${condo._id}:`, reviewError);
          // Continue without review data
        }
        
        condosWithReviews.push(condoObj);
      } catch (condoError) {
        console.error(`Error processing condo ${condo._id}:`, condoError);
        // Add minimal condo data to avoid breaking the frontend
        condosWithReviews.push({
          _id: condo._id,
          name: condo.name || 'Unknown',
          address: condo.address || '',
          image: condo.image || '',
          averageRating: condo.averageRating || 0,
          reviewCount: condo.reviewCount || 0,
          distance: condo.distance || 0
        });
      }
    }
    
    res.json({ condos: condosWithReviews });
  } catch (error) {
    console.error('Error fetching popular condos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/condos/:id
// @desc    Get single condo
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const condo = await Condo.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('ratings.user', 'username');
    
    if (!condo) {
      return res.status(404).json({ message: 'Condo not found' });
    }
    
    res.json(condo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});



// @route   POST /api/condos
// @desc    Create a condo
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { 
      name,
      address,
      description,
      price,
      amenities,
      distance,
      contactInfo
    } = req.body;
    
    // Create new condo
    const newCondo = new Condo({
      name,
      address,
      description,
      price,
      amenities: amenities || [],
      distance: distance || 0,
      contactInfo: contactInfo || {},
      createdBy: req.user._id
    });
    
    // Save condo to DB
    const savedCondo = await newCondo.save();
    
    res.status(201).json(savedCondo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});




// @route   PUT /api/condos/:id
// @desc    Update a condo
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const {
      name,
      address,
      description,
      price,
      amenities,
      distance,
      contactInfo
    } = req.body;
    
    // Find condo by id
    const condo = await Condo.findById(req.params.id);
    
    if (!condo) {
      return res.status(404).json({ message: 'Condo not found' });
    }
    
    // Update fields
    condo.name = name || condo.name;
    condo.address = address || condo.address;
    condo.description = description || condo.description;
    condo.price = price || condo.price;
    if (amenities) condo.amenities = amenities;
    if (distance !== undefined) condo.distance = distance;
    if (contactInfo) condo.contactInfo = contactInfo;
    
    // Save updated condo
    const updatedCondo = await condo.save();
    
    res.json(updatedCondo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/condos/:id
// @desc    Delete a condo
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const condo = await Condo.findById(req.params.id);
    
    if (!condo) {
      return res.status(404).json({ message: 'Condo not found' });
    }
    
    await Condo.deleteOne({ _id: condo._id });
    
    res.json({ message: 'Condo removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/condos/:id/rating
// @desc    Add/Update rating to a condo
// @access  Private
router.post('/:id/rating', protect, async (req, res) => {
  try {
    const { value, comment } = req.body;
    
    // Validate rating
    if (value < 1 || value > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const condo = await Condo.findById(req.params.id);
    
    if (!condo) {
      return res.status(404).json({ message: 'Condo not found' });
    }
    
    // Check if user already submitted a rating
    const alreadyRated = condo.ratings.find(
      rating => rating.user.toString() === req.user._id.toString()
    );
    
    if (alreadyRated) {
      // Update existing rating
      alreadyRated.value = value;
      alreadyRated.comment = comment;
      alreadyRated.date = Date.now();
    } else {
      // Add new rating
      condo.ratings.push({
        user: req.user._id,
        value,
        comment
      });
    }
    
    // Save condo with new/updated rating
    await condo.save();
    
    res.json({ message: 'Rating added' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/condos/recalculate-reviews
// @desc    Recalculate review counts for all condos
// @access  Private/Admin
router.post('/recalculate-reviews', protect, admin, async (req, res) => {
  try {
    const Review = require('../models/Review');
    // Get all condos
    const condos = await Condo.find({});
    
    // For each condo, count its reviews and update
    for (const condo of condos) {
      const reviews = await Review.find({ condo: condo._id });
      
      if (reviews.length === 0) {
        // No reviews, set average to 0
        condo.averageRating = 0;
        condo.reviewCount = 0;
      } else {
        // Calculate average rating
        const sum = reviews.reduce((total, review) => total + review.rating, 0);
        condo.averageRating = sum / reviews.length;
        condo.reviewCount = reviews.length;
      }
      
      await condo.save();
    }
    
    res.json({ message: 'Review counts recalculated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});




module.exports = router;
