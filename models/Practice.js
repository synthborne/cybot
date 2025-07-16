const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true
  },
  contestId: {
    type: Number,
    required: true
  },
  index: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Number,
    default: Date.now
  }
});

module.exports = mongoose.model('Practice', userSchema);