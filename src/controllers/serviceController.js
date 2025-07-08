const Service = require('../models/Service');

// 모든 서비스 조회
exports.getAllServices = async (req, res) => {
  try {
    const { category, isActive = true } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive;

    const services = await Service.find(query)
      .sort('popularity -createdAt');

    res.status(200).json({
      success: true,
      data: {
        services
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 특정 서비스 조회
exports.getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: '서비스를 찾을 수 없습니다.'
      });
    }

    // 조회수 증가
    service.popularity += 1;
    await service.save();

    res.status(200).json({
      success: true,
      data: {
        service
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 카테고리별 서비스 조회
exports.getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const services = await Service.find({ 
      category,
      isActive: true 
    }).sort('name');

    res.status(200).json({
      success: true,
      data: {
        category,
        services
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 서비스 생성 (관리자)
exports.createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);

    res.status(201).json({
      success: true,
      data: {
        service
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 서비스 수정 (관리자)
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: '서비스를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        service
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 서비스 삭제 (관리자)
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: '서비스를 찾을 수 없습니다.'
      });
    }

    // 실제로 삭제하지 않고 비활성화
    service.isActive = false;
    await service.save();

    res.status(200).json({
      success: true,
      message: '서비스가 비활성화되었습니다.'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 기본 서비스 초기화 (관리자)
exports.initializeServices = async (req, res) => {
  try {
    await Service.initializeServices();

    const services = await Service.find();

    res.status(200).json({
      success: true,
      message: '기본 서비스가 초기화되었습니다.',
      data: {
        services
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};