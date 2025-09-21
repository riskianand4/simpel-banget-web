const mongoose = require('mongoose');

const systemHealthSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  metrics: {
    uptime: {
      type: Number,
      required: true
    },
    memoryUsage: {
      used: { type: Number, required: true },
      total: { type: Number, required: true },
      percentage: { type: String, required: true }
    },
    cpuUsage: {
      type: Number,
      default: 0
    },
    diskUsage: {
      type: Number,
      default: 0
    },
    activeConnections: {
      type: Number,
      default: 0
    },
    database: {
      status: { type: String, enum: ['healthy', 'unhealthy'], default: 'healthy' },
      responseTime: { type: Number, default: 0 }
    }
  },
  status: {
    type: String,
    enum: ['excellent', 'good', 'warning', 'critical'],
    default: 'excellent'
  }
}, {
  timestamps: true
});

// Index for efficient querying
systemHealthSchema.index({ timestamp: -1 });

module.exports = mongoose.model('SystemHealth', systemHealthSchema);