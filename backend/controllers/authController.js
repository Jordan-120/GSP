const { Op } = require('sequelize');
const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');
const generateRandomToken = require('../utils/generateToken');
const { generateToken } = require('../utils/jwt');

function isUserVerified(user) {
  if (typeof user.email_verification === 'boolean') {
    return user.email_verification;
  }
  if (typeof user.is_verified === 'boolean') {
    return user.is_verified;
  }
  return false;
}

function buildLoginResponse(user) {
  const isVerified = isUserVerified(user);
  const redirectTo = user.profile_type === 'Admin' ? '/adminView' : '/home';

  return {
    message: 'Login successful.',
    token: generateToken(user),
    redirectTo,
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      profile_type: user.profile_type,
      email_verification: isVerified,
      is_verified: isVerified,
    },
  };
}

function getBaseUrl(req) {
  return (
    process.env.CLIENT_URL ||
    `${req.protocol}://${req.get('host')}` ||
    'http://localhost:5000'
  );
}

const register = async (req, res) => {
  try {
    let { first_name, last_name, email, password } = req.body;

    email = String(email || '').trim().toLowerCase();
    first_name = String(first_name || '').trim();
    last_name = String(last_name || '').trim();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    if (!first_name) {
      first_name = email.split('@')[0] || 'User';
    }

    if (!last_name) {
      last_name = 'User';
    }

    const verificationToken = generateRandomToken();
    const verificationTokenExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const user = await User.create({
      first_name,
      last_name,
      email,
      password_hash: password,
      profile_type: 'Guest',
      email_verification: false,
      is_verified: false,
      verification_token: verificationToken,
      verification_token_expiry: verificationTokenExpires,
    });

    const baseUrl = getBaseUrl(req);
    const verifyUrl = `${baseUrl}/api/verify-email/${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Verify your email',
      html: `
        <p>Hi ${user.first_name || ''},</p>
        <p>Thanks for registering. Please verify your email by clicking the link below:</p>
        <p><a href="${verifyUrl}">Verify Email</a></p>
        <p>This link will expire in 24 hours. If you did not create an account, please ignore this email.</p>
      `,
    });

    return res.status(201).json({
      message: 'Account created. Please check your email to verify your account.',
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const token = String(req.params?.token || '').trim();

    if (!token) {
      return res.status(400).send('Invalid or expired verification link.');
    }

    const user = await User.findOne({
      where: {
        verification_token: token,
        verification_token_expiry: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).send('Invalid or expired verification link.');
    }

    user.email_verification = true;
    user.is_verified = true;
    if (user.profile_type === 'Guest') {
      user.profile_type = 'Registered';
    }
    user.verification_token = null;
    user.verification_token_expiry = null;
    await user.save();

    return res.send('Email verified! You can now log in.');
  } catch (err) {
    console.error('VerifyEmail error:', err);
    return res.status(500).send('Server error.');
  }
};

const login = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (!isUserVerified(user)) {
      return res.status(403).json({ message: 'Please verify your email first.' });
    }

    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    return res.json(buildLoginResponse(user));
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: {
        exclude: [
          'password_hash',
          'password_salt',
          'verification_token',
          'reset_password_token',
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json(user);
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(200).json({
        message: 'If this email is registered, a reset link has been sent.',
      });
    }

    const resetToken = generateRandomToken();
    const resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60);

    user.reset_password_token = resetToken;
    user.reset_password_expiry = resetPasswordExpires;
    await user.save();

    const baseUrl = getBaseUrl(req);
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

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

    return res.status(200).json({
      message: 'If this email is registered, a reset link has been sent.',
    });
  } catch (err) {
    console.error('ForgotPassword error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = String(req.params?.token || '').trim();
    const password = String(req.body?.password || '');

    if (!password) {
      return res.status(400).json({ message: 'Password is required.' });
    }

    const user = await User.findOne({
      where: {
        reset_password_token: token,
        reset_password_expiry: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    user.password_hash = password;
    user.reset_password_token = null;
    user.reset_password_expiry = null;
    await user.save();

    return res.json({
      message: 'Password updated successfully. You can now log in.',
    });
  } catch (err) {
    console.error('ResetPassword error:', err);
    return res.status(500).json({ message: 'Server error.' });
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
