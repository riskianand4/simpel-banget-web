const mongoose = require('mongoose');

const apiRequestLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  },
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  statusCode: {
    type: Number,
    required: true,
    index: true
  },
  responseTime: {
    type: Number,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  // API Key information
  apiKey: {
    type: String,
    default: null // null for failed auth attempts
  },
  apiKeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiKey',
    default: null
  },
  apiKeyName: {
    type: String,
    default: 'Unknown/Invalid'
  },
  // Error information for failed requests
  errorType: {
    type: String,
    enum: ['MISSING_API_KEY', 'INVALID_API_KEY', 'EXPIRED_API_KEY', 'INSUFFICIENT_PERMISSIONS', 'RATE_LIMITED', 'SUCCESS'],
    default: 'SUCCESS'
  },
  errorMessage: {
    type: String,
    default: null
  },
  // Request details
  requestSize: {
    type: Number,
    default: 0
  },
  responseSize: {
    type: Number,
    default: 0
  }
}, {
  timestamps: false, // We use our own timestamp field
  collection: 'api_request_logs'
});

// Indexes for performance
apiRequestLogSchema.index({ timestamp: -1 });
apiRequestLogSchema.index({ statusCode: 1, timestamp: -1 });
apiRequestLogSchema.index({ endpoint: 1, timestamp: -1 });
apiRequestLogSchema.index({ apiKeyId: 1, timestamp: -1 });

// TTL index to automatically delete logs older than 30 days
apiRequestLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Static method to log API request
apiRequestLogSchema.statics.logRequest = async function(requestData) {
  try {
    const log = new this(requestData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to log API request:', error);
    // Don't throw error as this shouldn't break the API request
  }
};

// Static method to get logs with aggregation
apiRequestLogSchema.statics.getAggregatedLogs = async function(timeRange = '24h') {
  const now = new Date();
  let startTime;
  
  switch (timeRange) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default: // 24h
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const pipeline = [
    {
      $match: {
        timestamp: { $gte: startTime }
      }
    },
    {
      $facet: {
        // Total request counts
        totalStats: [
          {
            $group: {
              _id: null,
              totalRequests: { $sum: 1 },
              successfulRequests: {
                $sum: {
                  $cond: [{ $lt: ['$statusCode', 400] }, 1, 0]
                }
              },
              failedRequests: {
                $sum: {
                  $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
                }
              },
              averageResponseTime: { $avg: '$responseTime' }
            }
          }
        ],
        // Top endpoints
        topEndpoints: [
          {
            $group: {
              _id: '$endpoint',
              count: { $sum: 1 }
            }
          },
          {
            $sort: { count: -1 }
          },
          {
            $limit: 5
          },
          {
            $project: {
              endpoint: '$_id',
              count: 1,
              _id: 0
            }
          }
        ],
        // Status code distribution
        statusCodes: [
          {
            $group: {
              _id: '$statusCode',
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              code: '$_id',
              count: 1,
              _id: 0
            }
          }
        ],
        // Hourly requests (for 24h view)
        hourlyRequests: [
          {
            $group: {
              _id: { $hour: '$timestamp' },
              requests: { $sum: 1 }
            }
          },
          {
            $sort: { '_id': 1 }
          }
        ],
        // Recent logs
        recentLogs: [
          {
            $sort: { timestamp: -1 }
          },
          {
            $limit: 50
          },
          {
            $project: {
              id: '$_id',
              timestamp: 1,
              method: 1,
              endpoint: 1,
              statusCode: 1,
              responseTime: 1,
              apiKeyName: 1,
              ipAddress: 1,
              userAgent: 1,
              errorType: 1,
              _id: 0
            }
          }
        ]
      }
    }
  ];

  const results = await this.aggregate(pipeline);
  return results[0];
};

module.exports = mongoose.model('ApiRequestLog', apiRequestLogSchema);