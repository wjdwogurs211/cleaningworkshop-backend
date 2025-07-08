const axios = require('axios');
const Booking = require('../models/Booking');
const crypto = require('crypto');

// 토스페이먼츠 API URL
const TOSS_API_URL = 'https://api.tosspayments.com/v1';

// 토스페이먼츠 API 헤더
const getTossHeaders = () => {
  const secretKey = process.env.TOSS_SECRET_KEY;
  const encodedKey = Buffer.from(secretKey + ':').toString('base64');
  
  return {
    'Authorization': `Basic ${encodedKey}`,
    'Content-Type': 'application/json'
  };
};

// 결제 요청
exports.createPayment = async (req, res) => {
  try {
    const { bookingId, paymentMethod, successUrl, failUrl } = req.body;

    // 예약 정보 조회
    const booking = await Booking.findById(bookingId).populate('service');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: '예약을 찾을 수 없습니다.'
      });
    }

    // 권한 확인
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: '본인의 예약만 결제할 수 있습니다.'
      });
    }

    // 이미 결제된 예약인지 확인
    if (booking.payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: '이미 결제가 완료된 예약입니다.'
      });
    }

    // 주문 ID 생성 (예약번호 사용)
    const orderId = booking.bookingNumber;
    const orderName = `${booking.service.name} - ${booking.bookingNumber}`;
    const amount = booking.pricing.totalPrice;

    // 결제 요청 데이터
    const paymentData = {
      amount,
      orderId,
      orderName,
      successUrl: successUrl || `${process.env.CLIENT_URL}/booking-complete.html?bookingId=${bookingId}`,
      failUrl: failUrl || `${process.env.CLIENT_URL}/booking.html?error=payment_failed`
    };

    // 결제 방법별 처리
    let paymentResponse;
    
    if (paymentMethod === 'card') {
      // 카드 결제
      paymentResponse = await axios.post(
        `${TOSS_API_URL}/payments`,
        {
          ...paymentData,
          method: 'card'
        },
        { headers: getTossHeaders() }
      );
    } else if (paymentMethod === 'toss_pay') {
      // 토스페이 결제
      paymentResponse = await axios.post(
        `${TOSS_API_URL}/payments`,
        {
          ...paymentData,
          method: 'tosspay'
        },
        { headers: getTossHeaders() }
      );
    } else if (paymentMethod === 'kakao_pay') {
      // 카카오페이는 별도 구현 필요
      return res.status(400).json({
        success: false,
        error: '카카오페이는 준비중입니다.'
      });
    }

    // 결제 정보 저장
    booking.payment.transactionId = paymentResponse.data.paymentKey;
    await booking.save();

    res.status(200).json({
      success: true,
      data: {
        paymentKey: paymentResponse.data.paymentKey,
        orderId: paymentResponse.data.orderId,
        checkoutUrl: paymentResponse.data.checkout?.url || paymentResponse.data.receipt?.url
      }
    });
  } catch (error) {
    console.error('결제 요청 오류:', error.response?.data || error);
    res.status(400).json({
      success: false,
      error: error.response?.data?.message || error.message
    });
  }
};

// 결제 승인
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentKey, orderId, amount } = req.body;

    // 예약 확인
    const booking = await Booking.findOne({ bookingNumber: orderId });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: '예약을 찾을 수 없습니다.'
      });
    }

    // 금액 검증
    if (booking.pricing.totalPrice !== amount) {
      return res.status(400).json({
        success: false,
        error: '결제 금액이 일치하지 않습니다.'
      });
    }

    // 토스페이먼츠 결제 승인 API 호출
    const confirmResponse = await axios.post(
      `${TOSS_API_URL}/payments/${paymentKey}`,
      {
        orderId,
        amount
      },
      { headers: getTossHeaders() }
    );

    // 결제 완료 처리
    booking.payment.status = 'completed';
    booking.payment.paidAt = new Date();
    booking.payment.transactionId = paymentKey;
    booking.status = 'confirmed';
    
    await booking.save();

    res.status(200).json({
      success: true,
      data: {
        booking,
        payment: confirmResponse.data
      }
    });
  } catch (error) {
    console.error('결제 승인 오류:', error.response?.data || error);
    res.status(400).json({
      success: false,
      error: error.response?.data?.message || error.message
    });
  }
};

