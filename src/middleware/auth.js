// middleware/authenticateUser.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateUser = async (req, res, next) => {
    const token = req.cookies.token;
   
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        // Decode the JWT to get user id
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id); // Ensure it's 'id' not 'userId'

        if (!user) {
            console.log('User not found in DB');
            return res.status(401).json({ message: 'User not found' });
        }

        // Log the currentSessionToken and the token from the cookie
       

        // Check if the token in the database matches the token from the cookie
        if (user.currentSessionToken !== token) {
            console.log('Session expired or invalid');
            return res.status(401).json({ message: 'Session expired or invalid' });
        }

        // If everything is valid, attach the user object to the request
        req.user = user;
        next();
    } catch (err) {
        console.error('Token verification error:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authenticateUser;
