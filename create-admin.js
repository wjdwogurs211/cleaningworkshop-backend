// 관리자 계정 생성 스크립트
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

async function createAdmin() {
    try {
        // MongoDB 연결
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB 연결 성공');

        // 관리자 계정 정보
        const adminData = {
            name: '청소공작소 관리자',
            email: 'admin@cleaningworkshop.co.kr',
            password: 'admin123!@#',
            phone: '010-0000-0000',
            role: 'admin',
            isEmailVerified: true
        };

        // 기존 관리자 확인
        const existingAdmin = await User.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log('⚠️ 관리자 계정이 이미 존재합니다');
            return;
        }

        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(adminData.password, 10);
        adminData.password = hashedPassword;

        // 관리자 생성
        const admin = new User(adminData);
        await admin.save();

        console.log('✅ 관리자 계정 생성 완료!');
        console.log('📧 이메일:', adminData.email);
        console.log('🔑 비밀번호: admin123!@#');
        
    } catch (error) {
        console.error('❌ 에러:', error);
    } finally {
        await mongoose.connection.close();
    }
}

createAdmin();