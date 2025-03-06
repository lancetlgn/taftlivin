const mongoose = require('mongoose');

// Create schema
const condoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: '../images/default-condo.jpg'
  },
  gallery: {
    type: [String],
    default: [
      '../images/default-gallery-1.jpg',
      '../images/default-gallery-2.jpg',
      '../images/default-gallery-3.jpg',
      '../images/default-gallery-4.jpg'
    ],
    validate: [
      function(val) {
        return val.length <= 4;
      },
      'Gallery cannot have more than 4 images'
    ]
  },
  amenities: {
    type: [String],
    default: []
  },
  distance: {
    type: Number, // Distance from DLSU in meters
    default: 0
  },
  contactInfo: {
    phone: String,
    email: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratings: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      value: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  averageRating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  }
});

// Calculate average rating before saving
condoSchema.pre('save', function(next) {
  if (this.ratings.length > 0) {
    this.averageRating = this.ratings.reduce((sum, rating) => sum + rating.value, 0) / this.ratings.length;
  }
  next();
});

module.exports = mongoose.model('Condo', condoSchema);