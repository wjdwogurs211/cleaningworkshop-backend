const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middleware/auth');

// 게스트 예약 생성 (로그인 불필요)
router.post('/guest', bookingController.createGuestBooking);

// 예약 생성 (로그인 필요)
router.post('/', protect, bookingController.createBooking);

// 예약 목록 조회
router.get('/', protect, bookingController.getBookings);

// 특정 예약 조회
router.get('/:id', protect, bookingController.getBooking);

// 예약 수정 (본인 또는 관리자)
router.patch('/:id', protect, bookingController.updateBooking);

// 예약 취소
router.patch('/:id/cancel', protect, bookingController.cancelBooking);

// 예약 상태 변경 (관리자/청소부)
router.patch('/:id/status', protect, restrictTo('admin', 'cleaner'), bookingController.updateBookingStatus);

// 가능한 시간대 조회
router.get('/available-slots/:date', bookingController.getAvailableSlots);

// 예약 가능 여부 확인
router.post('/check-availability', bookingController.checkAvailability);

// 관리자용 라우트
router.get('/admin/all', protect, restrictTo('admin'), bookingController.getAllBookings);
router.get('/admin/stats', protect, restrictTo('admin'), bookingController.getBookingStats);

module.exports = router;