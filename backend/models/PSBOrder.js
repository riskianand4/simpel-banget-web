const mongoose = require('mongoose');

const psbOrderSchema = new mongoose.Schema({
  no: {
    type: Number,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  cluster: {
    type: String,
    required: true
  },
  sto: {
    type: String,
    required: true
  },
  orderNo: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  package: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  technician: {
    type: String
  },
  notes: {
    type: String
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

// Index for better query performance
psbOrderSchema.index({ cluster: 1, sto: 1 });
psbOrderSchema.index({ status: 1 });
psbOrderSchema.index({ date: -1 });

module.exports = mongoose.model('PSBOrder', psbOrderSchema);