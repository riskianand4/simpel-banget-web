const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'Indonesia' }
  },
  contactPerson: {
    type: String,
    required: [true, 'Contact person is required'],
    trim: true
  },
  paymentTerms: {
    type: String,
    enum: ['Cash', 'Net 30', 'Net 60', 'Net 90', 'COD'],
    default: 'Net 30'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalValue: {
    type: Number,
    default: 0
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String,
    swiftCode: String
  },
  taxId: String,
  website: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
supplierSchema.index({ name: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ createdBy: 1 });

// Virtual for full address
supplierSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street, city, state, zipCode, country } = this.address;
  return [street, city, state, zipCode, country].filter(Boolean).join(', ');
});

supplierSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Supplier', supplierSchema);