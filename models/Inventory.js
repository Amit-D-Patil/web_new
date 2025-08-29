import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  itemCode: {
    type: String,
    // required: true,
    unique: true
  },
  itemType: {
    type: String,
    required: true,
    enum: ['Gold', 'Silver', 'Diamond', 'Platinum', 'Other']
  },
  category: {
    type: String,
    required: true,
    enum: ['Ornament', 'Bullion', 'Loose Stone', 'Raw Material']
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['gram', 'carat', 'piece']
  },
  purity: {
    type: Number, // in Karat for gold/platinum, percentage for silver
    required: true
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  sellingPrice: {
    type: Number,
    required: true
  },
  makingCharges: {
    type: Number,
    default: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  reorderLevel: {
    type: Number,
    required: true
  },
  supplier: {
    name: String,
    contact: String,
    invoiceNumber: String
  },
  location: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock', 'ordered'],
    default: 'in-stock'
  },
  images: [String],
  transactions: [{
    date: Date,
    type: {
      type: String,
      enum: ['purchase', 'sale', 'return', 'adjustment']
    },
    quantity: Number,
    price: Number,
    reference: String, // Invoice/PO number
    notes: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Pre-save middleware to generate item code
inventorySchema.pre('save', async function (next) {
  if (this.isNew) {
    const prefix = this.itemType.substring(0, 2).toUpperCase();
    const lastItem = await this.constructor.findOne(
      { itemCode: new RegExp(`^${prefix}`) },
      {},
      { sort: { 'itemCode': -1 } }
    );
    const nextNumber = lastItem ? parseInt(lastItem.itemCode.slice(2)) + 1 : 1;
    this.itemCode = `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to update status based on quantity and reorder level
inventorySchema.pre('save', function (next) {
  if (this.quantity <= 0) {
    this.status = 'out-of-stock';
  } else if (this.quantity <= this.reorderLevel) {
    this.status = 'low-stock';
  } else {
    this.status = 'in-stock';
  }
  next();
});

export default mongoose.model('Inventory', inventorySchema);