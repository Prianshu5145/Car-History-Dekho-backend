const express = require('express');
const { loginOrRegister, googleLogin,sendOtpToEmail,verifyOtpAndLogin, getTransactions,getUserProfile,logout } = require('../controllers/authcontroller');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/login-or-register', loginOrRegister);
router.post('/google-login', googleLogin);

router.post('/email-login', sendOtpToEmail);
router.post('/logout', auth,logout);

router.post('/verify-otp', verifyOtpAndLogin);
router.get('/transactions', auth, getTransactions);
router.get('/profile', auth, getUserProfile);

module.exports = router;
