const Review = require('../models/Review');
const Booking = require('../models/Booking');

// 리뷰 생성
exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, content, images } = req.body;

    // 예약 확인
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: '예약을 찾을 수 없습니다.'
      });
    }

    // 본인 예약인지 확인
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: '본인의 예약에만 리뷰를 작성할 수 있습니다.'
      });
    }

    // 완료된 예약인지 확인
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: '완료된 예약에만 리뷰를 작성할 수 있습니다.'
      });
    }

    // 이미 리뷰가 있는지 확인
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: '이미 리뷰를 작성하셨습니다.'
      });
    }

    // 리뷰 생성
    const review = await Review.create({
      booking: bookingId,
      user: req.user._id,
      cleaner: booking.cleaner,
      service: booking.service,
      rating,
      content,
      images
    });

    // 예약에 리뷰 연결
    booking.review = review._id;
    await booking.save();

    res.status(201).json({
      success: true,
      data: {
        review
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 모든 리뷰 조회
exports.getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating, sort = '-createdAt' } = req.query;
    
    const query = { isHidden: false };
    if (rating) query['rating.overall'] = parseInt(rating);

    const reviews = await Review.find(query)
      .populate('user', 'name')
      .populate('service', 'name')
      .populate('cleaner', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 서비스별 리뷰 조회
exports.getServiceReviews = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ 
      service: serviceId,
      isHidden: false 
    })
      .populate('user', 'name')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Review.countDocuments({ 
      service: serviceId,
      isHidden: false 
    });

    // 평균 평점 계산
    const stats = await Review.aggregate([
      { $match: { service: serviceId, isHidden: false } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating.overall' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating.overall'
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        stats: stats[0] || { avgRating: 0, totalReviews: 0 },
        totalPages: Math.ceil(count / limit),
        currentPage: page
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 특정 리뷰 조회
exports.getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'name')
      .populate('service', 'name')
      .populate('cleaner', 'name')
      .populate('booking', 'bookingNumber serviceDate');

    if (!review || review.isHidden) {
      return res.status(404).json({
        success: false,
        error: '리뷰를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        review
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 리뷰 수정
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: '리뷰를 찾을 수 없습니다.'
      });
    }

    // 본인 리뷰인지 확인
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: '본인의 리뷰만 수정할 수 있습니다.'
      });
    }

    // 7일 이내만 수정 가능
    const daysSinceCreation = (Date.now() - review.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 7) {
      return res.status(400).json({
        success: false,
        error: '리뷰는 작성 후 7일 이내에만 수정할 수 있습니다.'
      });
    }

    const { rating, content, images } = req.body;
    if (rating) review.rating = rating;
    if (content) review.content = content;
    if (images) review.images = images;

    await review.save();

    res.status(200).json({
      success: true,
      data: {
        review
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 리뷰 삭제
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: '리뷰를 찾을 수 없습니다.'
      });
    }

    // 본인 리뷰이거나 관리자인지 확인
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '이 리뷰를 삭제할 권한이 없습니다.'
      });
    }

    await review.remove();

    res.status(200).json({
      success: true,
      message: '리뷰가 삭제되었습니다.'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 도움이 됐어요 토글
exports.toggleHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: '리뷰를 찾을 수 없습니다.'
      });
    }

    await review.toggleHelpful(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        helpfulCount: review.helpfulCount,
        isHelpful: review.helpfulUsers.includes(req.user._id)
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 관리자 답변 추가
exports.addAdminResponse = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: '리뷰를 찾을 수 없습니다.'
      });
    }

    review.adminResponse = {
      content: req.body.content,
      respondedAt: Date.now(),
      respondedBy: req.user._id
    };

    await review.save();

    res.status(200).json({
      success: true,
      data: {
        review
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 리뷰 숨김/표시 토글
exports.toggleHideReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: '리뷰를 찾을 수 없습니다.'
      });
    }

    review.isHidden = !review.isHidden;
    await review.save();

    res.status(200).json({
      success: true,
      data: {
        review,
        message: review.isHidden ? '리뷰가 숨겨졌습니다.' : '리뷰가 표시됩니다.'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};