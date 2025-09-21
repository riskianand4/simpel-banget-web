#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Setting up authentication system...\n');

// Run the user seeding script
const seedProcess = spawn('node', ['backend/seeds/seedUsers.js'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

seedProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Authentication setup completed successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('   Staff:      staff@inventory.com / staff123');
    console.log('   Admin:      admin@inventory.com / admin123');
    console.log('   SuperAdmin: superadmin@inventory.com / admin123');
    console.log('\n🎯 Try logging in with any of these credentials.');
  } else {
    console.error('\n❌ Failed to setup authentication');
    process.exit(1);
  }
});

seedProcess.on('error', (error) => {
  console.error('❌ Error running seed script:', error.message);
  process.exit(1);
});