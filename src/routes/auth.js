const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateSignup, validateLogin } = require('../middleware/validation');

// 회원가입
router.post('/signup', validateSignup, authController.signup);

// 로그인
router.post('/login', validateLogin, authController.login);

// 로그아웃
router.post('/logout', authController.logout);

// 토큰 갱신
router.post('/refresh', authController.refreshToken);

// 이메일 인증
router.get('/verify/:token', authController.verifyEmail);

// 비밀번호 재설정 요청
router.post('/forgot-password', authController.forgotPassword);

// 비밀번호 재설정
router.patch('/reset-password/:token', authController.resetPassword);

// 현재 사용자 정보
router.get('/me', protect, authController.getMe);

// 비밀번호 변경
router.patch('/update-password', protect, authController.updatePassword);

module.exports = router;