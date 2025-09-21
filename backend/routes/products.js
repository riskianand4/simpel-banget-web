const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { auth, superAdminAuth } = require('../middleware/auth');
const { uploadProductImage } = require('../middleware/upload');
const { logAdminActivity, activityLoggers } = require('../middleware/activityLogger');
const { validateSKUs } = require('./products/validate');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// @desc    Get all products
// @route   GET /api/products
// @access  Private
router.get('/', auth, activityLoggers.productAccess, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isString(),
  query('status').optional().isIn(['active', 'inactive', 'discontinued']),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    // Default to active products unless status is explicitly specified
    if (req.query.status) {
      filter.status = req.query.status;
    } else {
      filter.status = 'active';
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { sku: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Upload product image
// @route   POST /api/products/upload-image
// @access  Private (Admin)
router.post('/upload-image', superAdminAuth, uploadProductImage, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imagePath = `/assets/products/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        imagePath,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin)
router.post('/', superAdminAuth, [
  body('name').notEmpty().withMessage('Product name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('stock.minimum').optional().isNumeric().withMessage('Minimum stock must be a number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if SKU already exists (only check active products)
    const existingProduct = await Product.findOne({ 
      sku: req.body.sku.toUpperCase(),
      status: 'active'
    });
    if (existingProduct) {
      return res.status(400).json({ 
        success: false,
        error: 'Product with this SKU already exists',
        errorCode: 'DUPLICATE_SKU',
        details: {
          field: 'sku',
          value: req.body.sku.toUpperCase(),
          existingProduct: {
            id: existingProduct._id,
            name: existingProduct.name,
            sku: existingProduct.sku
          }
        }
      });
    }

    const product = await Product.create({
      ...req.body,
      sku: req.body.sku.toUpperCase(),
      createdBy: req.user.id
    });

    // Create initial stock movement if stock is provided
    if (req.body.stock && req.body.stock.current > 0) {
      await StockMovement.create({
        product: product._id,
        type: 'in',
        quantity: req.body.stock.current,
        previousStock: 0,
        newStock: req.body.stock.current,
        reason: 'Initial stock',
        createdBy: req.user.id
      });
    }

    await product.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (User can update own products, Admin can update all)
router.put('/:id', auth, [
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('price').optional().isNumeric().withMessage('Price must be a number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check SKU uniqueness if being updated (only check active products)
    if (req.body.sku && req.body.sku.toUpperCase() !== product.sku) {
      const existingProduct = await Product.findOne({ 
        sku: req.body.sku.toUpperCase(),
        status: 'active'
      });
      if (existingProduct) {
        return res.status(400).json({ 
          success: false,
          error: 'Product with this SKU already exists',
          errorCode: 'DUPLICATE_SKU',
          details: {
            field: 'sku',
            value: req.body.sku.toUpperCase(),
            existingProduct: {
              id: existingProduct._id,
              name: existingProduct.name,
              sku: existingProduct.sku
            }
          }
        });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        sku: req.body.sku?.toUpperCase() || product.sku,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'name email');

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
router.delete('/:id', superAdminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product has stock movements
    const hasMovements = await StockMovement.findOne({ product: product._id });
    if (hasMovements) {
      // Soft delete: set status to inactive instead of deleting
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        { 
          status: 'inactive',
          updatedBy: req.user.id
        },
        { new: true }
      );

      return res.json({
        success: true,
        message: 'Product archived (set to inactive) due to existing stock movements',
        data: updatedProduct,
        archived: true
      });
    }

    // No stock movements, safe to hard delete
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Get low stock products
// @route   GET /api/products/alerts/low-stock
// @access  Private
router.get('/alerts/low-stock', auth, async (req, res) => {
  try {
    const products = await Product.find({
      $expr: {
        $lte: ['$stock.current', '$stock.minimum']
      },
      status: 'active'
    }).populate('createdBy', 'name email');

    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Private
router.get('/categories/list', auth, async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Validate SKUs for import
// @route   POST /api/products/validate-skus
// @access  Private (Admin)
router.post('/validate-skus', superAdminAuth, validateSKUs);

module.exports = router;