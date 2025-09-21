const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const { auth, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all orders
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type;
    const status = req.query.status;
    const search = req.query.search;

    let query = {};
    
    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('supplier', 'name email phone')
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('supplier', 'name email phone address')
      .populate('customer', 'name email phone address')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('items.product', 'name sku price costPrice');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

// Create new order
router.post('/', [
  auth,
  requireRole(['admin', 'super_admin', 'user']),
  body('type').isIn(['purchase', 'sales']).withMessage('Type must be purchase or sales'),
  body('items').isArray({ min: 1 }).withMessage('Items array is required'),
  body('items.*.product').notEmpty().withMessage('Product ID is required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const orderData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Validate and populate product details
    for (let item of orderData.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }
      
      item.productName = product.name;
      item.sku = product.sku;
      item.total = (item.unitPrice * item.quantity) - (item.discount || 0);
    }

    // Validate supplier/customer based on order type
    if (orderData.type === 'purchase' && orderData.supplier) {
      const supplier = await Supplier.findById(orderData.supplier);
      if (!supplier) {
        return res.status(400).json({
          success: false,
          message: 'Supplier not found'
        });
      }
    }

    if (orderData.type === 'sales' && orderData.customer) {
      const customer = await Customer.findById(orderData.customer);
      if (!customer) {
        return res.status(400).json({
          success: false,
          message: 'Customer not found'
        });
      }
    }

    const order = new Order(orderData);
    await order.save();

    await order.populate([
      { path: 'supplier', select: 'name email phone' },
      { path: 'customer', select: 'name email phone' },
      { path: 'createdBy', select: 'name email' },
      { path: 'items.product', select: 'name sku' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Update order
router.put('/:id', [
  auth,
  requireRole(['admin', 'super_admin', 'user'])
], async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be updated
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update delivered or cancelled orders'
      });
    }

    // Update items if provided
    if (req.body.items) {
      for (let item of req.body.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (!product) {
            return res.status(400).json({
              success: false,
              message: `Product not found: ${item.product}`
            });
          }
          item.productName = product.name;
          item.sku = product.sku;
          item.total = (item.unitPrice * item.quantity) - (item.discount || 0);
        }
      }
    }

    Object.assign(order, req.body);
    await order.save();

    await order.populate([
      { path: 'supplier', select: 'name email phone' },
      { path: 'customer', select: 'name email phone' },
      { path: 'createdBy', select: 'name email' },
      { path: 'approvedBy', select: 'name email' },
      { path: 'items.product', select: 'name sku' }
    ]);

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
});

// Approve order
router.patch('/:id/approve', [auth, requireRole(['admin', 'super_admin'])], async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be approved'
      });
    }

    order.status = 'approved';
    order.approvedBy = req.user.id;
    order.approvedAt = new Date();
    await order.save();

    await order.populate([
      { path: 'supplier', select: 'name email phone' },
      { path: 'customer', select: 'name email phone' },
      { path: 'createdBy', select: 'name email' },
      { path: 'approvedBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Order approved successfully',
      data: order
    });
  } catch (error) {
    console.error('Error approving order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve order',
      error: error.message
    });
  }
});

// Cancel order
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel delivered or already cancelled orders'
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
});

// Delete order
router.delete('/:id', [auth, requireRole(['admin', 'super_admin'])], async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!['draft', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only draft or cancelled orders can be deleted'
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
});

module.exports = router;