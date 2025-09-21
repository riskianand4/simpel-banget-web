// Database indexes for performance optimization
const User = require('../models/User');
const SecurityEvent = require('../models/SecurityEvent');
const LoginAttempt = require('../models/LoginAttempt');
const Product = require('../models/Product');
const Asset = require('../models/Asset');
const StockMovement = require('../models/StockMovement');
const AdminActivity = require('../models/AdminActivity');

const createDatabaseIndexes = async () => {
  try {
    console.log('Creating database indexes...');

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true, background: true });
    await User.collection.createIndex({ role: 1 }, { background: true });
    await User.collection.createIndex({ isActive: 1 }, { background: true });
    await User.collection.createIndex({ department: 1 }, { background: true });
    await User.collection.createIndex({ lastLogin: -1 }, { background: true });

    // Security Event indexes
    await SecurityEvent.collection.createIndex({ createdAt: -1 }, { background: true });
    await SecurityEvent.collection.createIndex({ type: 1, severity: 1 }, { background: true });
    await SecurityEvent.collection.createIndex({ ipAddress: 1 }, { background: true });
    await SecurityEvent.collection.createIndex({ resolved: 1 }, { background: true });
    await SecurityEvent.collection.createIndex({ userId: 1 }, { background: true });

    // Login Attempt indexes
    await LoginAttempt.collection.createIndex({ createdAt: -1 }, { background: true });
    await LoginAttempt.collection.createIndex({ ipAddress: 1, createdAt: -1 }, { background: true });
    await LoginAttempt.collection.createIndex({ email: 1, createdAt: -1 }, { background: true });
    await LoginAttempt.collection.createIndex({ success: 1 }, { background: true });
    await LoginAttempt.collection.createIndex({ blocked: 1 }, { background: true });

    // Product indexes (if Product model exists)
    try {
      await Product.collection.createIndex({ name: "text", description: "text" }, { background: true });
      await Product.collection.createIndex({ category: 1 }, { background: true });
      await Product.collection.createIndex({ sku: 1 }, { unique: true, background: true });
      await Product.collection.createIndex({ status: 1 }, { background: true });
      await Product.collection.createIndex({ createdAt: -1 }, { background: true });
      await Product.collection.createIndex({ price: 1 }, { background: true });
    } catch (error) {
      console.log('Product model indexes skipped (model may not exist)');
    }

    // Asset indexes (if Asset model exists)
    try {
      await Asset.collection.createIndex({ assetCode: 1 }, { unique: true, background: true });
      await Asset.collection.createIndex({ category: 1 }, { background: true });
      await Asset.collection.createIndex({ status: 1 }, { background: true });
      await Asset.collection.createIndex({ assignedTo: 1 }, { background: true });
      await Asset.collection.createIndex({ location: 1 }, { background: true });
    } catch (error) {
      console.log('Asset model indexes skipped (model may not exist)');
    }

    // Stock Movement indexes (if StockMovement model exists)
    try {
      await StockMovement.collection.createIndex({ productId: 1, createdAt: -1 }, { background: true });
      await StockMovement.collection.createIndex({ type: 1 }, { background: true });
      await StockMovement.collection.createIndex({ createdAt: -1 }, { background: true });
      await StockMovement.collection.createIndex({ userId: 1 }, { background: true });
    } catch (error) {
      console.log('StockMovement model indexes skipped (model may not exist)');
    }

    // Admin Activity indexes
    try {
      await AdminActivity.collection.createIndex({ userId: 1, timestamp: -1 }, { background: true });
      await AdminActivity.collection.createIndex({ action: 1 }, { background: true });
      await AdminActivity.collection.createIndex({ timestamp: -1 }, { background: true });
      await AdminActivity.collection.createIndex({ ipAddress: 1 }, { background: true });
    } catch (error) {
      console.log('AdminActivity model indexes skipped (model may not exist)');
    }

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
    // Don't fail the application startup, just log the error
  }
};

// TTL indexes for automatic cleanup
const createTTLIndexes = async () => {
  try {
    // Auto-delete login attempts older than 90 days
    await LoginAttempt.collection.createIndex(
      { createdAt: 1 }, 
      { expireAfterSeconds: 90 * 24 * 60 * 60, background: true }
    );

    // Auto-delete resolved security events older than 1 year
    await SecurityEvent.collection.createIndex(
      { createdAt: 1 }, 
      { 
        expireAfterSeconds: 365 * 24 * 60 * 60, 
        partialFilterExpression: { resolved: true },
        background: true 
      }
    );

    console.log('✅ TTL indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating TTL indexes:', error);
  }
};

module.exports = {
  createDatabaseIndexes,
  createTTLIndexes
};