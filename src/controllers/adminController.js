const User = require('../models/User');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Review = require('../models/Review');

// 대시보드 통계
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // 오늘의 통계
    const todayStats = await Promise.all([
      // 오늘 예약 수
      Booking.countDocuments({
        serviceDate: { $gte: today, $lt: tomorrow }
      }),
      // 오늘 완료된 예약
      Booking.countDocuments({
        serviceDate: { $gte: today, $lt: tomorrow },
        status: 'completed'
      }),
      // 오늘 신규 회원
      User.countDocuments({
        createdAt: { $gte: today }
      }),
      // 오늘 매출
      Booking.aggregate([
        {
          $match: {
            'payment.paidAt': { $gte: today, $lt: tomorrow },
            'payment.status': 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$pricing.totalPrice' }
          }
        }
      ])
    ]);

    // 이번 달 통계
    const monthlyStats = await Promise.all([
      // 월 총 예약
      Booking.countDocuments({
        createdAt: { $gte: thisMonth, $lt: nextMonth }
      }),
      // 월 매출
      Booking.aggregate([
        {
          $match: {
            'payment.paidAt': { $gte: thisMonth, $lt: nextMonth },
            'payment.status': 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$pricing.totalPrice' }
          }
        }
      ]),
      // 월 신규 회원
      User.countDocuments({
        createdAt: { $gte: thisMonth, $lt: nextMonth }
      })
    ]);

    // 예약 상태별 통계
    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // 인기 서비스 TOP 5
    const popularServices = await Booking.aggregate([
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      { $unwind: '$service' },
      {
        $project: {
          name: '$service.name',
          count: 1
        }
      }
    ]);

    // 최근 예약 5건
    const recentBookings = await Booking.find()
      .populate('user', 'name')
      .populate('service', 'name')
      .sort('-createdAt')
      .limit(5)
      .select('bookingNumber user service serviceDate status createdAt');

    // 평균 평점
    const avgRating = await Review.aggregate([
      { $match: { isHidden: false } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating.overall' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        today: {
          bookings: todayStats[0],
          completed: todayStats[1],
          newUsers: todayStats[2],
          revenue: todayStats[3][0]?.total || 0
        },
        monthly: {
          bookings: monthlyStats[0],
          revenue: monthlyStats[1][0]?.total || 0,
          newUsers: monthlyStats[2]
        },
        bookingsByStatus,
        popularServices,
        recentBookings,
        averageRating: avgRating[0]?.avgRating || 0
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 매출 통계
exports.getRevenueStats = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let groupFormat;
    switch (groupBy) {
      case 'day':
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$payment.paidAt' } };
        break;
      case 'week':
        groupFormat = { $week: '$payment.paidAt' };
        break;
      case 'month':
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$payment.paidAt' } };
        break;
      default:
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$payment.paidAt' } };
    }

    const revenueData = await Booking.aggregate([
      {
        $match: {
          'payment.paidAt': { $gte: start, $lte: end },
          'payment.status': 'completed'
        }
      },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$pricing.totalPrice' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 서비스별 매출
    const revenueByService = await Booking.aggregate([
      {
        $match: {
          'payment.paidAt': { $gte: start, $lte: end },
          'payment.status': 'completed'
        }
      },
      {
        $group: {
          _id: '$service',
          revenue: { $sum: '$pricing.totalPrice' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      { $unwind: '$service' },
      {
        $project: {
          name: '$service.name',
          revenue: 1,
          count: 1
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: { start, end },
        revenueData,
        revenueByService,
        totalRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0),
        totalBookings: revenueData.reduce((sum, item) => sum + item.count, 0)
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 예약 통계
exports.getBookingStats = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // 일별 예약 추이
    const dailyBookings = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 시간대별 예약 패턴
    const bookingsByHour = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 요일별 예약 패턴
    const bookingsByDayOfWeek = await Booking.aggregate([
      {
        $match: {
          serviceDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$serviceDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: { start: startDate, end: new Date() },
        dailyBookings,
        bookingsByHour,
        bookingsByDayOfWeek
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 사용자 통계
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    // 사용자 증가 추이 (최근 30일)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 사용자별 예약 통계
    const userBookingStats = await Booking.aggregate([
      {
        $group: {
          _id: '$user',
          bookingCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [
                { $eq: ['$payment.status', 'completed'] },
                '$pricing.totalPrice',
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          bookingCount: 1,
          totalSpent: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total: totalUsers,
          active: activeUsers,
          verified: verifiedUsers,
          verificationRate: (verifiedUsers / totalUsers * 100).toFixed(1)
        },
        userGrowth,
        topUsers: userBookingStats
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 서비스 통계
exports.getServiceStats = async (req, res) => {
  try {
    const services = await Service.find().lean();
    
    // 서비스별 예약 통계
    const serviceStats = await Promise.all(
      services.map(async (service) => {
        const stats = await Booking.aggregate([
          { $match: { service: service._id } },
          {
            $group: {
              _id: null,
              totalBookings: { $sum: 1 },
              completedBookings: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              totalRevenue: {
                $sum: {
                  $cond: [
                    { $eq: ['$payment.status', 'completed'] },
                    '$pricing.totalPrice',
                    0
                  ]
                }
              }
            }
          }
        ]);

        const reviews = await Review.aggregate([
          { $match: { service: service._id, isHidden: false } },
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$rating.overall' },
              reviewCount: { $sum: 1 }
            }
          }
        ]);

        return {
          ...service,
          stats: stats[0] || { totalBookings: 0, completedBookings: 0, totalRevenue: 0 },
          reviews: reviews[0] || { avgRating: 0, reviewCount: 0 }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        services: serviceStats
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 청소부 관리
exports.getAllCleaners = async (req, res) => {
  try {
    const cleaners = await User.find({ role: 'cleaner' })
      .select('-password')
      .lean();

    // 각 청소부의 통계 추가
    const cleanersWithStats = await Promise.all(
      cleaners.map(async (cleaner) => {
        const stats = await Booking.aggregate([
          { $match: { cleaner: cleaner._id } },
          {
            $group: {
              _id: null,
              totalJobs: { $sum: 1 },
              completedJobs: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              }
            }
          }
        ]);

        const avgRating = await Review.aggregate([
          { $match: { cleaner: cleaner._id } },
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$rating.overall' },
              reviewCount: { $sum: 1 }
            }
          }
        ]);

        return {
          ...cleaner,
          stats: stats[0] || { totalJobs: 0, completedJobs: 0 },
          rating: avgRating[0] || { avgRating: 0, reviewCount: 0 }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        cleaners: cleanersWithStats
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 청소부 생성
exports.createCleaner = async (req, res) => {
  try {
    const cleanerData = {
      ...req.body,
      role: 'cleaner',
      isVerified: true
    };

    const cleaner = await User.create(cleanerData);

    res.status(201).json({
      success: true,
      data: {
        cleaner: {
          _id: cleaner._id,
          name: cleaner.name,
          email: cleaner.email,
          phone: cleaner.phone,
          role: cleaner.role
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 청소부 수정
exports.updateCleaner = async (req, res) => {
  try {
    const cleaner = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!cleaner) {
      return res.status(404).json({
        success: false,
        error: '청소부를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: { cleaner }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 청소부 스케줄 조회
exports.getCleanerSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const query = {
      cleaner: id,
      serviceDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const schedule = await Booking.find(query)
      .populate('service', 'name duration')
      .populate('user', 'name phone')
      .sort('serviceDate serviceTime');

    res.status(200).json({
      success: true,
      data: { schedule }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 시스템 설정
exports.getSettings = async (req, res) => {
  try {
    // 실제로는 DB에서 가져와야 함
    const settings = {
      business: {
        name: '청소공작소',
        phone: '02-1234-5678',
        email: 'info@cleaninglab.co.kr',
        address: '서울시 강남구 테헤란로 123'
      },
      operation: {
        startTime: '09:00',
        endTime: '18:00',
        workDays: [1, 2, 3, 4, 5, 6], // 월-토
        holidays: []
      },
      pricing: {
        minimumCharge: 50000,
        cancellationFee: 10000,
        urgentServiceRate: 1.5
      },
      notification: {
        emailEnabled: true,
        smsEnabled: true,
        kakaoEnabled: true
      }
    };

    res.status(200).json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 시스템 설정 업데이트
exports.updateSettings = async (req, res) => {
  try {
    // 실제로는 DB에 저장해야 함
    const updatedSettings = req.body;

    res.status(200).json({
      success: true,
      message: '설정이 업데이트되었습니다.',
      data: { settings: updatedSettings }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 시스템 로그
exports.getSystemLogs = async (req, res) => {
  try {
    // 실제로는 로그 시스템에서 가져와야 함
    const logs = [
      {
        timestamp: new Date(),
        level: 'info',
        message: '관리자 로그인',
        user: 'admin@cleaninglab.co.kr'
      },
      {
        timestamp: new Date(Date.now() - 60000),
        level: 'warning',
        message: '결제 실패',
        details: 'Card declined'
      }
    ];

    res.status(200).json({
      success: true,
      data: { logs }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};