// 결제 취소
exports.cancelPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    // 예약 조회
    const booking = await Booking.findOne({ 'payment.transactionId': paymentId });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: '결제 정보를 찾을 수 없습니다.'
      });
    }

    // 권한 확인
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '결제를 취소할 권한이 없습니다.'
      });
    }

    // 토스페이먼츠 결제 취소 API 호출
    const cancelResponse = await axios.post(
      `${TOSS_API_URL}/payments/${paymentId}/cancel`,
      {
        cancelReason: reason || '고객 요청'
      },
      { headers: getTossHeaders() }
    );

    // 결제 취소 처리
    booking.payment.status = 'refunded';
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelReason = reason || '결제 취소';
    
    await booking.save();

    res.status(200).json({
      success: true,
      data: {
        booking,
        refund: cancelResponse.data
      }
    });
  } catch (error) {
    console.error('결제 취소 오류:', error.response?.data || error);
    res.status(400).json({
      success: false,
      error: error.response?.data?.message || error.message
    });
  }
};

// 결제 내역 조회
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const bookings = await Booking.find({
      user: req.user._id,
      'payment.status': { $in: ['completed', 'refunded'] }
    })
      .populate('service', 'name')
      .sort('-payment.paidAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Booking.countDocuments({
      user: req.user._id,
      'payment.status': { $in: ['completed', 'refunded'] }
    });

    const payments = bookings.map(booking => ({
      id: booking._id,
      bookingNumber: booking.bookingNumber,
      serviceName: booking.service.name,
      amount: booking.pricing.totalPrice,
      paymentMethod: booking.payment.method,
      paymentStatus: booking.payment.status,
      paidAt: booking.payment.paidAt,
      transactionId: booking.payment.transactionId
    }));

    res.status(200).json({
      success: true,
      data: {
        payments,
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

// 결제 상세 조회
exports.getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const booking = await Booking.findOne({ 'payment.transactionId': paymentId })
      .populate('service')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: '결제 정보를 찾을 수 없습니다.'
      });
    }

    // 권한 확인
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '이 결제 정보를 볼 권한이 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        payment: {
          transactionId: booking.payment.transactionId,
          method: booking.payment.method,
          status: booking.payment.status,
          amount: booking.pricing.totalPrice,
          paidAt: booking.payment.paidAt
        },
        booking: {
          bookingNumber: booking.bookingNumber,
          serviceName: booking.service.name,
          serviceDate: booking.serviceDate,
          serviceTime: booking.serviceTime,
          status: booking.status
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

// 웹훅 처리 (토스페이먼츠)
exports.handleTossWebhook = async (req, res) => {
  try {
    const { eventType, paymentKey, orderId, status } = req.body;

    // 웹훅 서명 검증 (프로덕션에서는 필수)
    // const signature = req.headers['toss-signature'];
    // const isValid = verifyWebhookSignature(req.body, signature);
    
    console.log('토스페이먼츠 웹훅 수신:', eventType, status);

    if (eventType === 'PAYMENT_STATUS_CHANGED') {
      const booking = await Booking.findOne({ bookingNumber: orderId });
      
      if (booking) {
        if (status === 'DONE') {
          booking.payment.status = 'completed';
          booking.status = 'confirmed';
        } else if (status === 'CANCELED') {
          booking.payment.status = 'refunded';
          booking.status = 'cancelled';
        } else if (status === 'FAILED') {
          booking.payment.status = 'failed';
        }
        
        await booking.save();
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};