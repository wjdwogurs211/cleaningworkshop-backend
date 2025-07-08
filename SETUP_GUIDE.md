# 청소공작소 백엔드 설치 가이드

## 1. MongoDB 설치

### Windows
1. [MongoDB 다운로드 페이지](https://www.mongodb.com/try/download/community) 접속
2. Windows용 MongoDB Community Server 다운로드
3. 설치 과정:
   - "Complete" 설치 선택
   - "Install MongoDB as a Service" 체크
   - 설치 완료 후 자동으로 서비스 시작됨

### 설치 확인
```bash
# MongoDB 버전 확인
mongod --version

# MongoDB 서비스 상태 확인 (Windows)
sc query MongoDB
```

## 2. 프로젝트 초기 설정

### 1) 환경변수 설정
```bash
# .env 파일 생성
cp .env.example .env
```

`.env` 파일 편집:
```env
# 서버 설정
PORT=5000
NODE_ENV=development

# 데이터베이스
MONGODB_URI=mongodb://localhost:27017/cleaninglab

# JWT 설정 (보안을 위해 복잡한 키 사용)
JWT_SECRET=your_super_secret_key_change_this_in_production_2024
JWT_EXPIRES_IN=7d

# 이메일 설정 (Gmail 예시)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_cleaninglab_email@gmail.com
EMAIL_PASS=your_app_specific_password

# 토스페이먼츠 설정 (테스트 키)
TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
TOSS_SECRET_KEY=test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R

# CORS 설정
CLIENT_URL=http://localhost:8000

# 파일 업로드
MAX_FILE_SIZE=5242880
```

### 2) Gmail 앱 비밀번호 생성 (이메일 발송용)
1. Google 계정 설정 → 보안
2. 2단계 인증 활성화
3. 앱 비밀번호 생성
4. 생성된 비밀번호를 EMAIL_PASS에 입력

### 3) 패키지 설치
```bash
cd backend
npm install
```

### 4) 서버 실행
```bash
# 개발 모드 (자동 재시작)
npm run dev

# 또는 배치 파일 실행
start-backend.bat
```

## 3. 초기 데이터 설정

### 서버 실행 후 API 호출로 기본 서비스 초기화
```bash
# PowerShell 또는 Git Bash에서
curl -X POST http://localhost:5000/api/services/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 4. 프론트엔드 연동

### 1) 프론트엔드 서버 실행
```bash
# 프로젝트 루트에서
python3 start_server.py

# 또는 배치 파일
서버실행.bat
```

### 2) 브라우저에서 접속
- 프론트엔드: http://localhost:8000
- 백엔드 API: http://localhost:5000/api

## 5. 테스트 계정 생성

브라우저 콘솔에서:
```javascript
// 회원가입
await CleaningLabAPI.auth.signup({
  name: "테스트 사용자",
  email: "test@example.com",
  password: "password123",
  phone: "010-1234-5678",
  address: {
    street: "서울시 강남구 테헤란로 123",
    detail: "456호"
  }
});

// 로그인
await CleaningLabAPI.auth.login("test@example.com", "password123");
```

## 문제 해결

### MongoDB 연결 실패
- MongoDB 서비스가 실행중인지 확인
- 방화벽에서 27017 포트 허용
- `mongod` 명령으로 수동 실행 시도

### CORS 오류
- `.env`의 CLIENT_URL이 프론트엔드 주소와 일치하는지 확인
- 브라우저 캐시 삭제 후 재시도

### 이메일 발송 실패
- Gmail 앱 비밀번호 확인
- 보안 수준이 낮은 앱 액세스 허용 설정 확인

## 다음 단계
1. 실제 도메인 구매 및 SSL 설정
2. 프로덕션 서버 배포 (AWS, Heroku 등)
3. 토스페이먼츠 실제 가맹점 등록
4. Google Analytics 실제 ID 설정