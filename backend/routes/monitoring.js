const express = require('express');
const { performanceMonitor } = require('../middleware/performanceMonitor');
const { superAdminAuth } = require('../middleware/auth');
const ApiKey = require('../models/ApiKey');
const ApiRequestLog = require('../models/ApiRequestLog');

const router = express.Router();

// @desc    Get performance metrics
// @route   GET /api/monitoring/metrics
// @access  Admin
router.get('/metrics', superAdminAuth, (req, res) => {
  try {
    const metrics = performanceMonitor.getMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics'
    });
  }
});

// @desc    Get health status
// @route   GET /api/monitoring/health
// @access  Admin
router.get('/health', superAdminAuth, (req, res) => {
  try {
    const health = performanceMonitor.getHealthStatus();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health status'
    });
  }
});

// @desc    Reset metrics
// @route   POST /api/monitoring/reset
// @access  Admin
router.post('/reset', superAdminAuth, (req, res) => {
  try {
    performanceMonitor.resetMetrics();
    
    res.json({
      success: true,
      message: 'Metrics reset successfully'
    });
  } catch (error) {
    console.error('Error resetting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics'
    });
  }
});

// @desc    Get aggregated API monitoring data
// @route   GET /api/monitoring/api-data
// @access  Admin
router.get('/api-data', superAdminAuth, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    console.log(`Fetching API monitoring data for timeRange: ${timeRange}`);
    
    // Use the new comprehensive logging system
    const aggregatedData = await ApiRequestLog.getAggregatedLogs(timeRange);
    
    console.log('Raw aggregated data from DB:', JSON.stringify(aggregatedData, null, 2));
    
    // Extract data from aggregation results
    const totalStats = aggregatedData.totalStats[0] || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };
    
    const topEndpoints = aggregatedData.topEndpoints || [];
    const statusCodes = aggregatedData.statusCodes || [];
    const hourlyData = aggregatedData.hourlyRequests || [];
    const recentLogs = aggregatedData.recentLogs || [];
    
    // Create 24-hour array with proper hour formatting
    const hourlyRequests = Array(24).fill(0);
    hourlyData.forEach(item => {
      if (item._id >= 0 && item._id < 24) {
        hourlyRequests[item._id] = item.requests;
      }
    });
    
    // Format hourly requests
    const requestsToday = hourlyRequests.map((count, hour) => ({
      hour: `${hour}:00`,
      requests: count
    }));
    
    // Add performance metrics if available
    const performanceMetrics = performanceMonitor.getMetrics();
    
    const monitoringData = {
      totalRequests: totalStats.totalRequests,
      successfulRequests: totalStats.successfulRequests,
      failedRequests: totalStats.failedRequests,
      averageResponseTime: Math.round(totalStats.averageResponseTime || 0),
      topEndpoints,
      requestsToday,
      statusCodes,
      recentLogs: recentLogs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString(), // Ensure proper date format
        apiKeyName: log.apiKeyName || 'Unknown'
      }))
    };
    
    console.log('Final monitoring data:', JSON.stringify(monitoringData, null, 2));

    res.json({
      success: true,
      data: monitoringData
    });
  } catch (error) {
    console.error('Error getting API monitoring data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get API monitoring data',
      details: error.message
    });
  }
});

module.exports = router;