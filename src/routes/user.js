const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

// 인증 필요 라우트
router.use(protect);

// 사용자 프로필
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);

// 주소 관리
router.post('/addresses', userController.addAddress);
router.patch('/addresses/:addressId', userController.updateAddress);
router.delete('/addresses/:addressId', userController.deleteAddress);

// 즐겨찾기 청소부
router.get('/favorite-cleaners', userController.getFavoriteCleaners);
router.post('/favorite-cleaners/:cleanerId', userController.addFavoriteCleaner);
router.delete('/favorite-cleaners/:cleanerId', userController.removeFavoriteCleaner);

// 포인트 내역
router.get('/points', userController.getPointHistory);

// 추천 관련
router.get('/referral-info', userController.getReferralInfo);

// 관리자 전용
router.use(restrictTo('admin'));
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;