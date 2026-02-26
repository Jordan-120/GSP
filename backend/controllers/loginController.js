// backend/controllers/loginController.js
const User = require('../models/userModel');
const { generateToken } = require('../utils/jwt'); // our helper in utils/jwt.js

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check email verification
    if (!user.email_verification) {
      return res.status(403).json({ message: 'Email not verified. Please check your inbox.' });
    }

    // Validate password using helper in userModel
    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // ✅ Generate JWT
    const token = generateToken(user); // payload = { id, email }, expiresIn = 1h

    // ✅ Role-based redirect target (matches your views)
    const redirectTo = user.profile_type === 'Admin' ? '/adminView' : '/home';

    // Respond with token and user info
    res.json({
      message: 'Login successful',
      token,
      redirectTo,
      user: {
        id: user.id,
        email: user.email,
        profile_type: user.profile_type,
        email_verification: user.email_verification,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: 'Login failed' });
  }
};

module.exports = { loginUser };