const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');

// 공개 라우트
router.get('/', optionalAuth, reviewController.getAllReviews);
router.get('/service/:serviceId', reviewController.getServiceReviews);
router.get('/:id', reviewController.getReview);

// 인증 필요 라우트
router.use(protect);
router.post('/', reviewController.createReview);
router.patch('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);
router.post('/:id/helpful', reviewController.toggleHelpful);

// 관리자 전용
router.patch('/:id/response', restrictTo('admin'), reviewController.addAdminResponse);
router.patch('/:id/hide', restrictTo('admin'), reviewController.toggleHideReview);

module.exports = router;