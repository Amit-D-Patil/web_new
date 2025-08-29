import express from 'express';
import { connectDB } from './db.js';
import cors from 'cors';
import dotenv from 'dotenv';
import customerRoutes from './routes/customerRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import goldLoanRoutes from './routes/goldLoanRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { authenticateToken } from './middleware/auth.js';
import bhishiRoutes from './routes/bhishiRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
dotenv.config(); // Load .env variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(req.method, req.hostname, req.path, res.statusCode);
  next();
});

connectDB();


// ✅ Routes
app.use('/api/auth', authRoutes); // Auth routes
app.use('/api/customers', authenticateToken, customerRoutes);   // Customer routes
app.use('/api/invoices', authenticateToken, invoiceRoutes);     // Invoice routes
app.use('/api/gold-loans', authenticateToken, goldLoanRoutes);  // Gold Loan routes
app.use('/api/inventory', authenticateToken, inventoryRoutes);   // Inventory routes
app.use('/api/bhishis', authenticateToken, bhishiRoutes); // Bhishi routes
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

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

if (process.env.NODE_ENV !== 'serverless') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;