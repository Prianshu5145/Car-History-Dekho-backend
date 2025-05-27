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
    // user.transactions.push({
    //   transactionId,
    //   date: new Date(),
    //   description: serviceName,
    //   type: 'Debit',
    //   amount: cost,
    //   balance: user.wallet
    // });

    const transaction = new Transaction({
      transactionId,
      date: new Date(),
      description: serviceName,
      type: 'Debit',
      amount: cost,
      userid: req.user.id,
      balance: user.wallet
    });

    await transaction.save();
    await user.save();

    res.json({ data: response.data, newBalance: user.wallet });
  }catch (err) {
    const statusCode = err.response?.status;
    const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
    const transactionId = generateTransactionId();
  
    let shouldDeduct = false;
    let userMessage = `Response Failed, no amount deducted\n${errorMessage}`;
    let transactionAmount = 0;
    let transactionDescription = `Error - ${err.response?.status} ${errorMessage} - ${serviceName}`;
  
    // PAN Verification - 404 error: Deduct amount and show "Data not found"
    if (serviceName === 'PAN Verification' && statusCode === 404) {
      shouldDeduct = true;
      userMessage = 'Data not found, Bad Request !';
      transactionAmount = cost;
      transactionDescription = serviceName;
    }
  
    // RC Verification - 404 error: Deduct amount and show "No data found"
    else if (serviceName === 'RC Verification' && statusCode === 404) {
      shouldDeduct = true;
      userMessage = 'No data found, Bad Request !';
      transactionAmount = cost;
      transactionDescription = serviceName;
    }
  
    // Maruti or Hyundai - 500 error: No deduction, return "Data not found"
    else if ((serviceName === 'Maruti Service' || serviceName === 'Hyundai Service') && statusCode === 500) {
      userMessage = 'Data not found, Bad Request !';
    }
  
    // Mahindra - 403 error: No deduction, return "Data not found"
    else if (serviceName === 'Mahindra Service' && statusCode === 403) {
      userMessage = 'Data not found, Bad Request !';
    }
  
    // Apply deduction if allowed
    if (shouldDeduct) {
      user.wallet -= cost;
  
      // user.transactions.push({
      //   transactionId,
      //   date: new Date(),
      //   description: transactionDescription,
      //   type: 'Debit',
      //   amount: transactionAmount,
      //   balance: user.wallet
      // });
  
      await user.save();
    }
  
    // Always save a transaction record, even for errors
    const transaction = new Transaction({
      transactionId,
      date: new Date(),
      description: transactionDescription,
      type: shouldDeduct ? 'Debit Error' : 'Error',
      amount: transactionAmount,
      userid: req.user.id,
      balance: user.wallet
    });
  
    await transaction.save();
  
    console.error('Error calling service:', errorMessage);
    return res.status(500).json({ message: userMessage, newBalance: user.wallet });
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

