const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { protect, restrictTo } = require('../middleware/auth');

// 공개 라우트
router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getService);
router.get('/category/:category', serviceController.getServicesByCategory);

// 관리자 전용 라우트
router.use(protect, restrictTo('admin'));
router.post('/', serviceController.createService);
router.patch('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);
router.post('/initialize', serviceController.initializeServices);

module.exports = router;