const User = require('../models/User');
const Booking = require('../models/Booking');

// 프로필 조회
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('bookings', 'bookingNumber serviceDate status');

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 프로필 수정
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 주소 추가
exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.addresses) {
      user.addresses = [];
    }
    
    user.addresses.push(req.body);
    await user.save();

    res.status(200).json({
      success: true,
      data: { addresses: user.addresses }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 주소 수정
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);
    
    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '주소를 찾을 수 없습니다.'
      });
    }
    
    user.addresses[addressIndex] = { ...user.addresses[addressIndex], ...req.body };
    await user.save();

    res.status(200).json({
      success: true,
      data: { addresses: user.addresses }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 주소 삭제
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);
    
    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== addressId
    );
    
    await user.save();

    res.status(200).json({
      success: true,
      data: { addresses: user.addresses }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 즐겨찾기 청소부 목록
exports.getFavoriteCleaners = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favoriteCleaners', 'name email phone');

    res.status(200).json({
      success: true,
      data: { favoriteCleaners: user.favoriteCleaners }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 즐겨찾기 청소부 추가
exports.addFavoriteCleaner = async (req, res) => {
  try {
    const { cleanerId } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user.favoriteCleaners.includes(cleanerId)) {
      user.favoriteCleaners.push(cleanerId);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: '즐겨찾기에 추가되었습니다.'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 즐겨찾기 청소부 제거
exports.removeFavoriteCleaner = async (req, res) => {
  try {
    const { cleanerId } = req.params;
    const user = await User.findById(req.user._id);
    
    user.favoriteCleaners = user.favoriteCleaners.filter(
      id => id.toString() !== cleanerId
    );
    
    await user.save();

    res.status(200).json({
      success: true,
      message: '즐겨찾기에서 제거되었습니다.'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 포인트 내역
exports.getPointHistory = async (req, res) => {
  try {
    // 실제로는 포인트 내역 모델이 필요
    const pointHistory = [
      {
        date: new Date(),
        type: 'earn',
        amount: 1000,
        description: '첫 예약 보너스',
        balance: 1000
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        currentPoints: req.user.points || 0,
        history: pointHistory
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 추천 정보
exports.getReferralInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const referredUsers = await User.countDocuments({ referredBy: user._id });
    const referralRewards = referredUsers * 10000; // 추천당 10,000원

    res.status(200).json({
      success: true,
      data: {
        referralCode: user.referralCode || user.generateReferralCode(),
        referredCount: referredUsers,
        totalRewards: referralRewards
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 관리자: 모든 사용자 조회
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
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

// 관리자: 특정 사용자 조회
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('bookings');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 관리자: 사용자 수정
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 관리자: 사용자 삭제 (비활성화)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: '사용자가 비활성화되었습니다.'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};