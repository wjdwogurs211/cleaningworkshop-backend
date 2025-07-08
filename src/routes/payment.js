const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// 모든 라우트에 인증 필요
router.use(protect);

// 결제 요청
router.post('/request', paymentController.createPayment);

// 결제 승인
router.post('/confirm', paymentController.confirmPayment);

// 결제 취소
router.post('/cancel/:paymentId', paymentController.cancelPayment);

// 결제 내역 조회
router.get('/history', paymentController.getPaymentHistory);

// 결제 상세 조회
router.get('/:paymentId', paymentController.getPayment);

// 웹훅 (토스페이먼츠)
router.post('/webhook/toss', paymentController.handleTossWebhook);

module.exports = router;