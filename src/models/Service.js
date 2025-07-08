const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '서비스명은 필수입니다'],
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['home', 'office', 'special', 'add-on'],
    default: 'home'
  },
  description: {
    type: String,
    required: true
  },
  basePrice: {
    type: Number,
    required: [true, '기본 가격은 필수입니다'],
    min: [0, '가격은 0원 이상이어야 합니다']
  },
  priceUnit: {
    type: String,
    enum: ['per_sqm', 'per_item', 'per_hour', 'fixed'],
    default: 'fixed'
  },
  duration: {
    type: Number, // 분 단위
    required: true,
    default: 120
  },
  features: [{
    type: String
  }],
  options: [{
    name: String,
    price: Number,
    description: String
  }],
  imageUrl: String,
  isActive: {
    type: Boolean,
    default: true
  },
  minSize: Number, // 최소 평수 (평방미터)
  maxSize: Number, // 최대 평수
  availability: {
    days: [{
      type: Number, // 0: 일요일, 1: 월요일, ..., 6: 토요일
      min: 0,
      max: 6
    }],
    startTime: String, // "09:00"
    endTime: String    // "18:00"
  },
  requiredEquipment: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  popularity: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 서비스별 기본 데이터 초기화
serviceSchema.statics.initializeServices = async function() {
  const services = [
    {
      name: '입주청소',
      category: 'home',
      description: '새 집으로 이사할 때 필요한 전문 청소 서비스',
      basePrice: 400000,
      priceUnit: 'per_sqm',
      duration: 240,
      features: ['전체 실내 청소', '주방 기름때 제거', '화장실 곰팡이 제거', '창문 청소'],
      options: [
        { name: '베란다 확장', price: 50000, description: '베란다 추가 청소' },
        { name: '복층', price: 100000, description: '복층 구조 추가 요금' },
        { name: '곰팡이 특수 제거', price: 80000, description: '심한 곰팡이 특수 처리' }
      ]
    },
    {
      name: '에어컨 청소',
      category: 'special',
      description: '에어컨 분해 청소 전문 서비스',
      basePrice: 80000,
      priceUnit: 'per_item',
      duration: 60,
      features: ['완전 분해 청소', '필터 교체', '냄새 제거', '살균 소독'],
      options: [
        { name: '실외기 청소', price: 30000, description: '실외기 추가 청소' },
        { name: '천장형', price: 20000, description: '천장형 에어컨 추가 요금' }
      ]
    },
    {
      name: '쇼파 청소',
      category: 'special',
      description: '전문 장비를 이용한 쇼파 청소',
      basePrice: 60000,
      priceUnit: 'per_item',
      duration: 90,
      features: ['얼룩 제거', '진드기 제거', '살균 소독', '섬유 보호 코팅']
    },
    {
      name: '유리창 청소',
      category: 'special',
      description: '고층 건물 유리창 전문 청소',
      basePrice: 30000,
      priceUnit: 'per_item',
      duration: 30,
      features: ['실내외 유리창 청소', '창틀 청소', '방충망 청소']
    }
  ];

  for (const service of services) {
    await this.findOneAndUpdate(
      { name: service.name },
      service,
      { upsert: true, new: true }
    );
  }
};

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;