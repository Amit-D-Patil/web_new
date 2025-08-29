import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: Number, unique: true },
  date: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },

  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },

  items: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true },
      quantity: { type: Number, required: true, default: 1 },
      weight: { type: Number, required: true },
      pricePerGram: { type: Number, required: true },
      makingCharge: { type: Number, default: 0 },
      totalPrice: { type: Number, required: true },
    },
  ],

  subtotal: { type: Number, required: true },
  gst: { type: Number, default: 3 },
  gstAmount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },

  paymentMethod: {
    type: String,
    enum: ["cash", "card", "upi", "bank", "cheque"],
    default: "cash",
  },
  notes: { type: String, default: "" },

  status: {
    type: String,
    enum: ["pending", "partial", "paid"],
    default: "pending",
  },
});

// Auto-generate invoice number
invoiceSchema.pre("save", async function (next) {
  // Only generate if it's a new invoice
  if (this.isNew) {
    const lastInvoice = await this.constructor.findOne({}, {}, { sort: { invoiceNumber: -1 } });
    this.invoiceNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber) + 1 : 1;
  }
  next();
});

// Auto-calculate due amount & status
invoiceSchema.pre("save", function (next) {
  if (this.paidAmount >= this.totalAmount) {
    this.status = "paid";
    this.dueAmount = 0;
  } else if (this.paidAmount > 0) {
    this.status = "partial";
    this.dueAmount = this.totalAmount - this.paidAmount;
  } else {
    this.status = "pending";
    this.dueAmount = this.totalAmount;
  }
  next();
});

export default mongoose.model("Invoice", invoiceSchema);
