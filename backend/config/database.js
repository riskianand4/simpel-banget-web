const mongoose = require('mongoose');
const { createDatabaseIndexes, createTTLIndexes } = require('./databaseIndexes');

const connectDB = async (retries = 5) => {
  try {
// Enhanced connection options for production - OPTIMIZED
    const options = {
      maxPoolSize: 50, // Increased pool size for better concurrency (was 10)
      minPoolSize: 5, // Minimum connections to maintain
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      maxConnecting: 5, // Maximum number of connections in the "connecting" state (increased from 2)
      family: 4, // Use IPv4
      retryWrites: true,
      retryReads: true,
      // Additional optimizations
      compressors: 'zlib', // Enable compression
      readPreference: 'primary', // Read from primary (required for transactions)
      connectTimeoutMS: 10000, // Connection timeout
      heartbeatFrequencyMS: 10000, // Heartbeat frequency
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Create database indexes for performance
    await createDatabaseIndexes();
    await createTTLIndexes();

    // Connection event handlers
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📊 MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ Database connection error (${retries} retries left):`, error.message);
    
    if (retries > 0) {
      console.log(`⏳ Retrying connection in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }
    
    console.error('❌ Failed to connect to database after all retries');
    process.exit(1);
  }
};

// Connection retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await connectDB();
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed');
        process.exit(1);
      }
      console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = { connectDB, connectWithRetry };