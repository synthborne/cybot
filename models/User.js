const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true
  },
  handle: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  curRating: {
    type: Number,
    required: true
  },
  points: {
    type : Number,
    required: true
  }
});

module.exports = mongoose.model('User', userSchema);
