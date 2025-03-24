const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  condo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Condo',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: false
  },
  recommend: {
    type: Boolean,
    default: true
  },
  datePosted: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    default: ''
  }
});

// prevent users from submitting multiple reviews for the same condo
reviewSchema.index({ user: 1, condo: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);