const express = require('express');
const { callService } = require('../controllers/servicecontroller');
const auth = require('../middleware/auth');
const {getJsonData} = require('../controllers/servicecontroller');
const router = express.Router();

router.post('/call', auth, callService);
router.post('/json-data',getJsonData);
module.exports = router;
