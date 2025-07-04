import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import customerRoutes from './routes/customerRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import goldLoanRoutes from './routes/goldLoanRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';

dotenv.config(); // Load .env variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Routes
app.use('/api/customers', customerRoutes);   // Customer routes
app.use('/api/invoices', invoiceRoutes);     // Invoice routes
app.use('/api/gold-loans', goldLoanRoutes);  // Gold Loan routes
app.use('/api/inventory', inventoryRoutes);   // Inventory routes

// ✅ Base Route
app.get('/', (req, res) => {
  res.send('🚀 Gold Shop Management System Backend');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running`);
});
