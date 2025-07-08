const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/email');

// JWT 토큰 생성
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// 토큰과 함께 응답 전송
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res.cookie('jwt', token, cookieOptions);

  // 비밀번호 제거
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user
    }
  });
};

// 회원가입
exports.signup = async (req, res) => {
  try {
    let { name, email, password, phone, address } = req.body;
    
    // 전화번호 형식 자동 변환
    if (phone && phone.length === 11 && phone.startsWith('010')) {
      phone = phone.slice(0, 3) + '-' + phone.slice(3, 7) + '-' + phone.slice(7);
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '이미 등록된 이메일입니다.'
      });
    }

    // 사용자 생성
    const newUser = await User.create({
      name,
      email,
      password,
      phone,
      address
    });

    // 추천 코드 생성
    newUser.generateReferralCode();
    await newUser.save();

    // 이메일 인증 토큰 생성
    const verifyToken = crypto.randomBytes(32).toString('hex');
    newUser.verificationToken = crypto
      .createHash('sha256')
      .update(verifyToken)
      .digest('hex');
    await newUser.save({ validateBeforeSave: false });

    // 인증 이메일 발송
    try {
      const verifyURL = `${req.protocol}://${req.get('host')}/api/auth/verify/${verifyToken}`;
      await sendEmail({
        email: newUser.email,
        subject: '청소공작소 이메일 인증',
        message: `안녕하세요 ${newUser.name}님,\n\n아래 링크를 클릭하여 이메일을 인증해주세요:\n${verifyURL}\n\n감사합니다.`
      });
    } catch (err) {
      console.error('이메일 발송 실패:', err);
    }

    createSendToken(newUser, 201, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 이메일과 비밀번호 확인
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '이메일과 비밀번호를 입력해주세요.'
      });
    }

    // 사용자 찾기
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 마지막 로그인 시간 업데이트
    user.lastLoginAt = Date.now();
    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 로그아웃
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    message: '로그아웃되었습니다.'
  });
};

// 토큰 갱신
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: '리프레시 토큰이 필요합니다.'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }

    createSendToken(user, 200, res);
  } catch (error) {
    res.status(401).json({
      success: false,
      error: '유효하지 않은 토큰입니다.'
    });
  }
};

// 이메일 인증
exports.verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({ verificationToken: hashedToken });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 인증 토큰입니다.'
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: '이메일 인증이 완료되었습니다.'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 비밀번호 재설정 요청
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '해당 이메일로 등록된 사용자가 없습니다.'
      });
    }

    // 재설정 토큰 생성
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10분

    await user.save({ validateBeforeSave: false });

    // 재설정 이메일 발송
    try {
      const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
      await sendEmail({
        email: user.email,
        subject: '청소공작소 비밀번호 재설정',
        message: `비밀번호를 재설정하려면 아래 링크를 클릭하세요:\n${resetURL}\n\n이 링크는 10분 동안만 유효합니다.`
      });

      res.status(200).json({
        success: true,
        message: '비밀번호 재설정 이메일을 발송했습니다.'
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        error: '이메일 발송에 실패했습니다.'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 비밀번호 재설정
exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: '토큰이 유효하지 않거나 만료되었습니다.'
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 현재 사용자 정보
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
};

// 비밀번호 변경
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // 현재 비밀번호 확인
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        error: '현재 비밀번호가 올바르지 않습니다.'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};