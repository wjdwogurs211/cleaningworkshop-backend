const express = require('express');
const router = express.Router();
const imagenController = require('../controllers/imagenController');
const { protect, restrictTo } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// 업로드 디렉토리 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, `imagen_${Date.now()}${path.extname(file.originalname)}`)
  }
});

const upload = multer({ storage: storage });

// 이미지 생성 (인증 필요)
router.post('/generate', protect, imagenController.generateImage);

// 프롬프트 템플릿 조회
router.get('/templates', imagenController.getPromptTemplates);

// 생성된 이미지 목록
router.get('/images', protect, imagenController.getGeneratedImages);

// 관리자 전용: 대량 이미지 생성
router.post('/batch-generate', protect, restrictTo('admin'), imagenController.generateImage);

module.exports = router;