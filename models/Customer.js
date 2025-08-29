import { Schema, model } from 'mongoose';

const customerSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    trim: true,
    match: [/^\d{10}$/, 'Mobile number must be exactly 10 digits'],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
  },
  address: { type: String, trim: true },
  dob: { type: Date },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: '',
  },
  notes: { type: String, trim: true },

  // Loyalty system
  loyaltyPoints: { type: Number, default: 0 },

  // Customer billing history (populated from invoices)
  history: [
    {
      invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
      date: Date,
      totalAmount: Number,
      paidAmount: Number,
      dueAmount: Number,
    }
  ],

  // Total outstanding dues (updated automatically when invoice is created or paid)
  totalDue: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default model('Customer', customerSchema);
