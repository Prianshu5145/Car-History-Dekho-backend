const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
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
        enum: ['Credit', 'Debit', 'Error', 'Debit Error'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    userid: { 
        type: String,
        required: true
    },
    balance: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
