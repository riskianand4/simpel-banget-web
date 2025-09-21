const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['user_creation', 'email_change_old', 'email_change_new', 'password_change'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  newEmail: {
    type: String,
    lowercase: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    index: { expireAfterSeconds: 0 }
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for performance
emailVerificationSchema.index({ email: 1, type: 1 });
emailVerificationSchema.index({ code: 1 });
emailVerificationSchema.index({ userId: 1 });
emailVerificationSchema.index({ expiresAt: 1 });

// Generate random 6-digit verification code
emailVerificationSchema.statics.generateCode = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);