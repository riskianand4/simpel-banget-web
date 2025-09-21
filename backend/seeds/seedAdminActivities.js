const AdminActivity = require('../models/AdminActivity');
const User = require('../models/User');

const seedAdminActivities = async () => {
  try {
    console.log('Seeding admin activities...');
    
    // Find superadmin user
    const superAdmin = await User.findOne({ role: 'superadmin' });
    if (!superAdmin) {
      console.log('No superadmin found, skipping admin activity seeding');
      return;
    }

    // Check if activities already exist
    const existingActivities = await AdminActivity.countDocuments();
    if (existingActivities > 0) {
      console.log('Admin activities already exist, skipping seeding');
      return;
    }

    // Create initial admin activities
    const activities = [
      {
        adminId: superAdmin._id,
        admin: superAdmin.name || superAdmin.email,
        action: 'System initialization completed',
        resource: 'System',
        location: 'System Core',
        details: {
          type: 'initialization',
          message: 'System successfully initialized and ready for use'
        },
        risk: 'low',
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        timestamp: new Date()
      },
      {
        adminId: superAdmin._id,
        admin: superAdmin.name || superAdmin.email,
        action: 'Database connection established',
        resource: 'Database',
        location: 'System Core',
        details: {
          type: 'database',
          message: 'Database connection successfully established'
        },
        risk: 'low',
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        adminId: superAdmin._id,
        admin: superAdmin.name || superAdmin.email,
        action: 'Admin dashboard accessed',
        resource: 'Dashboard',
        location: 'Admin Panel',
        details: {
          type: 'access',
          message: 'SuperAdmin dashboard accessed successfully'
        },
        risk: 'low',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (System)',
        timestamp: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      }
    ];

    await AdminActivity.insertMany(activities);
    console.log('✅ Admin activities seeded successfully');
    
  } catch (error) {
    console.error('❌ Error seeding admin activities:', error);
  }
};

module.exports = seedAdminActivities;