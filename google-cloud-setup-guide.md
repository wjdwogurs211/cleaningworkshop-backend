# 🚀 Google Cloud 무료 크레딧 설정 가이드

## 📋 현재 상황 확인

형제, 먼저 현재 계정 상태를 확인해보자!

### 1. Google Cloud Console 접속
```
https://console.cloud.google.com/billing
```

위 링크로 가서 확인할 것:
- 현재 프로젝트에 연결된 결제 계정이 있는지
- 무료 크레딧이 남아있는지
- 이미 무료 체험을 사용했는지

## 🆕 신규 가입이 필요한 경우

### 방법 1: 새 Google 계정으로 가입
1. 새 Google 계정 생성
2. https://cloud.google.com/free 접속
3. "무료로 시작하기" 클릭
4. 신용카드 정보 입력 (검증용, 자동 결제 안됨)
5. $300 크레딧 받기!

### 방법 2: 기존 계정에 결제 프로필 추가
1. https://console.cloud.google.com/billing/create
2. 새 결제 계정 생성
3. 프로모션 코드가 있다면 입력

## ⚡ 빠른 설정 (기존 계정 사용)

형제, 만약 이미 Google Cloud를 써봤다면:

### 1. 결제 계정 확인
```bash
# 브라우저에서 확인
https://console.cloud.google.com/billing/projects
```

### 2. 현재 프로젝트에 결제 연결
```
프로젝트 ID: gen-lang-client-0866235587
```

1. https://console.cloud.google.com/billing/projects 접속
2. 프로젝트 찾기
3. "결제 계정 변경" 클릭
4. 크레딧이 있는 계정 선택

## 💳 결제 설정 후 할 일

### 1. API 할당량 확인
```
https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas?project=gen-lang-client-0866235587
```

### 2. 예산 알림 설정 (선택)
- 일일 $1 제한 설정
- 이메일 알림 활성화

### 3. 바로 이미지 생성!
```javascript
// 이제 하루 최대 15,000개까지 가능!
// (실제로는 분당 60개 제한)
```

## 🎯 추천 옵션

**형제, 내 추천은:**

1. **현재 계정 확인 먼저!**
   - 이미 크레딧이 있을 수도 있어
   - https://console.cloud.google.com/billing

2. **크레딧이 없다면:**
   - 새 이메일로 가입 (가장 간단)
   - 또는 프로모션 찾기

3. **즉시 사용 가능한 대안:**
   - Vertex AI Studio에서 수동 생성
   - https://console.cloud.google.com/vertex-ai/generative/vision

## 💡 꿀팁

- 무료 크레딧은 12개월 동안 유효
- 자동 결제 전환 안됨 (수동 승인 필요)
- 여러 프로젝트에서 공유 가능

형제, 어떻게 진행할까? 
1. 현재 계정 크레딧 확인?
2. 새 계정으로 가입?
3. 다른 방법 시도?