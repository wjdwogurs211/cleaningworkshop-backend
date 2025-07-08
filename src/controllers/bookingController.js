const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const sendEmail = require('../utils/email');

// 게스트 예약 생성 (인증 불필요)
exports.createGuestBooking = async (req, res) => {
  try {
    const {
      service,
      serviceDetails,
      date,
      time,
      customer,
      specialRequest,
      totalPrice,
      paymentMethod
    } = req.body;

    // 서비스 타입에 따른 매핑
    const serviceMap = {
      'move-in': '입주청소',
      'ac': '에어컨청소',
      'sofa': '쇼파/침구청소',
      'window': '유리창청소'
    };

    // 예약 생성
    const booking = await Booking.create({
      guestInfo: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      },
      service: service, // 실제 환경에서는 Service ID를 찾아야 함
      serviceDate: new Date(date),
      serviceTime: time,
      duration: 120, // 기본 2시간
      address: {
        street: customer.address,
        detail: customer.addressDetail
      },
      serviceDetails: {
        ...serviceDetails,
        specialRequests: specialRequest
      },
      pricing: {
        basePrice: totalPrice,
        totalPrice: totalPrice
      },
      payment: {
        method: paymentMethod === 'card' ? 'card' : 
                paymentMethod === 'transfer' ? 'bank_transfer' : 'cash'
      }
    });

    // 예약 확인 이메일 발송 (이메일이 있는 경우)
    if (customer.email) {
      try {
        await sendEmail({
          email: customer.email,
          subject: `청소공작소 예약 확인 - ${booking.bookingNumber}`,
          message: `안녕하세요 ${customer.name}님,\n\n예약이 확인되었습니다.\n예약번호: ${booking.bookingNumber}\n서비스: ${serviceMap[service]}\n일시: ${date} ${time}\n주소: ${customer.address}\n\n감사합니다.`
        });
      } catch (err) {
        console.error('이메일 발송 실패:', err);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        booking,
        bookingNumber: booking.bookingNumber
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 예약 생성
exports.createBooking = async (req, res) => {
  try {
    const {
      serviceId,
      serviceDate,
      serviceTime,
      address,
      serviceDetails,
      paymentMethod
    } = req.body;

    // 서비스 확인
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: '서비스를 찾을 수 없습니다.'
      });
    }

    // 가격 계산
    let basePrice = service.basePrice;
    if (service.priceUnit === 'per_sqm' && serviceDetails.size) {
      basePrice = service.basePrice * serviceDetails.size;
    }

    // 예약 생성
    const booking = await Booking.create({
      user: req.user._id,
      service: serviceId,
      serviceDate,
      serviceTime,
      duration: service.duration,
      address,
      serviceDetails,
      pricing: {
        basePrice,
        totalPrice: basePrice
      },
      payment: {
        method: paymentMethod
      }
    });

    // 예약 확인 이메일 발송
    try {
      await sendEmail({
        email: req.user.email,
        subject: `청소공작소 예약 확인 - ${booking.bookingNumber}`,
        message: `안녕하세요 ${req.user.name}님,\n\n예약이 확인되었습니다.\n예약번호: ${booking.bookingNumber}\n서비스: ${service.name}\n일시: ${serviceDate} ${serviceTime}\n주소: ${address.street}\n\n감사합니다.`
      });
    } catch (err) {
      console.error('이메일 발송 실패:', err);
    }

    res.status(201).json({
      success: true,
      data: {
        booking
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 예약 목록 조회
exports.getBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { user: req.user._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('service', 'name category')
      .populate('cleaner', 'name phone')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        bookings,
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

// 특정 예약 조회
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service')
      .populate('user', 'name email phone')
      .populate('cleaner', 'name phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: '예약을 찾을 수 없습니다.'
      });
    }

    // 권한 확인 (본인 또는 관리자)
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '이 예약을 볼 권한이 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        booking
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 예약 수정
exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: '예약을 찾을 수 없습니다.'
      });
    }

    // 권한 확인
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '이 예약을 수정할 권한이 없습니다.'
      });
    }

    // 완료되거나 취소된 예약은 수정 불가
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: '완료되거나 취소된 예약은 수정할 수 없습니다.'
      });
    }

    const { serviceDate, serviceTime, address, serviceDetails } = req.body;

    if (serviceDate) booking.serviceDate = serviceDate;
    if (serviceTime) booking.serviceTime = serviceTime;
    if (address) booking.address = address;
    if (serviceDetails) booking.serviceDetails = serviceDetails;

    await booking.save();

    res.status(200).json({
      success: true,
      data: {
        booking
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 예약 취소
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: '예약을 찾을 수 없습니다.'
      });
    }

    // 권한 확인
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '이 예약을 취소할 권한이 없습니다.'
      });
    }

    // 이미 취소되거나 완료된 예약
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: '이미 완료되거나 취소된 예약입니다.'
      });
    }

    // 24시간 이내 예약은 취소 불가
    const hoursDiff = (new Date(booking.serviceDate) - new Date()) / (1000 * 60 * 60);
    if (hoursDiff < 24) {
      return res.status(400).json({
        success: false,
        error: '서비스 24시간 전에는 취소할 수 없습니다.'
      });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = Date.now();
    booking.cancelReason = req.body.reason || '고객 요청';
    
    await booking.save();

    // 취소 이메일 발송
    const user = await User.findById(booking.user);
    try {
      await sendEmail({
        email: user.email,
        subject: `예약 취소 확인 - ${booking.bookingNumber}`,
        message: `예약이 취소되었습니다.\n예약번호: ${booking.bookingNumber}\n취소 사유: ${booking.cancelReason}`
      });
    } catch (err) {
      console.error('이메일 발송 실패:', err);
    }

    res.status(200).json({
      success: true,
      data: {
        booking
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 예약 상태 변경 (관리자/청소부)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: '예약을 찾을 수 없습니다.'
      });
    }

    await booking.updateStatus(status, req.user._id);

    res.status(200).json({
      success: true,
      data: {
        booking
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 가능한 시간대 조회
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.params;
    const { serviceId } = req.query;

    // 해당 날짜의 모든 예약 조회
    const bookings = await Booking.find({
      serviceDate: new Date(date),
      status: { $nin: ['cancelled'] }
    });

    // 가능한 시간대 계산 (9:00 - 18:00)
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const isBooked = bookings.some(booking => booking.serviceTime === time);
      
      slots.push({
        time,
        available: !isBooked
      });
    }

    res.status(200).json({
      success: true,
      data: {
        date,
        slots
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 예약 가능 여부 확인
exports.checkAvailability = async (req, res) => {
  try {
    const { serviceId, serviceDate, serviceTime } = req.body;

    const existingBooking = await Booking.findOne({
      service: serviceId,
      serviceDate: new Date(serviceDate),
      serviceTime,
      status: { $nin: ['cancelled'] }
    });

    res.status(200).json({
      success: true,
      data: {
        available: !existingBooking
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 전체 예약 조회 (관리자)
exports.getAllBookings = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (startDate && endDate) {
      query.serviceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('service', 'name')
      .populate('cleaner', 'name')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalBookings: count
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 예약 통계 (관리자)
exports.getBookingStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Booking.aggregate([
      {
        $facet: {
          todayBookings: [
            { $match: { serviceDate: { $gte: today } } },
            { $count: 'count' }
          ],
          statusCounts: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          monthlyRevenue: [
            {
              $match: {
                'payment.status': 'completed',
                createdAt: {
                  $gte: new Date(today.getFullYear(), today.getMonth(), 1)
                }
              }
            },
            { $group: { _id: null, total: { $sum: '$pricing.totalPrice' } } }
          ],
          servicePopularity: [
            { $group: { _id: '$service', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: 'services',
                localField: '_id',
                foreignField: '_id',
                as: 'service'
              }
            }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};