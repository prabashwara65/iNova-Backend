const Payment = require('../models/Payment');

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
  return { page, limit };
};

const paymentController = {
  getAllPayments: async (req, res) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const { orderId, userId, status, method } = req.query;

      const filter = {};
      if (orderId) filter.orderId = orderId;
      if (userId) filter.userId = userId;
      if (status) filter.status = status;
      if (method) filter.method = method;

      const payments = await Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Payment.countDocuments(filter);

      res.json({
        payments,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPaymentById: async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPaymentByCode: async (req, res) => {
    try {
      const payment = await Payment.findOne({ paymentId: req.params.paymentId });
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPaymentsByOrder: async (req, res) => {
    try {
      const payments = await Payment.find({ orderId: req.params.orderId }).sort({ createdAt: -1 });
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createPayment: async (req, res) => {
    try {
      const payment = await Payment.create(req.body);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updatePayment: async (req, res) => {
    try {
      const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      res.json(payment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updatePaymentStatus: async (req, res) => {
    try {
      const updates = {
        status: req.body.status,
        transactionReference: req.body.transactionReference,
        failureReason: req.body.failureReason
      };

      if (req.body.status === 'CAPTURED') {
        updates.paidAt = new Date();
      }

      const payment = await Payment.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      res.json(payment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  refundPayment: async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      if (!['CAPTURED', 'AUTHORIZED'].includes(payment.status)) {
        return res.status(400).json({ error: 'Only authorized/captured payments can be refunded' });
      }

      payment.status = 'REFUNDED';
      payment.refundedAt = new Date();
      payment.metadata = {
        ...payment.metadata,
        refundReason: req.body.reason || 'Refund requested'
      };

      await payment.save();
      res.json(payment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = paymentController;
