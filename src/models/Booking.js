const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // 게스트 예약 허용
  },
  // 게스트 예약시 고객 정보
  guestInfo: {
    name: String,
    phone: String,
    email: String
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  cleaner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  serviceDate: {
    type: Date,
    required: true
  },
  serviceTime: {
    type: String,
    required: true // "14:00" 형식
  },
  duration: {
    type: Number, // 분 단위
    required: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    detail: String,
    zipCode: String
  },
  serviceDetails: {
    size: Number, // 평수
    options: [{
      name: String,
      price: Number
    }],
    specialRequests: String
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    optionsPrice: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    totalPrice: {
      type: Number,
      required: true
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['card', 'bank_transfer', 'cash', 'kakao_pay', 'toss_pay'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },
  cancelledAt: Date,
  cancelReason: String,
  completedAt: Date,
  notes: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// 예약 번호 생성
bookingSchema.pre('save', async function(next) {
  if (!this.bookingNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    this.bookingNumber = `CL${year}${month}${day}${random}`;
  }
  next();
});

// 총 가격 계산
bookingSchema.pre('save', function(next) {
  const optionsPrice = this.serviceDetails.options.reduce((sum, option) => sum + option.price, 0);
  this.pricing.optionsPrice = optionsPrice;
  this.pricing.totalPrice = this.pricing.basePrice + optionsPrice - this.pricing.discount;
  next();
});

// 상태 변경 메서드
bookingSchema.methods.updateStatus = async function(newStatus, userId) {
  this.status = newStatus;
  
  if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
  } else if (newStatus === 'completed') {
    this.completedAt = new Date();
  }
  
  // 상태 변경 기록
  this.notes.push({
    author: userId,
    content: `예약 상태가 ${newStatus}로 변경되었습니다.`
  });
  
  return this.save();
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;