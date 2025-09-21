const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Demo users matching the frontend - admin role removed
const demoUsers = [
  {
    name: 'Staff Demo',
    email: 'staff@inventory.com',
    password: 'staff123',
    role: 'user',
    department: 'Staff',
    permissions: ['read']
  },
  {
    name: 'Super Admin Demo',
    email: 'superadmin@inventory.com',
    password: 'admin123',
    role: 'super_admin',
    department: 'System Administration',
    permissions: ['read', 'write', 'delete', 'admin']
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create demo users
    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${user.email} (${user.role})`);
    }

    console.log('Demo users seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();