
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import GoldLoan from '../models/GoldLoan.js';

const router = express.Router();

// @route   GET api/dashboard/stats
// @desc    Get dashboard stats
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const totalCustomers = await Customer.countDocuments();
        const totalInvoices = await Invoice.countDocuments();

        const pendingDues = await Invoice.aggregate([
            { $match: { status: { $ne: 'paid' } } },
            { $group: { _id: null, total: { $sum: '$dueAmount' } } },
        ]);

        const goldLoanSummary = await GoldLoan.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: null, total: { $sum: '$remainingAmount' } } },
        ]);

        res.json({
            totalCustomers,
            totalInvoices,
            pendingDues: pendingDues.length > 0 ? pendingDues[0].total : 0,
            goldLoanSummary: goldLoanSummary.length > 0 ? goldLoanSummary[0].total : 0,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/dashboard/sales-overview
// @desc    Get sales overview
// @access  Private
router.get('/sales-overview', authenticateToken, async (req, res) => {
    try {
        const salesData = await Invoice.aggregate([
            {
                $group: {
                    _id: { $month: '$date' },
                    sales: { $sum: '$totalAmount' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedSalesData = salesData.map(item => ({
            month: monthNames[item._id - 1],
            sales: item.sales,
        }));

        res.json(formattedSalesData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/dashboard/stock-levels
// @desc    Get stock levels
// @access  Private
router.get('/stock-levels', authenticateToken, async (req, res) => {
    try {
        // Mock data for now
        res.json([
            { name: 'Gold Jewelry', value: 45, color: '#FFD700' },
            { name: 'Silver Jewelry', value: 30, color: '#C0C0C0' },
            { name: 'Diamond Jewelry', value: 15, color: '#B9F2FF' },
            { name: 'Gemstone Jewelry', value: 10, color: '#FF6B6B' },
        ]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/dashboard/loan-repayments
// @desc    Get loan repayments
// @access  Private
router.get('/loan-repayments', authenticateToken, async (req, res) => {
    try {
        const loanData = await GoldLoan.aggregate([
            { $unwind: '$repayments' },
            {
                $group: {
                    _id: { $month: '$repayments.date' },
                    repayments: { $sum: '$repayments.amount' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedLoanData = loanData.map(item => ({
            month: monthNames[item._id - 1],
            repayments: item.repayments,
        }));

        res.json(formattedLoanData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
