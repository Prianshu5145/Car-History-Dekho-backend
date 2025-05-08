const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
      type: String,
      required: true // No `unique` here
    },
    date: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['Credit', 'Debit'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    balance: {
      type: Number,
      required: true
    }
  });
  

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, trim: true },
  password: { type: String, default: null },
  googleId: { type: String, default: null },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  wallet: { type: Number, default: 25 },
  transactions: [transactionSchema],
  currentSessionToken: { type: String, default: null }
});

module.exports = mongoose.model('User', userSchema);
