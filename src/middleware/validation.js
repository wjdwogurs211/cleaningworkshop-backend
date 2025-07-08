const { body, validationResult } = require('express-validator');

// 유효성 검사 결과 처리 미들웨어
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// 회원가입 유효성 검사
exports.validateSignup = [
  body('name')
    .trim()
    .notEmpty().withMessage('이름은 필수입니다')
    .isLength({ min: 2, max: 50 }).withMessage('이름은 2-50자 사이여야 합니다'),
  body('email')
    .trim()
    .notEmpty().withMessage('이메일은 필수입니다')
    .isEmail().withMessage('올바른 이메일 형식이 아닙니다')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('비밀번호는 필수입니다')
    .isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다')
    .matches(/\d/).withMessage('비밀번호는 최소 하나의 숫자를 포함해야 합니다'),
  body('phone')
    .trim()
    .notEmpty().withMessage('전화번호는 필수입니다')
    .custom((value) => {
      // 하이픈 없는 번호도 허용하고 자동 변환
      const phoneWithoutHyphen = value.replace(/-/g, '');
      if (/^010\d{8}$/.test(phoneWithoutHyphen)) {
        return true;
      }
      return /^010-\d{4}-\d{4}$/.test(value);
    }).withMessage('올바른 전화번호 형식이 아닙니다'),
  handleValidationErrors
];

// 로그인 유효성 검사
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('이메일은 필수입니다')
    .isEmail().withMessage('올바른 이메일 형식이 아닙니다')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('비밀번호는 필수입니다'),
  handleValidationErrors
];

// 예약 유효성 검사
exports.validateBooking = [
  body('serviceId')
    .notEmpty().withMessage('서비스 선택은 필수입니다')
    .isMongoId().withMessage('올바른 서비스 ID가 아닙니다'),
  body('serviceDate')
    .notEmpty().withMessage('서비스 날짜는 필수입니다')
    .isISO8601().withMessage('올바른 날짜 형식이 아닙니다')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('과거 날짜는 선택할 수 없습니다');
      }
      return true;
    }),
  body('serviceTime')
    .notEmpty().withMessage('서비스 시간은 필수입니다')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('올바른 시간 형식이 아닙니다 (HH:MM)'),
  body('address.street')
    .trim()
    .notEmpty().withMessage('주소는 필수입니다'),
  body('paymentMethod')
    .notEmpty().withMessage('결제 방법은 필수입니다')
    .isIn(['card', 'bank_transfer', 'cash', 'kakao_pay', 'toss_pay'])
    .withMessage('올바른 결제 방법이 아닙니다'),
  handleValidationErrors
];

// 리뷰 유효성 검사
exports.validateReview = [
  body('bookingId')
    .notEmpty().withMessage('예약 ID는 필수입니다')
    .isMongoId().withMessage('올바른 예약 ID가 아닙니다'),
  body('rating.overall')
    .notEmpty().withMessage('평점은 필수입니다')
    .isInt({ min: 1, max: 5 }).withMessage('평점은 1-5 사이여야 합니다'),
  body('content')
    .trim()
    .notEmpty().withMessage('리뷰 내용은 필수입니다')
    .isLength({ min: 10, max: 500 }).withMessage('리뷰는 10-500자 사이여야 합니다'),
  handleValidationErrors
];