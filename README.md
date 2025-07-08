# 청소공작소 백엔드 API

## 개요
청소공작소 웹 애플리케이션을 위한 RESTful API 서버입니다.

## 기술 스택
- Node.js + Express.js
- MongoDB + Mongoose
- JWT 인증
- Bcrypt 암호화

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 값들을 설정합니다.

```bash
cp .env.example .env
```

### 3. MongoDB 실행
로컬에 MongoDB가 설치되어 있어야 합니다.

### 4. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## API 엔드포인트

### 인증 (Auth)
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보

### 예약 (Bookings)
- `GET /api/bookings` - 예약 목록 조회
- `POST /api/bookings` - 예약 생성
- `GET /api/bookings/:id` - 예약 상세 조회
- `PATCH /api/bookings/:id` - 예약 수정
- `PATCH /api/bookings/:id/cancel` - 예약 취소

### 서비스 (Services)
- `GET /api/services` - 서비스 목록 조회
- `GET /api/services/:id` - 서비스 상세 조회
- `GET /api/services/category/:category` - 카테고리별 서비스

### 리뷰 (Reviews)
- `GET /api/reviews` - 리뷰 목록 조회
- `POST /api/reviews` - 리뷰 작성
- `PATCH /api/reviews/:id` - 리뷰 수정
- `DELETE /api/reviews/:id` - 리뷰 삭제

### 사용자 (Users)
- `GET /api/users/profile` - 프로필 조회
- `PATCH /api/users/profile` - 프로필 수정

### 결제 (Payments)
- `POST /api/payments/request` - 결제 요청
- `POST /api/payments/confirm` - 결제 승인
- `GET /api/payments/history` - 결제 내역

## 개발자
- 솔로드 & 형제 👨‍💻👨‍💻