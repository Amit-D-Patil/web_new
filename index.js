import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import customerRoutes from './routes/customerRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import goldLoanRoutes from './routes/goldLoanRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB (with pooling)
connectDB();

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/gold-loans', goldLoanRoutes);
app.use('/api/inventory', inventoryRoutes);

// Base route
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

// ✅ Only start server if not running in serverless
if (process.env.NODE_ENV !== 'serverless') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;

