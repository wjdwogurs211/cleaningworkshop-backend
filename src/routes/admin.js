const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

// 모든 라우트에 관리자 권한 필요
router.use(protect, restrictTo('admin'));

// 대시보드
router.get('/dashboard', adminController.getDashboardStats);

// 통계
router.get('/stats/revenue', adminController.getRevenueStats);
router.get('/stats/bookings', adminController.getBookingStats);
router.get('/stats/users', adminController.getUserStats);
router.get('/stats/services', adminController.getServiceStats);

// 청소부 관리
router.get('/cleaners', adminController.getAllCleaners);
router.post('/cleaners', adminController.createCleaner);
router.patch('/cleaners/:id', adminController.updateCleaner);
router.get('/cleaners/:id/schedule', adminController.getCleanerSchedule);

// 시스템 설정
router.get('/settings', adminController.getSettings);
router.patch('/settings', adminController.updateSettings);

// 로그
router.get('/logs', adminController.getSystemLogs);

module.exports = router;