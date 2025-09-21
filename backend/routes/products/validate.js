const Product = require('../../models/Product');

// Batch SKU validation endpoint
const validateSKUs = async (req, res) => {
  try {
    const { skus } = req.body;
    
    if (!Array.isArray(skus)) {
      return res.status(400).json({
        success: false,
        error: 'SKUs must be an array'
      });
    }

    const normalizedSKUs = skus.map(sku => sku.toString().toUpperCase());
    const existingProducts = await Product.find({ 
      sku: { $in: normalizedSKUs },
      status: 'active'
    }, 'sku name _id');

    const conflicts = [];
    const available = [];

    normalizedSKUs.forEach(sku => {
      const existing = existingProducts.find(p => p.sku === sku);
      if (existing) {
        conflicts.push({
          sku,
          existingProduct: {
            id: existing._id,
            name: existing.name,
            sku: existing.sku
          }
        });
      } else {
        available.push(sku);
      }
    });

    res.json({
      success: true,
      data: {
        conflicts,
        available,
        hasConflicts: conflicts.length > 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = { validateSKUs };