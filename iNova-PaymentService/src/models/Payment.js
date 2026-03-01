const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true, index: true },
  orderId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'LKR', uppercase: true, trim: true },
  method: {
    type: String,
    enum: ['CARD', 'BANK_TRANSFER', 'WALLET', 'CASH_ON_DELIVERY'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
    index: true
  },
  transactionReference: { type: String, trim: true },
  failureReason: { type: String, trim: true },
  metadata: { type: Object, default: {} },
  paidAt: Date,
  refundedAt: Date
}, { timestamps: true });

paymentSchema.pre('validate', function preparePaymentId(next) {
  if (!this.paymentId) {
    this.paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
