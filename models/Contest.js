const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  contestId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  phase: {
    type: String,
    required: true
  },
  announce: {
    type: Boolean,
    default: false
  },
  display: {
    type: Boolean,
    default: false
  },
});

module.exports = mongoose.model('Contest', userSchema);