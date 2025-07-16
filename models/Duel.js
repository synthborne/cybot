const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  discordId1: {
    type: String,
    required: true,
    unique: true
  },
  discordId2: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    required: true
  },
  draw_status: {
    type: Boolean,
    default: false
  },
  contestId: {
    type: Number,
  },
  index: {
    type: String,
  },
  rating: {
    type: Number,
  },
  min_contestId: {
    type: Number,
  },
  createdAt: {
    type: Number,
    default: Date.now
  }
});

module.exports = mongoose.model('Duel', userSchema);