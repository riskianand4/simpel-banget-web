const mongoose = require('mongoose');
const AdminActivity = require('../models/AdminActivity');

// Test script to create some audit log entries
const createTestAuditLogs = async () => {
  try {
    // Connect to database (adjust connection string as needed)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_management');
    
    console.log('Creating test audit log entries...');
    
    const testLogs = [
      {
        adminId: new mongoose.Types.ObjectId(),
        admin: 'Super Admin',
        action: 'Accessed user management',
        resource: 'Users',
        location: 'User Management',
        details: {
          method: 'GET',
          path: '/users',
          timestamp: new Date()
        },
        risk: 'low',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        adminId: new mongoose.Types.ObjectId(),
        admin: 'Super Admin',
        action: 'Created new user',
        resource: 'Users',
        location: 'User Management',
        details: {
          method: 'POST',
          path: '/users',
          newUserEmail: 'test@example.com',
          timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        },
        risk: 'medium',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        adminId: new mongoose.Types.ObjectId(),
        admin: 'Super Admin',
        action: 'Updated system configuration',
        resource: 'System',
        location: 'System Core',
        details: {
          method: 'PUT',
          path: '/system/config',
          changes: ['database_timeout', 'cache_settings'],
          timestamp: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        },
        risk: 'high',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        adminId: new mongoose.Types.ObjectId(),
        admin: 'Super Admin',
        action: 'User Login',
        resource: 'Authentication',
        location: 'Login System',
        details: {
          loginTime: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ipAddress: '127.0.0.1'
        },
        risk: 'low',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        adminId: new mongoose.Types.ObjectId(),
        admin: 'Super Admin',
        action: 'Deleted user account',
        resource: 'Users',
        location: 'User Management',
        details: {
          method: 'DELETE',
          path: '/users/12345',
          deletedUserEmail: 'old@example.com',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        risk: 'high',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    ];
    
    await AdminActivity.insertMany(testLogs);
    console.log(`Successfully created ${testLogs.length} test audit log entries`);
    
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error creating test audit logs:', error);
    process.exit(1);
  }
};

// Run the script if called directly
if (require.main === module) {
  createTestAuditLogs();
}

module.exports = createTestAuditLogs;