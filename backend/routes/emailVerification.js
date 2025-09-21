const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const EmailVerification = require('../models/EmailVerification');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Rate limiting for verification endpoints
const verificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts per window
  message: { error: 'Too many verification attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resendRateLimit = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 3, // max 3 resends per window
  message: { error: 'Too many resend requests. Please wait 2 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// @desc    Verify email with code
// @route   POST /api/email-verification/verify
// @access  Public (for user creation) / Private (for other types)
router.post('/verify', verificationRateLimit, [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Code must be 6 digits'),
  body('type').isIn(['user_creation', 'email_change_old', 'email_change_new', 'password_change']).withMessage('Invalid verification type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code, type } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Find active verification record
    const verification = await EmailVerification.findOne({
      email: email.toLowerCase(),
      code,
      type,
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!verification) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification code' 
      });
    }

    // Check attempts limit
    if (verification.attempts >= 3) {
      return res.status(400).json({ 
        error: 'Maximum verification attempts exceeded. Please request a new code.' 
      });
    }

    // Increment attempts
    verification.attempts += 1;
    await verification.save();

    // Mark as verified
    verification.verified = true;
    await verification.save();

    // Handle different verification types
    let result = { success: true, message: 'Email verified successfully' };

    switch (type) {
      case 'user_creation':
        // Activate user account
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
          user.emailVerified = true;
          await user.save();
          result.message = 'Account activated successfully. You can now log in.';
        }
        break;

      case 'email_change_old':
        // Mark old email as verified, proceed to new email verification
        result.message = 'Old email verified. Check your new email for verification code.';
        result.nextStep = 'verify_new_email';
        break;

      case 'email_change_new':
        // Complete email change
        if (verification.userId && verification.newEmail) {
          const userToUpdate = await User.findById(verification.userId);
          if (userToUpdate) {
            userToUpdate.email = verification.newEmail;
            userToUpdate.pendingEmail = undefined;
            await userToUpdate.save();
            result.message = 'Email changed successfully.';
          }
        }
        break;

      case 'password_change':
        // Password change verification complete
        result.message = 'Password change verified. You can now set your new password.';
        result.verified = true;
        break;
    }

    // Log verification activity
    console.log(`✅ Email verification successful: ${email} - ${type}`);

    res.json(result);

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// @desc    Resend verification code
// @route   POST /api/email-verification/resend
// @access  Public (for user creation) / Private (for other types)
router.post('/resend', resendRateLimit, [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('type').isIn(['user_creation', 'email_change_old', 'email_change_new', 'password_change']).withMessage('Invalid verification type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, type } = req.body;

    // Deactivate previous codes
    await EmailVerification.updateMany(
      { 
        email: email.toLowerCase(), 
        type, 
        verified: false 
      },
      { verified: true } // Mark as used to prevent reuse
    );

    // Generate new code
    const code = EmailVerification.generateCode();
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Create new verification record
    const verification = new EmailVerification({
      email: email.toLowerCase(),
      code,
      type,
      ipAddress,
      userAgent
    });

    // Get user info for email template
    const user = await User.findOne({ email: email.toLowerCase() });
    let userName = user ? user.name : null;
    let newEmail = null;

    // For email change types, get additional info
    if (type === 'email_change_old' || type === 'email_change_new') {
      if (user && user.pendingEmail) {
        newEmail = user.pendingEmail;
        if (type === 'email_change_new') {
          verification.newEmail = newEmail;
          verification.userId = user._id;
        }
      }
    }

    await verification.save();

    // Send email based on type
    const emailToSend = type === 'email_change_new' ? newEmail : email;
    await emailService.sendVerificationCode(emailToSend, code, type, userName, newEmail);

    console.log(`📧 Verification code resent: ${emailToSend} - ${type}`);

    res.json({
      success: true,
      message: 'Verification code sent successfully',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

// @desc    Request email change (step 1: verify old email)
// @route   POST /api/email-verification/request-email-change
// @access  Private
router.post('/request-email-change', auth, [
  body('newEmail').isEmail().withMessage('Please provide a valid new email'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newEmail } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if new email already exists
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ error: 'Email already in use by another user' });
    }

    // Save pending email
    user.pendingEmail = newEmail.toLowerCase();
    await user.save();

    // Generate verification code for old email
    const code = EmailVerification.generateCode();
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Create verification record
    const verification = new EmailVerification({
      email: user.email,
      code,
      type: 'email_change_old',
      userId: user._id,
      newEmail: newEmail.toLowerCase(),
      ipAddress,
      userAgent
    });

    await verification.save();

    // Send verification code to old email
    await emailService.sendVerificationCode(user.email, code, 'email_change_old', user.name, newEmail);

    res.json({
      success: true,
      message: 'Verification code sent to your current email address',
      step: 'verify_old_email'
    });

  } catch (error) {
    console.error('Request email change error:', error);
    res.status(500).json({ error: 'Failed to initiate email change' });
  }
});

// @desc    Request password change verification
// @route   POST /api/email-verification/request-password-change
// @access  Private
router.post('/request-password-change', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate verification code
    const code = EmailVerification.generateCode();
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Create verification record
    const verification = new EmailVerification({
      email: user.email,
      code,
      type: 'password_change',
      userId: user._id,
      ipAddress,
      userAgent
    });

    await verification.save();

    // Send verification code
    await emailService.sendVerificationCode(user.email, code, 'password_change', user.name);

    res.json({
      success: true,
      message: 'Verification code sent to your email address'
    });

  } catch (error) {
    console.error('Request password change error:', error);
    res.status(500).json({ error: 'Failed to initiate password change' });
  }
});

module.exports = router;