import express from 'express';
import Inventory from '../models/Inventory.js';

const router = express.Router();

// POST: Add new inventory item
router.post('/', async (req, res) => {
  try {
    const inventory = new Inventory(req.body);
    const saved = await inventory.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET: Fetch all inventory items with filters
router.get('/', async (req, res) => {
  try {
    const { itemType, category, status, search } = req.query;
    let query = {};

    if (itemType) query.itemType = itemType;
    if (category) query.category = category;
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Inventory.find(query).sort({ createdAt: -1 });
    
    // Add alerts for low stock items
    const itemsWithAlerts = items.map(item => {
      const data = item.toObject();
      data.alerts = [];
      
      if (item.status === 'low-stock') {
        data.alerts.push({
          type: 'warning',
          message: `Quantity below reorder level (${item.reorderLevel})`
        });
      } else if (item.status === 'out-of-stock') {
        data.alerts.push({
          type: 'error',
          message: 'Item out of stock'
        });
      }
      
      return data;
    });

    res.json(itemsWithAlerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Get a single inventory item
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT: Update inventory item
router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: Delete an inventory item by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Inventory.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Add transaction (purchase/sale/return/adjustment)
router.post('/:id/transaction', async (req, res) => {
  try {
    const { type, quantity, price, reference, notes } = req.body;
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Validate transaction
    if (type === 'sale' && quantity > item.quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Update quantity based on transaction type
    const quantityChange = type === 'purchase' || type === 'return' ? quantity : -quantity;
    item.quantity += quantityChange;

    // Add transaction record
    item.transactions.push({
      date: new Date(),
      type,
      quantity,
      price,
      reference,
      notes
    });

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET: Get stock alerts
router.get('/alerts/stock', async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $or: [
        { status: 'low-stock' },
        { status: 'out-of-stock' }
      ]
    }).select('itemCode name quantity reorderLevel status');

    const alerts = lowStockItems.map(item => ({
      itemCode: item.itemCode,
      name: item.name,
      quantity: item.quantity,
      reorderLevel: item.reorderLevel,
      status: item.status,
      message: item.status === 'out-of-stock'
        ? 'Item is out of stock'
        : `Quantity (${item.quantity}) is below reorder level (${item.reorderLevel})`
    }));

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Get inventory statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } },
          lowStockItems: {
            $sum: { $cond: [{ $eq: ['$status', 'low-stock'] }, 1, 0] }
          },
          outOfStockItems: {
            $sum: { $cond: [{ $eq: ['$status', 'out-of-stock'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalItems: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;