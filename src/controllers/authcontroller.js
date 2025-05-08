const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const otpGenerator = require('otp-generator');

const sendEmail = require('../utils/sendEmail')
const createToken = (user) => 
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
const cookieOptions = {
  httpOnly: true,
  secure: true, // Ensure you're using HTTPS in production
  sameSite: "Strict",
  maxAge: 1 * 24 * 60 * 60 * 1000, // 7 days
};



exports.loginOrRegister = async (req, res) => {
    const {email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'All fields required' });

    let user = await User.findOne({ email });
    if (!user) {
        const hashed = await bcrypt.hash(password, 10);
        user = new User({  email, password: hashed });
        await user.save();
    } else {
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Wrong password' });
    }

    const token = createToken(user);
    user.currentSessionToken = token;
    await user.save();
    res.cookie("token", token, cookieOptions);
    res.json({ user, token });
};
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




exports.sendOtpToEmail = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    let user = await User.findOne({ email });
    if (!user) {
        user = new User({ email, otp, otpExpiry });
    } else {
        user.otp = otp;
        user.otpExpiry = otpExpiry;
    }

    await user.save();

    // Send OTP via email
    await sendEmail({
        email: email,
        subject: 'Your OTP for login',
        message: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });

    res.json({ message: 'OTP sent to email' });
};


exports.verifyOtpAndLogin = async (req, res) => {
    const { email, otp } = req.body;
    
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });
try{
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
        return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Clear OTP after use
    user.otp = null;
    user.otpExpiry = null;
   

    const token = createToken(user);
    user.currentSessionToken = token;
    await user.save();
    res.cookie("token", token, cookieOptions);
    res.json({
      user,
      token
     
    });}
    catch (err) {
      console.error('Google login error:', err);
      res.status(500).json({ message: 'Something went wrong' });
    }
  
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};



exports.getTransactions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('transactions');
    res.status(200).json({ transactions: user.transactions });
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

