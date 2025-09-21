const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
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
  type: {
    type: String,
    enum: ['individual', 'corporate'],
    required: true,
    default: 'individual'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalValue: {
    type: Number,
    default: 0
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  currentCredit: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: String,
    enum: ['Cash', 'Net 30', 'Net 60', 'COD'],
    default: 'Cash'
  },
  taxId: String,
  companyDetails: {
    companyName: String,
    industry: String,
    website: String
  },
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
customerSchema.index({ name: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ type: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ createdBy: 1 });

// Virtual for full address
customerSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street, city, state, zipCode, country } = this.address;
  return [street, city, state, zipCode, country].filter(Boolean).join(', ');
});

// Virtual for available credit
customerSchema.virtual('availableCredit').get(function() {
  return Math.max(0, this.creditLimit - this.currentCredit);
});

customerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Customer', customerSchema);