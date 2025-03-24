const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const mongoose = require('mongoose');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/forum
// @desc    Get all topics with pagination
// @access  Public

router.get('/', async (req, res) => {
  try {
    // Build filter for search
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get all topics matching the filter
    const topics = await Topic.find(filter)
      .populate('user', 'username profilePicture')
      .sort({ datePosted: -1 });
    
    res.json({
      topics,
      total: topics.length
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forum
// @desc    Create a new topic
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, description } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const newTopic = new Topic({
      title,
      content,
      description: description || '',
      user: req.user._id,
      status: 'active',
      datePosted: Date.now()
    });

    const savedTopic = await newTopic.save();
    
    // Populate user data for response
    await savedTopic.populate('user', 'username profilePicture');

    res.status(201).json(savedTopic);
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/forum/:id
// @desc    Get a single topic with replies
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate('user', 'username profilePicture')
      .populate('replies.user', 'username profilePicture');

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json(topic);
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/forum/:id
// @desc    Update a topic
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, content, description } = req.body;
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Check if user is the author or an admin
    if (topic.user.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this topic' });
    }

    // Update fields
    if (title) topic.title = title;
    if (content) topic.content = content;
    if (description !== undefined) topic.description = description;

    const updatedTopic = await topic.save();
    await updatedTopic.populate('user', 'username profilePicture');

    res.json(updatedTopic);
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forum/:id/reply
// @desc    Add a reply to a topic
// @access  Private
router.post('/:id/reply', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    if (!content) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    // Add new reply
    topic.replies.push({
      content,
      user: req.user._id,
      datePosted: Date.now()
    });

    const updatedTopic = await topic.save();
    await updatedTopic.populate('replies.user', 'username profilePicture');

    res.json(updatedTopic);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/forum/:id
// @desc    Delete a topic
// @access  Private/Admin
router.delete('/:id', protect, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Check if user is the author or an admin
    if (topic.user.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this topic' });
    }

    await Topic.deleteOne({ _id: topic._id });

    res.json({ message: 'Topic removed' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/forum/:id/status
// @desc    Update topic status (admin only)
// @access  Private/Admin
router.patch('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['active', 'locked', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }

    const topic = await Topic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    topic.status = status;
    const updatedTopic = await topic.save();

    res.json(updatedTopic);
  } catch (error) {
    console.error('Error updating topic status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;