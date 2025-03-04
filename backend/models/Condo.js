const mongoose = require('mongoose');

const condoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    address: String,
    distanceFromDLSU: Number
  },
  images: [String],
  amenities: [String],
  pricing: {
    monthly: Number,
    yearly: Number
  },
  averageRating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Condo', condoSchema);