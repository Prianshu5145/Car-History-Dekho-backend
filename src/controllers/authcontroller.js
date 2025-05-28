const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const otpGenerator = require('otp-generator');
const sendWhatsappOtp = require('../utils/sendWhatsappOtp');
const sendEmail = require('../utils/sendEmail')
const createToken = (user) => 
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
const cookieOptions = {
  httpOnly: true,
  secure: true,        
  sameSite: "None",   
  maxAge: 1 * 24 * 60 * 60 * 1000,
};
const Transaction = require('../models/Transaction');




exports.googleLogin = async (req, res) => {
    const { email,googleId} = req.body;
  
    if (!email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
  
    try {
      let user = await User.findOne({ email });
  
      if (!user) {
        user = new User({
         
          email,
          googleId
           
        });
        await user.save();
      }
  
      const token = createToken(user);
      user.currentSessionToken = token;
      await user.save();
      res.cookie("token", token, cookieOptions);
      res.json({
        user,
        token
       
      });
    } catch (err) {
      console.error('Google login error:', err);
      res.status(500).json({ message: 'Something went wrong' });
    }
  };









exports.logout = (req, res) => {
  res.clearCookie('token', {
  httpOnly: true,
  secure: true,          // Only if using HTTPS
  sameSite: 'None',      // Required for cross-site cookies
  path: '/',             // Match cookie path
});
  res.json({ message: "Logged out" });
};





exports.getTransactions = async (req, res) => {
  try {
    const userId =  req.user.id;
    
   

    // Find and return transactions of allowed types, sorted by ascending date
    const transactions = await Transaction.find({
      userid: userId,
      type: { $in: ['Credit', 'Debit', 'Debit Error'] }
    }).sort({ date: 1 }); // Ascending order

    res.status(200).json({ transactions });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ email: user.email });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendOtpToWhatsapp = async (req, res) => {
  const { mobile_number } = req.body;
 
  if (!mobile_number) return res.status(400).json({ error: 'Mobile number required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  let user = await User.findOne({ mobile_number });
  if (!user) {
    user = new User({ mobile_number, otp, otpExpiry });
  } else {
    user.otp = otp;
    user.otpExpiry = otpExpiry;
  }

  await user.save();

  try {
    await sendWhatsappOtp(mobile_number, otp);
    res.json({ message: 'OTP sent to WhatsApp' });
  } catch (err) {
    console.error('Error sending WhatsApp OTP:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
};

exports.verifyOtpAndLoginWithWhatsapp = async (req, res) => {
  const { mobile_number, otp } = req.body;

  if (!mobile_number || !otp)
    return res.status(400).json({ error: 'Mobile number and OTP required' });

  try {
    const user = await User.findOne({ mobile_number });
    if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    user.otp = null;
    user.otpExpiry = null;

    const token = createToken(user);
    user.currentSessionToken = token;
    await user.save();

    res.cookie("token", token, cookieOptions);
    res.json({ user, token });
  } catch (err) {
    console.error('WhatsApp OTP login error:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};


