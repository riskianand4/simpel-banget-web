const express = require('express');
const { body, query, validationResult } = require('express-validator');
const SecurityEvent = require('../models/SecurityEvent');
const LoginAttempt = require('../models/LoginAttempt');
const { auth, superAdminAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get security events
// @route   GET /api/security/events
// @access  Super Admin
router.get('/events', superAdminAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('type').optional().isIn(['failed_login', 'suspicious_activity', 'rate_limit_exceeded', 'unauthorized_access', 'data_breach_attempt']),
  query('resolved').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.resolved !== undefined) filter.resolved = req.query.resolved === 'true';

    const events = await SecurityEvent.find(filter)
      .populate('userId', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SecurityEvent.countDocuments(filter);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Create security event
// @route   POST /api/security/events
// @access  Super Admin
router.post('/events', superAdminAuth, [
  body('type').isIn(['failed_login', 'suspicious_activity', 'rate_limit_exceeded', 'unauthorized_access', 'data_breach_attempt']),
  body('severity').isIn(['low', 'medium', 'high', 'critical']),
  body('description').notEmpty(),
  body('ipAddress').isIP()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await SecurityEvent.create({
      ...req.body,
      userId: req.body.userId || null
    });

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Resolve security event
// @route   PATCH /api/security/events/:id/resolve
// @access  Super Admin
router.patch('/events/:id/resolve', superAdminAuth, [
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const event = await SecurityEvent.findByIdAndUpdate(
      req.params.id,
      {
        resolved: true,
        resolvedBy: req.user.id,
        resolvedAt: new Date(),
        notes: req.body.notes
      },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ error: 'Security event not found' });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Get login attempts
// @route   GET /api/security/login-attempts
// @access  Super Admin
router.get('/login-attempts', superAdminAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('success').optional().isBoolean(),
  query('email').optional().isEmail(),
  query('days').optional().isInt({ min: 1, max: 90 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const days = parseInt(req.query.days) || 7;

    const filter = {
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    };

    if (req.query.success !== undefined) filter.success = req.query.success === 'true';
    if (req.query.email) filter.email = req.query.email;

    const attempts = await LoginAttempt.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LoginAttempt.countDocuments(filter);

    res.json({
      success: true,
      data: {
        attempts,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Get security statistics
// @route   GET /api/security/stats
// @access  Super Admin
router.get('/stats', superAdminAuth, [
  query('days').optional().isInt({ min: 1, max: 90 })
], async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [securityEvents, loginAttempts, failedLogins] = await Promise.all([
      SecurityEvent.countDocuments({ createdAt: { $gte: startDate } }),
      LoginAttempt.countDocuments({ createdAt: { $gte: startDate } }),
      LoginAttempt.countDocuments({ 
        createdAt: { $gte: startDate },
        success: false 
      })
    ]);

    const criticalEvents = await SecurityEvent.countDocuments({
      createdAt: { $gte: startDate },
      severity: 'critical'
    });

    const topThreats = await SecurityEvent.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const suspiciousIPs = await LoginAttempt.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          success: false
        }
      },
      { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
      { $match: { count: { $gte: 5 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          securityEvents,
          loginAttempts,
          failedLogins,
          criticalEvents,
          successRate: loginAttempts > 0 ? ((loginAttempts - failedLogins) / loginAttempts * 100).toFixed(2) : 100
        },
        topThreats,
        suspiciousIPs
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Block/Unblock IP address
// @route   POST /api/security/ip-block
// @access  Super Admin
router.post('/ip-block', superAdminAuth, [
  body('ipAddress').isIP(),
  body('action').isIn(['block', 'unblock']),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ipAddress, action, reason } = req.body;
    const blocked = action === 'block';

    // Update all login attempts from this IP
    await LoginAttempt.updateMany(
      { ipAddress },
      { blocked }
    );

    // Create security event
    await SecurityEvent.create({
      type: 'unauthorized_access',
      severity: blocked ? 'high' : 'medium',
      description: `IP ${ipAddress} ${blocked ? 'blocked' : 'unblocked'}: ${reason || 'Manual action'}`,
      ipAddress,
      metadata: { action, reason, performedBy: req.user.id }
    });

    res.json({
      success: true,
      message: `IP ${ipAddress} ${blocked ? 'blocked' : 'unblocked'} successfully`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;