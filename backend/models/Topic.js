const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'locked', 'deleted'],
    default: 'active'
  },
  replies: [{
    content: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    datePosted: {
      type: Date,
      default: Date.now
    }
  }],
  datePosted: {
    type: Date,
    default: Date.now
  },
  featured: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Topic', TopicSchema);