const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/db/database');
const paymentRoutes = require('./src/routes/paymentRoutes');
const errorHandler = require('./src/middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

connectDB();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'payment-service',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'iNova Payment Service',
    version: '1.0.0',
    endpoints: {
      payments: '/api/payments',
      health: '/health'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log('iNova Payment Service');
  console.log(`Port: ${PORT}`);
  console.log(`API: http://0.0.0.0:${PORT}/api/payments`);
});
