const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, default: null, trim: true },
  password: { type: String, default: null },
  googleId: { type: String, default: null },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  wallet: { type: Number, default: 25 },
  currentSessionToken: { type: String, default: null },
  mobile_number: { type: String, default: null },
  date: { type: Date, default: Date.now }  // <-- added date field
});

module.exports = mongoose.model('User', userSchema);
