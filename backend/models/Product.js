const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price must be positive']
  },
  stock: {
    current: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    minimum: {
      type: Number,
      default: 0,
      min: [0, 'Minimum stock cannot be negative']
    },
    maximum: {
      type: Number,
      min: [0, 'Maximum stock cannot be negative']
    }
  },
  unit: {
    type: String,
    default: 'pcs',
    trim: true
  },
  location: {
    warehouse: {
      type: String,
      trim: true
    },
    shelf: {
      type: String,
      trim: true
    },
    bin: {
      type: String,
      trim: true
    }
  },
  supplier: {
    name: {
      type: String,
      trim: true
    },
    contact: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  barcode: {
    type: String,
    trim: true
  },
  // Single image path (for uploaded files)
  image: {
    type: String,
    trim: true
  },
  // Multiple images array (for advanced usage)
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  specifications: {
    type: Map,
    of: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  // Stock status computed from current stock levels
  stockStatus: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ 'stock.current': 1 });

// Update stock status based on current stock
productSchema.pre('save', function(next) {
  if (this.stock && typeof this.stock.current === 'number') {
    if (this.stock.current <= 0) {
      this.stockStatus = 'out_of_stock';
    } else if (this.stock.current <= this.stock.minimum) {
      this.stockStatus = 'low_stock';
    } else {
      this.stockStatus = 'in_stock';
    }
  }
  next();
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (!this.costPrice || this.costPrice === 0) return 0;
  return ((this.price - this.costPrice) / this.costPrice) * 100;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);