const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT 토큰 검증 미들웨어
exports.protect = async (req, res, next) => {
  try {
    // 1) 토큰 확인
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: '인증이 필요합니다. 로그인해주세요.'
      });
    }

    // 2) 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) 사용자 확인
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '해당 사용자를 찾을 수 없습니다.'
      });
    }

    // 4) 활성 사용자 확인
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: '비활성화된 계정입니다.'
      });
    }

    // 5) 요청에 사용자 정보 추가
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: '유효하지 않은 토큰입니다.'
    });
  }
};

// 역할 기반 권한 확인 미들웨어
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: '이 작업을 수행할 권한이 없습니다.'
      });
    }
    next();
  };
};

// 선택적 인증 미들웨어 (로그인 여부와 관계없이 진행)
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // 토큰이 유효하지 않아도 계속 진행
  }
  next();
};