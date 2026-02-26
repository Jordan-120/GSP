const { verifyToken } = require('../utils/jwt');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const decoded = verifyToken(token);

    // Confirm user exists in MySQL
    const sqlUser = await User.findOne({
      where: { id: decoded.id, email: decoded.email },
      attributes: ['id', 'email', 'profile_type', 'email_verification'],
    });

    if (!sqlUser) {
      return res.status(401).json({ message: 'User not found' });
    }

    // If your app requires verification before using protected routes:
    if (!sqlUser.email_verification) {
      return res.status(403).json({ message: 'Please verify your email first.' });
    }

    // Attach role + verification so downstream routes can enforce permissions
    req.user = {
      id: sqlUser.id,
      email: sqlUser.email,
      profile_type: sqlUser.profile_type,
      email_verification: sqlUser.email_verification,
    };

    next();
  } catch (error) {
    console.error('JWT auth error:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = protect;