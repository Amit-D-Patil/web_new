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
  tenure: {
    type: Number, // in months
    required: true,
    min: 1
  },
  endDate: {
    type: Date,
  },
  collateralDetails: {
    collateralType: { type: String, required: true },
    purity: { type: String, required: true },
    weight: { type: Number, required: true },
    marketValue: { type: Number, required: true }
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
  notes: {
    type: String,
    default: ''
  },
  emi: {
    type: Number,
    required: true,
    min: 0
  },
  nextPaymentDue: Date,
}, { timestamps: true });

// Pre-save middleware to update the endDate and nextPaymentDue
goldLoanSchema.pre('save', function (next) {
  if (this.isNew) {
    const startDate = new Date(this.createdAt);
    this.endDate = new Date(startDate.setMonth(startDate.getMonth() + this.tenure));
    this.nextPaymentDue = new Date(startDate.setMonth(startDate.getMonth() + 1));
  }
  next();
});

// Pre-save middleware to generate loan number
goldLoanSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastLoan = await this.constructor.findOne({}, {}, { sort: { 'loanNumber': -1 } });
    const nextNumber = lastLoan ? parseInt(lastLoan.loanNumber.slice(2)) + 1 : 1;
    this.loanNumber = `GL${nextNumber.toString().padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('GoldLoan', goldLoanSchema);