require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const axios = require('axios');
const jsonData = require('../utils/sample.json');
const Transaction = require('../models/Transaction');

const serviceCharges = {
  "RC Verification": 6,
  "PAN Verification": 5,
  "Account Verification": 4,
  "Challan Check": 4,
  "Hyundai Service": 25,
  "Mahindra Service": 25,
  "Maruti Service": 25,
  "Aadhaar Verification": 4
};

const serviceApiMapping = {
  "RC Verification": process.env.RC_VERIFICATION_URL,
  "Challan Check": process.env.CHALLAN_CHECK_URL,
  "PAN Verification": process.env.PAN_VERIFICATION_URL,
  "Account Verification": process.env.ACCOUNT_VERIFICATION_URL,
  "Hyundai Service": process.env.HYUNDAI_SERVICE_URL,
  "Mahindra Service": process.env.MAHINDRA_SERVICE_URL,
  "Maruti Service": process.env.MARUTI_SERVICE_URL,
  "Aadhaar Verification": process.env.AADHAAR_VERIFICATION_URL
};


// Six-digit transaction ID generator
const generateTransactionId = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.callService = async (req, res) => {
  const { serviceName, payload } = req.body;
  const cost = serviceCharges[serviceName];

  if (!cost) return res.status(400).json({ error: 'Invalid service' });

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.wallet < cost) return res.status(402).json({ error: 'Insufficient balance' });

  try {
    const apiUrl = serviceApiMapping[serviceName];
    if (!apiUrl) return res.status(400).json({ error: 'Service URL not found' });

    const headers = {
      'Content-Type': 'application/json',
      clientId: process.env.CLIENT_ID,
      secretKey: process.env.SECRET_KEY
    };

    const response = await axios.post(apiUrl, payload, { headers });

    // Deduct amount and log transaction
    user.wallet -= cost;

    const transactionId = generateTransactionId();
    user.transactions.push({
      transactionId,
      date: new Date(),
      description: serviceName,
      type: 'Debit',
      amount: cost,
      balance: user.wallet
    });

    const transaction = new Transaction({
      transactionId,
      date: new Date(),
      description: serviceName,
      type: 'Debit',
      amount: cost,
      userid: req.user.id
    });

    await transaction.save();
    await user.save();

    res.json({ data: response.data, newBalance: user.wallet });
  } catch (err) {
    const statusCode = err.response?.status;

   
    if (serviceName === 'RC Verification' && statusCode === 404) {
      user.wallet -= cost;

      const transactionId = generateTransactionId();
      user.transactions.push({
        transactionId,
        date: new Date(),
        description: serviceName,
        type: 'Debit',
        amount: cost,
        balance: user.wallet
      });

      const transaction = new Transaction({
        transactionId,
        date: new Date(),
        description: serviceName,
        type: 'Debit',
        amount: cost,
        userid: req.user.id
      });

      await transaction.save();
      await user.save();

      return res.status(505).json({ message: 'No data found', newBalance: user.wallet });
    }

    const transactionId = generateTransactionId();
    const transaction = new Transaction({
      transactionId,
      date: new Date(),
      description: `Error ${err.message} ${serviceName}`,
      type: 'Debit',
      amount: cost,
      userid: req.user.id
    });

    await transaction.save();
    console.error('Error calling service :', err.message || err);
    res.status(500).json({error: `Response Failed, no amount deducted \n${err.message}` });
  }
};


exports.getJsonData = (req, res) => {
  try {
    
    
   
   
      res.json(jsonData);
   
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to return JSON data' });
  }
};

