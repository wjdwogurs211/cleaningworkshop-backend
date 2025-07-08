const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function checkAccountType() {
  console.log('🔍 Google Cloud 계정 타입 분석\n');
  
  console.log('📋 현재 설정:');
  console.log(`   프로젝트 ID: ${process.env.GOOGLE_PROJECT_ID || 'gen-lang-client-0866235587'}`);
  console.log(`   인증 파일: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}\n`);
  
  console.log('⚠️ 중요한 차이점:\n');
  
  console.log('1️⃣ Gemini Ultra vs Imagen 3:');
  console.log('   - Gemini Ultra: 텍스트 생성 AI (대화형)');
  console.log('   - Imagen 3: 이미지 생성 AI');
  console.log('   - 서로 다른 서비스 = 다른 할당량!\n');
  
  console.log('2️⃣ 구독 유형별 차이:');
  console.log('   📱 Gemini Advanced (개인 구독):');
  console.log('      - Gemini Ultra 채팅 무제한');
  console.log('      - Imagen 이미지 생성 포함 안 됨');
  console.log('      - Google Cloud API 크레딧 없음\n');
  
  console.log('   ☁️ Google Cloud Platform:');
  console.log('      - API별 개별 과금');
  console.log('      - Imagen 3는 별도 요금');
  console.log('      - 무료 크레딧 $300 (신규 가입시)\n');
  
  console.log('3️⃣ 현재 상황 분석:');
  console.log('   - 프로젝트 "gen-lang-client-0866235587"');
  console.log('   - 이름이 "Gemini API"로 되어 있음');
  console.log('   - Imagen 3 무료 티어 사용 중');
  console.log('   - 일일 10-20개 제한\n');
  
  console.log('💡 해결 방법:\n');
  
  console.log('1. 크레딧 확인:');
  console.log('   https://console.cloud.google.com/billing');
  console.log('   위에서 결제 계정과 크레딧 확인\n');
  
  console.log('2. Imagen 3 요금:');
  console.log('   - 이미지당 약 $0.02 (약 26원)');
  console.log('   - 월 $20이면 1,000개 생성 가능\n');
  
  console.log('3. 대안:');
  console.log('   a) Google Cloud 무료 크레딧 활용');
  console.log('   b) Vertex AI Studio에서 수동 생성');
  console.log('   c) 다른 이미지 생성 API 사용');
  console.log('      - OpenAI DALL-E 3');
  console.log('      - Stability AI');
  console.log('      - Midjourney\n');
  
  console.log('4. Gemini로 이미지 생성:');
  console.log('   - Gemini Advanced 웹/앱에서는 이미지 생성 가능');
  console.log('   - 하지만 API로는 불가능');
  console.log('   - Imagen API를 별도로 사용해야 함\n');
  
  // 서비스 계정 정보 확인
  try {
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (keyPath) {
      const keyData = JSON.parse(await fs.readFile(keyPath, 'utf8'));
      console.log('🔑 서비스 계정 정보:');
      console.log(`   타입: ${keyData.type}`);
      console.log(`   프로젝트: ${keyData.project_id}`);
      console.log(`   이메일: ${keyData.client_email}`);
      console.log(`   생성일: ${new Date(keyData.private_key_id.substring(0, 8)).toLocaleDateString()}\n`);
    }
  } catch (error) {
    console.log('❌ 서비스 계정 정보 읽기 실패\n');
  }
  
  console.log('📌 결론:');
  console.log('   Gemini Ultra 구독 ≠ Imagen 3 무제한 사용');
  console.log('   이미지 생성은 별도 과금이 필요해요!');
}

checkAccountType();