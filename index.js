const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db.js'); // MongoDB connection config
const passport = require('passport');
const cors = require('cors');
const auth = require('./src/routes/auth.js')
const service = require('./src/routes/sevice.js')
const cookieParser = require('cookie-parser');
const wallet = require('./src/routes/wallet.js')


dotenv.config(); // Load environment variables

// Initialize express app
const app = express();
app.use(passport.initialize());
// Connect to database
connectDB();
app.use(cookieParser());
// Middleware to parse incoming JSON
app.use(express.json());

app.use(cors({
  origin: 'https://carhistorydekho.com', // the exact domain of your frontend
  credentials: true
}));

app.use('/api/user', auth);
app.use('/api/service',service);
app.use('/api/Payment', wallet);


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
