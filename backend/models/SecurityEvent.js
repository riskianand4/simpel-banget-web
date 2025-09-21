const mongoose = require('mongoose');

const securityEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['failed_login', 'suspicious_activity', 'rate_limit_exceeded', 'unauthorized_access', 'data_breach_attempt'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  endpoint: {
    type: String
  },
  method: {
    type: String
  },
  statusCode: {
    type: Number
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for performance
securityEventSchema.index({ type: 1, createdAt: -1 });
securityEventSchema.index({ severity: 1, resolved: 1 });
securityEventSchema.index({ ipAddress: 1, createdAt: -1 });

module.exports = mongoose.model('SecurityEvent', securityEventSchema);