const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cleaner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  content: {
    type: String,
    required: true,
    minlength: [10, '리뷰는 최소 10자 이상 작성해주세요'],
    maxlength: [500, '리뷰는 500자를 초과할 수 없습니다']
  },
  images: [{
    url: String,
    caption: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  adminResponse: {
    content: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  isHidden: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 리뷰 작성 시 평균 평점 계산
reviewSchema.post('save', async function() {
  const Review = this.constructor;
  const Cleaner = mongoose.model('User');
  
  if (this.cleaner) {
    const reviews = await Review.find({ cleaner: this.cleaner, isHidden: false });
    const avgRating = reviews.reduce((sum, review) => sum + review.rating.overall, 0) / reviews.length;
    
    await Cleaner.findByIdAndUpdate(this.cleaner, {
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    });
  }
});

// 도움이 됐어요 토글
reviewSchema.methods.toggleHelpful = async function(userId) {
  const userIndex = this.helpfulUsers.indexOf(userId);
  
  if (userIndex > -1) {
    this.helpfulUsers.splice(userIndex, 1);
    this.helpfulCount = Math.max(0, this.helpfulCount - 1);
  } else {
    this.helpfulUsers.push(userId);
    this.helpfulCount += 1;
  }
  
  return this.save();
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;