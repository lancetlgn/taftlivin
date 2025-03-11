const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const { protect, admin } = require('../middleware/auth');

// this is a placeholder!!!!
router.get('/', async (req, res) => {
  //res.json({ message: 'Forum endpoint (to be implemented)' });
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit

    const filter = {};

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Fetch forum posts from the database
    const topics = await Topic.find(filter)
      .limit(limit)
      .skip(skip)
      .sort({ datePosted: -1 });

    const total = await Topic.countDocuments(filter);
    // Send the list of posts as JSON
    res.json({
      topics,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    // Handle any errors that occur during the query
    console.error('error');
    res.status(500).json({ message: 'Server error' });
  }

});

// @route   GET /api/topics/:id
// @desc    Get single topic
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('ratings.user', 'username');
    
    if (!topic) {
      return res.status(404).json({ message: 'topic not found' });
    }
    
    res.json(topic);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/topics
// @desc    Create a topic
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { 
      title,
      content,
      user,
      status,
      replies,
      datePosted,
    } = req.body;
    
    // Create new topic
    const newTopic = new Topic({
      title,
      content,
      description,
      user,
      status,
      replies: replies|| [],
      datePosted,
    });
    
    // Save topic to DB
    const savedTopic = await newTopic.save();
    
    res.status(201).json(savedTopic);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/topics/:id
// @desc    Delete a topic
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    await Topic.deleteOne({ _id: topic._id });
    
    res.json({ message: 'Topic removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;