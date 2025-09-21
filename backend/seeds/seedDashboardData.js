const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { connectDB } = require('../config/database');
require('dotenv').config();

const seedDashboardData = async () => {
  try {
    console.log('🌱 Starting dashboard data seeding...');
    
    await connectDB();

    // Create sample users if they don't exist
    const existingUsers = await User.find();
    if (existingUsers.length === 0) {
      const sampleUsers = [
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'password123',
          role: 'admin',
          department: 'IT',
          isActive: true,
          lastLogin: new Date()
        },
        {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'user',
          department: 'Operations',
          isActive: true,
          lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'password123',
          role: 'user',
          department: 'Warehouse',
          isActive: true,
          lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
        }
      ];

      const createdUsers = await User.create(sampleUsers);
      console.log(`✅ Created ${createdUsers.length} users`);
    }

    // Get users for reference
    const users = await User.find();
    const adminUser = users.find(u => u.role === 'admin') || users[0];

    // Create sample products if they don't exist
    const existingProducts = await Product.find();
    if (existingProducts.length === 0) {
      const sampleProducts = [
        {
          name: 'Set Top Box Telnet TV',
          sku: 'STB-TTV-001',
          category: 'Electronics',
          description: 'Advanced set-top box for digital TV',
          price: 150000,
          costPrice: 120000,
          stock: { current: 8, minimum: 10, maximum: 100 },
          unit: 'pcs',
          createdBy: adminUser._id,
          status: 'active'
        },
        {
          name: 'Fiber Optic Cable 50m',
          sku: 'FOC-50M-001',
          category: 'Cables',
          description: 'High quality fiber optic cable',
          price: 500000,
          costPrice: 400000,
          stock: { current: 25, minimum: 20, maximum: 200 },
          unit: 'pcs',
          createdBy: adminUser._id,
          status: 'active'
        },
        {
          name: 'Network Switch 24 Port',
          sku: 'NSW-24P-001',
          category: 'Network Equipment',
          description: '24-port managed network switch',
          price: 2500000,
          costPrice: 2000000,
          stock: { current: 15, minimum: 5, maximum: 50 },
          unit: 'pcs',
          createdBy: adminUser._id,
          status: 'active'
        },
        {
          name: 'Wireless Router',
          sku: 'WRT-001',
          category: 'Network Equipment',
          description: 'High-speed wireless router',
          price: 800000,
          costPrice: 600000,
          stock: { current: 3, minimum: 5, maximum: 30 },
          unit: 'pcs',
          createdBy: adminUser._id,
          status: 'active'
        }
      ];

      const createdProducts = await Product.create(sampleProducts);
      console.log(`✅ Created ${createdProducts.length} products`);
    }

    // Get products for reference
    const products = await Product.find();

    // Create sample stock movements
    const existingMovements = await StockMovement.find();
    if (existingMovements.length < 10) {
      const sampleMovements = [];

      // Create some pending approvals
      const pendingMovements = [
        {
          product: products[0]._id,
          type: 'adjustment',
          quantity: 5,
          previousStock: products[0].stock.current,
          newStock: products[0].stock.current + 5,
          reason: 'Stock count discrepancy found during audit',
          createdBy: users[1]._id,
          status: 'pending'
        },
        {
          product: products[1]._id,
          type: 'out',
          quantity: -10,
          previousStock: products[1].stock.current,
          newStock: products[1].stock.current - 10,
          reason: 'Issued for installation project',
          reference: 'INS-2024-001',
          createdBy: users[2]._id,
          status: 'pending'
        }
      ];

      // Create some completed movements for activity log
      const completedMovements = [
        {
          product: products[2]._id,
          type: 'in',
          quantity: 10,
          previousStock: products[2].stock.current - 10,
          newStock: products[2].stock.current,
          reason: 'New stock received from supplier',
          reference: 'PO-2024-001',
          supplier: {
            name: 'PT Network Solutions',
            contact: '021-12345678',
            invoice: 'INV-001'
          },
          createdBy: adminUser._id,
          approvedBy: adminUser._id,
          approvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          status: 'approved'
        },
        {
          product: products[3]._id,
          type: 'out',
          quantity: -2,
          previousStock: products[3].stock.current + 2,
          newStock: products[3].stock.current,
          reason: 'Issued to customer installation',
          reference: 'CUST-2024-005',
          createdBy: users[1]._id,
          approvedBy: adminUser._id,
          approvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          status: 'approved'
        }
      ];

      sampleMovements.push(...pendingMovements, ...completedMovements);

      if (sampleMovements.length > 0) {
        await StockMovement.create(sampleMovements);
        console.log(`✅ Created ${sampleMovements.length} stock movements`);
      }
    }

    console.log('🎉 Dashboard data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding dashboard data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeder if called directly
if (require.main === module) {
  seedDashboardData();
}

module.exports = seedDashboardData;