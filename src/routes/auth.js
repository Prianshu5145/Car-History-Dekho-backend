const express = require('express');
const { googleLogin, getTransactions,getUserProfile,logout,sendOtpToWhatsapp,verifyOtpAndLoginWithWhatsapp } = require('../controllers/authcontroller');
const auth = require('../middleware/auth');
const router = express.Router();


router.post('/google-login', googleLogin);


router.post('/whatsapp-login', sendOtpToWhatsapp);
router.post('/whatsapp-verify-otp', verifyOtpAndLoginWithWhatsapp)
router.post('/logout', auth,logout);


router.get('/transactions', auth, getTransactions);
router.get('/profile', auth, getUserProfile);

module.exports = router;
