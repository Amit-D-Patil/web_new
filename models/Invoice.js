import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: Number, unique: true },
  date: { type: Date, default: Date.now },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, required: true, default: 0 },
  dueAmount: { type: Number, required: true, default: 0 },
  items: [{
    name: { type: String, required: true },
    weight: { type: Number, required: true },
    rate: { type: Number, required: true },
    makingCharge: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true }
  }],
  gst: { type: Number, default: 3 },
  gstAmount: { type: Number, required: true, default: 0 },
  subtotal: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' }
});

// Pre-save middleware to generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const lastInvoice = await this.constructor.findOne({}, {}, { sort: { 'invoiceNumber': -1 } });
    this.invoiceNumber = lastInvoice ? lastInvoice.invoiceNumber + 1 : 1;
  }
  next();
});

// Pre-save middleware to calculate status
invoiceSchema.pre('save', function(next) {
  if (this.paidAmount >= this.totalAmount) {
    this.status = 'paid';
    this.dueAmount = 0;
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
    this.dueAmount = this.totalAmount - this.paidAmount;
  } else {
    this.status = 'pending';
    this.dueAmount = this.totalAmount;
  }
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
