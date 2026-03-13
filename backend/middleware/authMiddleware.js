const { verifyToken } = require('../utils/jwt');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const decoded = verifyToken(token);

    const sqlUser = await User.findOne({
      where: { id: decoded.id, email: decoded.email },
      attributes: ['id', 'email', 'profile_type', 'email_verification', 'is_verified'],
    });

    if (!sqlUser) {
      return res.status(401).json({ message: 'User not found' });
    }

    const isVerified =
      typeof sqlUser.email_verification === 'boolean'
        ? sqlUser.email_verification
        : Boolean(sqlUser.is_verified);

    if (!isVerified) {
      return res.status(403).json({ message: 'Please verify your email first.' });
    }

    req.user = {
      id: sqlUser.id,
      email: sqlUser.email,
      profile_type: sqlUser.profile_type,
      email_verification: isVerified,
      is_verified: isVerified,
    };

    return next();
  } catch (error) {
    console.error('JWT auth error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = protect;
