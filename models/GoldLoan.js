import mongoose from 'mongoose';

const goldLoanSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  loanNumber: {
    type: String,
    unique: true,
    required: true
  },
  loanAmount: {
    type: Number,
    required: true,
    min: 0
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  duration: {
    type: Number, // in months
    required: true,
    min: 1
  },
  endDate: {
    type: Date,
    required: true
  },
  items: [{
    itemType: {
      type: String,
      required: true,
      enum: ['Gold', 'Silver', 'Diamond']
    },
    description: String,
    weight: {
      type: Number,
      required: true,
      min: 0
    },
    purity: {
      type: Number, // in Karat for gold
      required: true
    },
    marketValue: {
      type: Number,
      required: true
    }
  }],
  totalItemsValue: {
    type: Number,
    required: true
  },
  repayments: [{
    date: Date,
    amount: Number,
    interestPaid: Number,
    principalPaid: Number,
    remainingBalance: Number
  }],
  status: {
    type: String,
    enum: ['active', 'closed', 'defaulted', 'renewed'],
    default: 'active'
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  nextPaymentDue: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Pre-save middleware to update the endDate and nextPaymentDue
goldLoanSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('startDate') || this.isModified('duration')) {
    const startDate = new Date(this.startDate);
    this.endDate = new Date(startDate.setMonth(startDate.getMonth() + this.duration));
    this.nextPaymentDue = new Date(startDate.setMonth(startDate.getMonth() + 1));
  }
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to generate loan number
goldLoanSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastLoan = await this.constructor.findOne({}, {}, { sort: { 'loanNumber': -1 } });
    const nextNumber = lastLoan ? parseInt(lastLoan.loanNumber.slice(2)) + 1 : 1;
    this.loanNumber = `GL${nextNumber.toString().padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('GoldLoan', goldLoanSchema);