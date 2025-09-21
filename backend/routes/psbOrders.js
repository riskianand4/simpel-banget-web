const express = require('express');
const router = express.Router();
const PSBOrder = require('../models/PSBOrder');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');

// Input validation and sanitization
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
};

const validatePSBOrderInput = (data) => {
  const errors = [];
  
  if (!data.cluster || typeof data.cluster !== 'string') {
    errors.push('Cluster is required and must be a string');
  }
  if (!data.sto || typeof data.sto !== 'string') {
    errors.push('STO is required and must be a string');
  }
  if (!data.orderNo || typeof data.orderNo !== 'string') {
    errors.push('Order number is required and must be a string');
  }
  if (!data.customerName || typeof data.customerName !== 'string') {
    errors.push('Customer name is required and must be a string');
  }
  if (!data.customerPhone || typeof data.customerPhone !== 'string') {
    errors.push('Customer phone is required and must be a string');
  }
  if (!data.address || typeof data.address !== 'string') {
    errors.push('Address is required and must be a string');
  }
  if (!data.package || typeof data.package !== 'string') {
    errors.push('Package is required and must be a string');
  }
  
  return errors;
};

// Get all PSB orders with pagination and filters
router.get('/', auth, async (req, res) => {
  try {
    // Input validation and sanitization
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    
    // Build filter object with sanitized inputs
    const filter = {};
    if (req.query.cluster) {
      const sanitizedCluster = sanitizeInput(req.query.cluster);
      filter.cluster = { $regex: sanitizedCluster, $options: 'i' };
    }
    if (req.query.sto) {
      const sanitizedSto = sanitizeInput(req.query.sto);
      filter.sto = { $regex: sanitizedSto, $options: 'i' };
    }
    if (req.query.status) {
      const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
      if (validStatuses.includes(req.query.status)) {
        filter.status = req.query.status;
      }
    }
    if (req.query.technician) {
      const sanitizedTech = sanitizeInput(req.query.technician);
      filter.technician = { $regex: sanitizedTech, $options: 'i' };
    }
    
    // Date range filtering
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) {
        filter.createdAt.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        const endDate = new Date(req.query.dateTo);
        endDate.setHours(23, 59, 59, 999); // End of day
        filter.createdAt.$lte = endDate;
      }
    }
    
    if (req.query.search) {
      const sanitizedSearch = sanitizeInput(req.query.search);
      filter.$or = [
        { customerName: { $regex: sanitizedSearch, $options: 'i' } },
        { orderNo: { $regex: sanitizedSearch, $options: 'i' } },
        { customerPhone: { $regex: sanitizedSearch, $options: 'i' } },
        { address: { $regex: sanitizedSearch, $options: 'i' } },
        { package: { $regex: sanitizedSearch, $options: 'i' } }
      ];
    }

    // Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = {};
    sort[sortBy] = sortOrder;

    console.log(`[PSB] Fetching orders - Page: ${page}, Limit: ${limit}, Filter:`, filter);

    const [orders, total, aggregationStats] = await Promise.all([
      PSBOrder.find(filter)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      PSBOrder.countDocuments(filter),
      // Get aggregation stats for the filtered data
      PSBOrder.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            completedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
            },
            inProgressCount: {
              $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
            },
            uniqueClusters: { $addToSet: '$cluster' },
            uniqueSTOs: { $addToSet: '$sto' },
            uniqueTechnicians: { $addToSet: '$technician' }
          }
        }
      ])
    ]);

    console.log(`[PSB] Found ${orders.length} orders out of ${total} total`);

    // Format the response with IDs and additional stats
    const formattedOrders = orders.map(order => ({
      ...order,
      id: order._id,
      _id: order._id.toString()
    }));

    const totalPages = Math.ceil(total / limit);
    const stats = aggregationStats[0] || {
      totalRecords: 0,
      completedCount: 0,
      pendingCount: 0,
      inProgressCount: 0,
      uniqueClusters: [],
      uniqueSTOs: [],
      uniqueTechnicians: []
    };

    res.json({
      success: true,
      data: formattedOrders,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: {
        filtered: {
          total: stats.totalRecords,
          completed: stats.completedCount,
          pending: stats.pendingCount,
          inProgress: stats.inProgressCount,
          clusters: stats.uniqueClusters.length,
          stos: stats.uniqueSTOs.length,
          technicians: stats.uniqueTechnicians.length
        }
      },
      meta: {
        availableClusters: stats.uniqueClusters.filter(c => c),
        availableSTOs: stats.uniqueSTOs.filter(s => s),
        availableTechnicians: stats.uniqueTechnicians.filter(t => t)
      }
    });
  } catch (error) {
    console.error('[PSB] Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PSB orders',
      error: error.message
    });
  }
});
// Get PSB order analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const totalOrders = await PSBOrder.countDocuments();
    const completedOrders = await PSBOrder.countDocuments({ status: 'Completed' });
    const pendingOrders = await PSBOrder.countDocuments({ status: 'Pending' });
    const inProgressOrders = await PSBOrder.countDocuments({ status: 'In Progress' });

    // Get orders by cluster
    const clusterStats = await PSBOrder.aggregate([
      {
        $group: {
          _id: '$cluster',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get orders by STO
    const stoStats = await PSBOrder.aggregate([
      {
        $group: {
          _id: '$sto',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get monthly trends
    const monthlyTrends = await PSBOrder.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          completedOrders,
          pendingOrders,
          inProgressOrders,
          completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0
        },
        clusterStats,
        stoStats,
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('Error fetching PSB analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch PSB analytics'
    });
  }
});

// Create new PSB order
router.post('/', auth, async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.startTransaction();
    
    // Validate input
    const validationErrors = validatePSBOrderInput(req.body);
    if (validationErrors.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Sanitize input data
    const sanitizedData = {
      cluster: sanitizeInput(req.body.cluster),
      sto: sanitizeInput(req.body.sto),
      orderNo: sanitizeInput(req.body.orderNo),
      customerName: sanitizeInput(req.body.customerName),
      customerPhone: sanitizeInput(req.body.customerPhone),
      address: sanitizeInput(req.body.address),
      package: sanitizeInput(req.body.package),
      status: req.body.status || 'Pending',
      technician: req.body.technician ? sanitizeInput(req.body.technician) : undefined,
      notes: req.body.notes ? sanitizeInput(req.body.notes) : undefined,
      createdBy: req.user._id
    };

    // Check for duplicate orderNo with retry logic
    const existingOrder = await PSBOrder.findOne({ orderNo: sanitizedData.orderNo }).session(session);
    if (existingOrder) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        error: 'Order number already exists',
        details: `Order ${sanitizedData.orderNo} already exists`
      });
    }

    // Get the next order number atomically
    const lastOrder = await PSBOrder.findOne().sort({ no: -1 }).session(session);
    const nextNo = lastOrder ? lastOrder.no + 1 : 1;
    
    sanitizedData.no = nextNo;

    console.log(`[PSB] Creating order ${sanitizedData.orderNo} with no: ${nextNo}`);

    const order = new PSBOrder(sanitizedData);
    await order.save({ session });

    await order.populate('createdBy', 'name email');

    await session.commitTransaction();
    
    console.log(`[PSB] Order created successfully: ${order._id}`);

    res.status(201).json({
      success: true,
      data: order,
      message: 'PSB order created successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('[PSB] Error creating order:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `Duplicate ${field}`,
        details: `${field} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create PSB order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await session.endSession();
  }
});

// Update PSB order
router.put('/:id', auth, async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }

    // Ambil data update & buang _id biar gak bentrok
    const updateData = { ...req.body };
    delete updateData._id;

    // Sanitasi data
    const sanitizedUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (key !== 'createdBy' && key !== '__v') {
        sanitizedUpdateData[key] = typeof updateData[key] === 'string'
          ? sanitizeInput(updateData[key])
          : updateData[key];
      }
    });

    sanitizedUpdateData.updatedBy = req.user._id;

    console.log(`[PSB] Updating order ${req.params.id}`);

    const order = await PSBOrder.findByIdAndUpdate(
      req.params.id,
      sanitizedUpdateData,
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'PSB order not found'
      });
    }

    console.log(`[PSB] Order updated successfully: ${order._id}`);

    res.json({
      success: true,
      data: order,
      message: 'PSB order updated successfully'
    });
  } catch (error) {
    console.error('[PSB] Error updating order:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `Duplicate ${field}`,
        details: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update PSB order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Delete PSB order
router.delete('/:id', auth, async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }

    console.log(`[PSB] Deleting order ${req.params.id}`);

    const order = await PSBOrder.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'PSB order not found'
      });
    }

    console.log(`[PSB] Order deleted successfully: ${req.params.id}`);

    res.json({
      success: true,
      message: 'PSB order deleted successfully'
    });
  } catch (error) {
    console.error('[PSB] Error deleting order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete PSB order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single PSB order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }

    const order = await PSBOrder.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'PSB order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('[PSB] Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch PSB order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Generate sample PSB orders for testing
router.post('/generate-sample', auth, async (req, res) => {
  try {
    // Only allow super_admin to generate sample data
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Only super admin can generate sample data'
      });
    }

    const { seedPSBOrders } = require('../seeds/seedPSBOrders');
    const User = require('../models/User');
    
    // Get users for seeding
    const users = await User.find();
    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No users found. Please seed users first.'
      });
    }

    // Clear existing PSB orders
    await PSBOrder.deleteMany({});
    
    // Generate new sample data
    const orders = await seedPSBOrders(users);

    res.json({
      success: true,
      message: `Generated ${orders.length} sample PSB orders`,
      data: {
        count: orders.length
      }
    });
  } catch (error) {
    console.error('Error generating sample PSB orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate sample data'
    });
  }
});

module.exports = router;