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
    required: true
  },
  images: [String],
  ratings: {
    cleanliness: Number,
    location: Number,
    amenities: Number,
    valueForMoney: Number
  },
  recommend: Boolean,
  datePosted: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', reviewSchema);