const Razorpay = require('razorpay');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid'); // Optional, kept for future use or other needs
const User = require('../models/User');
const Transaction = require('../models/Transaction');
// Razorpay instance
const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Helper function to generate a six-digit unique transaction ID
const generateTransactionId = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create a new Razorpay order
exports.createOrder = async (req, res) => {
    const options = {
        amount: req.body.amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt: `txn_${Date.now()}`
    };
    try {
        const order = await instance.orders.create(options);
        res.json({ order });
    } catch (err) {
        res.status(500).json({ error: 'Order creation failed' });
    }
};

// Verify the Razorpay payment
exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                           .update(body).digest('hex');

    if (expected === razorpay_signature) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ error: 'User not found' });

            // Add the amount to user's wallet
            user.wallet += amount;

            // Add the transaction with the six-digit ID
            let transactionId = generateTransactionId();
            // user.transactions.push({
            //     transactionId: transactionId, 
            //     date: new Date(),
            //     description: 'Wallet Recharge',
            //     type: 'Credit',
            //     amount: amount,
            //     balance: user.wallet
            // });

           
let transaction = new Transaction(

    {
        transactionId: transactionId, // Six-digit transaction ID
        date: new Date(),
        description: 'Wallet Recharge',
        type: 'Credit',
        amount: amount,
        userid: req.user.id,
        balance: user.wallet
    })
    await transaction.save();
    await user.save();

            res.json({ success: true, newBalance: user.wallet });
        } catch (err) {
            console.error('Error updating wallet:', err);
            res.status(500).json({ error: 'Failed to update wallet' });
        }
    } else {
        res.status(400).json({ error: 'Invalid signature' });
    }
};

// Get user's wallet balance
exports.getWalletBalance = async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json({ balance: user.wallet });
};



exports.getTotalTransactions = async (req, res) => {
  try {
    // Assuming `req.user.id` is available from authentication middleware
    const userId = req.user.id;

    
    // Count transactions where userid matches current user's ID
    const totalTransactions = await Transaction.countDocuments({ userid: userId });

    res.json({ totalTransactions });
  } catch (err) {
    console.error('Error fetching total transactions:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


exports.getTotalCreditUsed = async (req, res) => {
  try {
    const userId = req.user.id;

    

    // Aggregate debit transactions for the user and sum the amount
    const result = await Transaction.aggregate([
      { $match: { userid: userId, type: 'Debit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalCreditUsed = result.length > 0 ? result[0].total : 0;

    res.json({ totalCreditUsed });
  } catch (err) {
    console.error('Error calculating credit used:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getTotalCreditAdded = async (req, res) => {
  try {
    const userId = req.user.id;

    // Optional: Validate that user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Aggregate 'Credit' transactions for the user and sum the amount
    const result = await Transaction.aggregate([
      { $match: { userid: userId, type: 'Credit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalCreditAdded = result.length > 0 ? result[0].total : 0;

    res.json({ totalCreditAdded });
  } catch (err) {
    console.error('Error calculating credit added:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};