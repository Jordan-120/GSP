// Verify email not running ATM

const jwt = require('jsonwebtoken');
//const bcrypt = require('bcryptjs');   --- not used until we can get working, hence commented out 
const { Op } = require('sequelize');
const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');
const generateRandomToken = require('../utils/generateToken');

function generateJwtToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.profile_type,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
}

// REGISTER + send verification email
const register = async (req, res) => {
  try {
    let { first_name, last_name, email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required.' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    // If no names provided, derive something from email
    if (!first_name) {
      first_name = email.split('@')[0]; // "john" from "john@example.com"
    }
    if (!last_name) {
      last_name = '';
    }

    const verificationToken = generateRandomToken();
    const verificationTokenExpires = new Date(
      Date.now() + 1000 * 60 * 60 * 24
    ); // 24h

    // NOTE: we set password_hash to the *plain* password; model hook will hash it
    const user = await User.create({
      first_name,
      last_name,
      email,
      password_hash: password,
      // Newly registered users start as Guest + not verified
      profile_type: 'Guest',
      is_verified: false,
      verification_token: verificationToken,
      verification_token_expires: verificationTokenExpires,
    });

    // IMPORTANT:
    // CLIENT_URL should point to where this GET route is actually exposed.
    // For example, if your backend is running on http://localhost:5000
    // and auth routes are mounted at /api, then this is correct.
    const baseClientUrl = process.env.CLIENT_URL || 'http://localhost:5000';
    const verifyUrl = `${baseClientUrl}/api/verify-email/${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Verify your email',
      html: `
        <p>Hi ${user.first_name || ''},</p>
        <p>Thanks for registering. Please verify your email by clicking the link below:</p>
        <p><a href="${verifyUrl}">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
      `,
    });

    res.status(201).json({
      message: 'Account created. Please check your email to verify your account.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// VERIFY EMAIL ------ (Not working ATM, close - programmed around for now)
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      where: {
        verification_token: token,
        verification_token_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).send('Invalid or expired verification link.');
    }

    user.is_verified = true;
    // become Registered *after* verifying
    user.profile_type = 'Registered';
    user.verification_token = null;
    user.verification_token_expires = null;
    await user.save();

    // Option 1: simple message
    res.send('Email verified! You can now log in.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error.');
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (!user.is_verified) {
      return res
        .status(403)
        .json({ message: 'Please verify your email first.' });
    }

    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = generateJwtToken(user);

    // ✅ ROLE-BASED ROUTING TARGET
    // Adjust these paths to match your frontend routes
    const redirectTo =
      user.profile_type === 'Admin' ? '/adminView' : '/userView';

    return res.json({
      message: 'Login successful.',
      token,
      redirectTo, // ✅ frontend will use this
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        profile_type: user.profile_type,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};


// GET CURRENT USER (req.user is set by authMiddleware)
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: {
        exclude: ['password_hash', 'password_salt'],
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // don't reveal whether email exists
      return res.status(200).json({
        message: 'If this email is registered, a reset link has been sent.',
      });
    }

    const resetToken = generateRandomToken();
    const resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    user.reset_password_token = resetToken;
    user.reset_password_expires = resetPasswordExpires;
    await user.save();

    const baseClientUrl = process.env.CLIENT_URL || 'http://localhost:5000';
    const resetUrl = `${baseClientUrl}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Password reset',
      html: `
        <p>Hi ${user.first_name || ''},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
    });

    res.status(200).json({
      message: 'If this email is registered, a reset link has been sent.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required.' });
    }

    const user = await User.findOne({
      where: {
        reset_password_token: token,
        reset_password_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: 'Invalid or expired reset token.' });
    }

    // This will trigger beforeUpdate hook to re-hash
    user.password_hash = password;
    user.reset_password_token = null;
    user.reset_password_expires = null;
    await user.save();

    res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
