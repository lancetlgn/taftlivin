const express = require('express');
const router = express.Router();
const Condo = require('../models/Condo');
const { protect, admin } = require('../middleware/auth');

// Get all condos
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: 'i' };
    }
    
    if (req.query.minPrice) {
      filter['pricing.monthly'] = { $gte: parseInt(req.query.minPrice) };
    }
    
    if (req.query.maxPrice) {
      filter['pricing.monthly'] = { ...filter['pricing.monthly'], $lte: parseInt(req.query.maxPrice) };
    }
    
    if (req.query.minRating) {
      filter.averageRating = { $gte: parseFloat(req.query.minRating) };
    }
    
    const condos = await Condo.find(filter)
      .sort({ averageRating: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Condo.countDocuments(filter);
    
    res.json({
      condos,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCondos: total
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get single condo
router.get('/:id', async (req, res) => {
  try {
    const condo = await Condo.findById(req.params.id);
    
    if (!condo) {
      return res.status(404).json({ message: 'Condo not found' });
    }
    
    res.json(condo);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create condo (admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const condo = new Condo(req.body);
    await condo.save();
    
    res.status(201).json(condo);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update condo (admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const condo = await Condo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!condo) {
      return res.status(404).json({ message: 'Condo not found' });
    }
    
    res.json(condo);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete condo (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const condo = await Condo.findByIdAndDelete(req.params.id);
    
    if (!condo) {
      return res.status(404).json({ message: 'Condo not found' });
    }
    
    res.json({ message: 'Condo removed' });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;