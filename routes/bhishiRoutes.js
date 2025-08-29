import express from 'express';
import mongoose from 'mongoose';
import Bhishi from '../models/Bhishi.js';

const router = express.Router();

// Get Bhishi details for a customer
router.get('/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    let bhishi = await Bhishi.findOne({ customer: customerId });

    if (!bhishi) {
      // If no Bhishi account, create one for the customer to ensure they have one
      const newBhishi = new Bhishi({ customer: customerId, balance: 0, transactions: [] });
      await newBhishi.save();
      return res.json(newBhishi);
    }

    // Sort transactions by date in descending order
    bhishi.transactions.sort((a, b) => b.date - a.date);

    res.json(bhishi);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching Bhishi details', error: error.message });
  }
});

// Deposit into Bhishi account
router.post('/:customerId/deposit', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { amount, notes } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Valid deposit amount is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    let bhishi = await Bhishi.findOne({ customer: customerId });

    if (!bhishi) {
      bhishi = new Bhishi({ customer: customerId, balance: 0, transactions: [] });
    }

    bhishi.balance += amount;
    bhishi.transactions.push({
      type: 'deposit',
      amount,
      notes,
      date: new Date(),
    });

    await bhishi.save();
    res.status(201).json(bhishi);
  } catch (error) {
    res.status(500).json({ message: 'Server error processing deposit', error: error.message });
  }
});

// Redeem from Bhishi account
router.post('/:customerId/redeem', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { amount, notes } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Valid redeem amount is required' });
    }
     if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    const bhishi = await Bhishi.findOne({ customer: customerId });

    if (!bhishi) {
      return res.status(404).json({ message: 'Bhishi account not found for this customer' });
    }

    if (bhishi.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance for redemption' });
    }

    bhishi.balance -= amount;
    bhishi.transactions.push({
      type: 'redeem',
      amount,
      notes,
      date: new Date(),
    });

    await bhishi.save();
    res.json(bhishi);
  } catch (error) {
    res.status(500).json({ message: 'Server error processing redemption', error: error.message });
  }
});

export default router;