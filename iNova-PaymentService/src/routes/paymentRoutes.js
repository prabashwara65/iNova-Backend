const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/', paymentController.getAllPayments);
router.get('/code/:paymentId', paymentController.getPaymentByCode);
router.get('/order/:orderId', paymentController.getPaymentsByOrder);
router.get('/:id', paymentController.getPaymentById);

router.post('/', paymentController.createPayment);

router.put('/:id', paymentController.updatePayment);
router.patch('/:id/status', paymentController.updatePaymentStatus);
router.patch('/:id/refund', paymentController.refundPayment);

module.exports = router;
