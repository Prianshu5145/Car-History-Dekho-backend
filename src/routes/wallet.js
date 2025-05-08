const express = require('express');
const { createOrder, verifyPayment, getWalletBalance,getTotalTransactions,getTotalCreditUsed,getTotalCreditAdded  } = require('../controllers/walletcontroller');
const authenticateUser = require('../middleware/auth');
const router = express.Router();

router.post('/create-order', createOrder);
router.post('/verify',authenticateUser,verifyPayment);
router.get('/balance',authenticateUser,getWalletBalance);
router.get('/total-transaction',authenticateUser,getTotalTransactions);
router.get('/total-debit',authenticateUser,getTotalCreditUsed);
router.get('/total-credit',authenticateUser,getTotalCreditAdded);
module.exports = router;

