const AdminActivity = require('../models/AdminActivity');

const logAdminActivity = (action, options = {}) => {
  return async (req, res, next) => {
    try {
      // Only log if user is authenticated and is super_admin
      if (req.user && req.user.role === 'super_admin') {
        const activity = {
          adminId: req.user.id,
          admin: req.user.name || req.user.email,
          action: typeof action === 'function' ? action(req) : action,
          resource: options.resource || req.baseUrl.replace('/api/', '') || 'System',
          location: options.location || 'System Core',
          details: {
            method: req.method,
            path: req.path,
            params: req.params,
            query: req.query,
            ...options.details
          },
          risk: options.risk || 'low',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || 'N/A'
        };

        // Log async without blocking the request
        AdminActivity.create(activity).catch(err => {
          console.error('Failed to log admin activity:', err);
        });
      }
    } catch (error) {
      console.error('Activity logger error:', error);
    }
    
    next();
  };
};

// Pre-defined activity loggers for common actions
const activityLoggers = {
  userAccess: logAdminActivity('Accessed user management'),
  productAccess: logAdminActivity('Accessed product management'),
  systemAccess: logAdminActivity('Accessed system configuration', { risk: 'medium' }),
  securityAccess: logAdminActivity('Accessed security settings', { risk: 'high' }),
  apiKeyAccess: logAdminActivity('Accessed API key management', { risk: 'high' }),
  configChange: logAdminActivity('Modified system configuration', { risk: 'medium' }),
  userModification: logAdminActivity('Modified user account', { risk: 'medium' }),
  
  // Dynamic loggers
  create: (resource) => logAdminActivity(`Created ${resource}`, { resource }),
  update: (resource) => logAdminActivity(`Updated ${resource}`, { resource }),
  delete: (resource) => logAdminActivity(`Deleted ${resource}`, { resource, risk: 'medium' }),
  view: (resource) => logAdminActivity(`Viewed ${resource}`, { resource })
};

module.exports = {
  logAdminActivity,
  activityLoggers
};