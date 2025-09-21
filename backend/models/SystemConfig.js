const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['security', 'performance', 'features', 'maintenance', 'monitoring'],
    required: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'array', 'object'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  requiresRestart: {
    type: Boolean,
    default: false
  },
  validationRules: {
    min: Number,
    max: Number,
    options: [String],
    pattern: String
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
systemConfigSchema.index({ category: 1, key: 1 });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);