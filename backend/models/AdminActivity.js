const mongoose = require('mongoose');

const adminActivitySchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admin: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    default: 'System'
  },
  location: {
    type: String,
    default: 'System Core'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: 'N/A'
  },
  userAgent: {
    type: String,
    default: 'N/A'
  },
  risk: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
adminActivitySchema.index({ adminId: 1, timestamp: -1 });
adminActivitySchema.index({ timestamp: -1 });
adminActivitySchema.index({ risk: 1 });

module.exports = mongoose.model('AdminActivity', adminActivitySchema);