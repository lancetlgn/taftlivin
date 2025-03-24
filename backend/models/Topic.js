const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  datePosted: {
    type: Date,
    default: Date.now
  }
});

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'locked', 'archived'],
    default: 'active'
  },
  replies: [replySchema],
  datePosted: {
    type: Date,
    default: Date.now
  }
});

const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic;