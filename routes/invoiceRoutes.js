import express from 'express';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';

const router = express.Router();

/**
 * @route   POST /api/invoices
 * @desc    Create a new invoice and update customer history
 */
router.post('/', async (req, res) => {
  try {
    const {
      customerId,
      items,
      totalAmount,
      paidAmount = 0,
      gst = 3,
      date = new Date(),
    } = req.body;

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    // Calculate item totals
    const itemsWithTotal = items.map(item => ({
      ...item,
      totalPrice: (item.weight * item.rate) + (item.makingCharge || 0)
    }));

    const subtotal = itemsWithTotal.reduce((sum, item) => sum + item.totalPrice, 0);
    const gstAmount = subtotal * (gst / 100);
    const calculatedTotal = subtotal + gstAmount;

    // Verify total amount matches calculations
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({ 
        message: 'Total amount mismatch', 
        calculated: calculatedTotal, 
        provided: totalAmount 
      });
    }

    const dueAmount = totalAmount - paidAmount;

    // Create and save the invoice
    const invoice = new Invoice({
      customer: customerId,
      items: itemsWithTotal,
      totalAmount,
      paidAmount,
      dueAmount,
      gst,
      gstAmount,
      subtotal,
      date,
    });

    const savedInvoice = await invoice.save();

    // Update customer history and dues
    await Customer.findByIdAndUpdate(customerId, {
      $push: {
        history: {
          invoiceId: savedInvoice._id,
          date: savedInvoice.date,
          totalAmount,
          paidAmount,
          dueAmount,
        },
      },
      $inc: {
        totalDue: dueAmount,
        loyaltyPoints: Math.floor(paidAmount / 100),
      },
    });

    // Populate customer details before sending response
    const populatedInvoice = await Invoice.findById(savedInvoice._id).populate('customer');
    res.status(201).json(populatedInvoice);
  } catch (err) {
    console.error('Error saving invoice:', err);
    res.status(500).json({ message: 'Failed to create invoice', error: err.message });
  }
});

/**
 * @route   GET /api/invoices
 * @desc    Get all invoices with customer data
 */
router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('customer');
    res.json(invoices);
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ message: 'Failed to fetch invoices', error: err.message });
  }
});

export default router;
