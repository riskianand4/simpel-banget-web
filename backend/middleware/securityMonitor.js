const SecurityEvent = require('../models/SecurityEvent');
const LoginAttempt = require('../models/LoginAttempt');

// Track failed login attempts and create security events
const trackLoginAttempt = async (email, ipAddress, userAgent, success, userId = null, failureReason = null) => {
  try {
    // Create login attempt record
    await LoginAttempt.create({
      email,
      ipAddress,
      userAgent,
      success,
      failureReason,
      userId
    });

    // If failed login, check for suspicious activity
    if (!success) {
      await checkForSuspiciousActivity(email, ipAddress);
    }
  } catch (error) {
    console.error('Error tracking login attempt:', error);
  }
};

// Check for suspicious activity patterns
const checkForSuspiciousActivity = async (email, ipAddress) => {
  try {
    const oneHour = new Date(Date.now() - 60 * 60 * 1000);
    
    // Check failed attempts from same IP in last hour
    const ipFailures = await LoginAttempt.countDocuments({
      ipAddress,
      success: false,
      createdAt: { $gte: oneHour }
    });

    // Check failed attempts for same email in last hour
    const emailFailures = await LoginAttempt.countDocuments({
      email,
      success: false,
      createdAt: { $gte: oneHour }
    });

    // Create security events based on thresholds
    if (ipFailures >= 10) {
      await SecurityEvent.create({
        type: 'suspicious_activity',
        severity: ipFailures >= 20 ? 'high' : 'medium',
        description: `Multiple failed login attempts from IP: ${ipAddress} (${ipFailures} attempts in 1 hour)`,
        ipAddress,
        metadata: { failedAttempts: ipFailures, timeframe: '1hour' }
      });
    }

    if (emailFailures >= 5) {
      await SecurityEvent.create({
        type: 'suspicious_activity',
        severity: emailFailures >= 10 ? 'high' : 'medium',
        description: `Multiple failed login attempts for email: ${email} (${emailFailures} attempts in 1 hour)`,
        ipAddress,
        metadata: { email, failedAttempts: emailFailures, timeframe: '1hour' }
      });
    }
  } catch (error) {
    console.error('Error checking suspicious activity:', error);
  }
};

// Monitor API usage patterns - OPTIMIZED (only log critical events)
const monitorApiUsage = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    try {
      const responseTime = Date.now() - start;
      const { method, path, ip } = req;
      const { statusCode } = res;

      // Only log performance issues - no database writes for normal requests
      if (responseTime > 5000) {
        console.warn(`Slow request detected: ${method} ${path} - ${responseTime.toFixed(2)}ms`);
        console.log('Performance Log:', {
          method,
          url: path,
          statusCode,
          responseTime: `${responseTime.toFixed(2)}ms`,
          memoryUsage: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
          timestamp: new Date().toISOString()
        });
      }

      // Only create database records for actual security issues (not normal requests)
      if (statusCode === 429 || statusCode === 401 || statusCode === 403) {
        // Use setImmediate to avoid blocking the response
        setImmediate(async () => {
          try {
            await SecurityEvent.create({
              type: statusCode === 429 ? 'rate_limit_exceeded' : 'unauthorized_access',
              severity: 'medium',
              description: `${statusCode === 429 ? 'Rate limit exceeded' : 'Unauthorized access attempt'} for ${method} ${path}`,
              ipAddress: ip,
              endpoint: path,
              method,
              statusCode,
              metadata: { responseTime }
            });
          } catch (error) {
            console.error('Error logging security event:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error monitoring API usage:', error);
    }
  });

  next();
};

// Check if IP is blocked
const checkBlocked = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    const blockedAttempt = await LoginAttempt.findOne({
      ipAddress,
      blocked: true
    });

    if (blockedAttempt) {
      await SecurityEvent.create({
        type: 'unauthorized_access',
        severity: 'high',
        description: `Blocked IP attempted access: ${ipAddress}`,
        ipAddress,
        endpoint: req.path,
        method: req.method,
        metadata: { blocked: true }
      });

      return res.status(403).json({
        error: 'Access denied. Your IP address has been blocked due to suspicious activity.'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking blocked status:', error);
    next();
  }
};

// Auto-block IPs with excessive failed attempts
const autoBlockSuspiciousIPs = async () => {
  try {
    const oneHour = new Date(Date.now() - 60 * 60 * 1000);
    
    // Find IPs with more than 50 failed attempts in the last hour
    const suspiciousIPs = await LoginAttempt.aggregate([
      {
        $match: {
          success: false,
          createdAt: { $gte: oneHour },
          blocked: false
        }
      },
      {
        $group: {
          _id: '$ipAddress',
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gte: 50 } }
      }
    ]);

    for (const ip of suspiciousIPs) {
      // Block all attempts from this IP
      await LoginAttempt.updateMany(
        { ipAddress: ip._id },
        { blocked: true }
      );

      // Create critical security event
      await SecurityEvent.create({
        type: 'suspicious_activity',
        severity: 'critical',
        description: `Auto-blocked IP due to excessive failed login attempts: ${ip._id} (${ip.count} attempts)`,
        ipAddress: ip._id,
        metadata: { 
          autoBlocked: true, 
          failedAttempts: ip.count,
          timeframe: '1hour'
        }
      });
    }
  } catch (error) {
    console.error('Error auto-blocking suspicious IPs:', error);
  }
};

// Run auto-block check every 10 minutes
setInterval(autoBlockSuspiciousIPs, 10 * 60 * 1000);

module.exports = {
  trackLoginAttempt,
  checkForSuspiciousActivity,
  monitorApiUsage,
  checkBlocked,
  autoBlockSuspiciousIPs
};