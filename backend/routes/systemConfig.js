const express = require('express');
const { body, query, validationResult } = require('express-validator');
const SystemConfig = require('../models/SystemConfig');
const { superAdminAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get system configurations
// @route   GET /api/system/config
// @access  Super Admin
router.get('/', superAdminAuth, [
  query('category').optional().isIn(['security', 'performance', 'features', 'maintenance', 'monitoring'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const filter = {};
    if (req.query.category) filter.category = req.query.category;

    const configs = await SystemConfig.find(filter)
      .populate('updatedBy', 'name email')
      .sort({ category: 1, key: 1 });

    // Group by category
    const grouped = configs.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Get single configuration
// @route   GET /api/system/config/:key
// @access  Super Admin
router.get('/:key', superAdminAuth, async (req, res) => {
  try {
    const config = await SystemConfig.findOne({ key: req.params.key })
      .populate('updatedBy', 'name email');

    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Create system configuration
// @route   POST /api/system/config
// @access  Super Admin
router.post('/', superAdminAuth, [
  body('category').isIn(['security', 'performance', 'features', 'maintenance', 'monitoring']),
  body('key').notEmpty().matches(/^[a-zA-Z0-9_.-]+$/),
  body('value').exists(),
  body('dataType').isIn(['string', 'number', 'boolean', 'array', 'object']),
  body('description').notEmpty(),
  body('isEditable').optional().isBoolean(),
  body('requiresRestart').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Validate value type
    const { value, dataType } = req.body;
    if (!validateValueType(value, dataType)) {
      return res.status(400).json({ 
        error: `Value does not match specified data type: ${dataType}` 
      });
    }

    const config = await SystemConfig.create({
      ...req.body,
      updatedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: config
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Configuration key already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// @desc    Update system configuration
// @route   PUT /api/system/config/:key
// @access  Super Admin
router.put('/:key', superAdminAuth, [
  body('value').exists(),
  body('description').optional().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const config = await SystemConfig.findOne({ key: req.params.key });
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    if (!config.isEditable) {
      return res.status(403).json({ error: 'This configuration is not editable' });
    }

    // Validate value type
    if (!validateValueType(req.body.value, config.dataType)) {
      return res.status(400).json({ 
        error: `Value does not match expected data type: ${config.dataType}` 
      });
    }

    // Validate against rules if they exist
    if (config.validationRules) {
      const validationError = validateValue(req.body.value, config.validationRules, config.dataType);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }
    }

    const updatedConfig = await SystemConfig.findOneAndUpdate(
      { key: req.params.key },
      {
        value: req.body.value,
        description: req.body.description || config.description,
        updatedBy: req.user.id
      },
      { new: true }
    ).populate('updatedBy', 'name email');

    res.json({
      success: true,
      data: updatedConfig,
      requiresRestart: config.requiresRestart
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Delete system configuration
// @route   DELETE /api/system/config/:key
// @access  Super Admin
router.delete('/:key', superAdminAuth, async (req, res) => {
  try {
    const config = await SystemConfig.findOne({ key: req.params.key });
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    if (!config.isEditable) {
      return res.status(403).json({ error: 'This configuration cannot be deleted' });
    }

    await SystemConfig.findOneAndDelete({ key: req.params.key });

    res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Get system health
// @route   GET /api/system/health
// @access  Super Admin
router.get('/health/check', superAdminAuth, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
          responseTime: Date.now()
        },
        memory: {
          used: process.memoryUsage().heapUsed / 1024 / 1024,
          total: process.memoryUsage().heapTotal / 1024 / 1024,
          percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100).toFixed(2)
        },
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      }
    };

    // Check database response time
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    health.services.database.responseTime = Date.now() - start;

    // Overall health status
    if (health.services.database.status !== 'healthy' || 
        health.services.memory.percentage > 90) {
      health.status = 'unhealthy';
    }

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Helper functions
function validateValueType(value, dataType) {
  switch (dataType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return false;
  }
}

function validateValue(value, rules, dataType) {
  if (dataType === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      return `Value must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && value > rules.max) {
      return `Value must be at most ${rules.max}`;
    }
  }

  if (dataType === 'string') {
    if (rules.options && !rules.options.includes(value)) {
      return `Value must be one of: ${rules.options.join(', ')}`;
    }
    if (rules.pattern) {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(value)) {
        return `Value does not match required pattern`;
      }
    }
  }

  return null;
}

module.exports = router;