const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  success: {
    type: Boolean,
    required: true
  },
  failureReason: {
    type: String,
    enum: ['invalid_email', 'invalid_password', 'account_locked', 'account_disabled']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  location: {
    country: String,
    city: String,
    region: String
  },
  blocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance and security analysis
loginAttemptSchema.index({ email: 1, createdAt: -1 });
loginAttemptSchema.index({ ipAddress: 1, createdAt: -1 });
loginAttemptSchema.index({ success: 1, createdAt: -1 });
loginAttemptSchema.index({ createdAt: -1 });

// TTL index to auto-delete old records after 90 days
loginAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);