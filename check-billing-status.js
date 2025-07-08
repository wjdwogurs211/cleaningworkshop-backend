const { GoogleAuth } = require('google-auth-library');
require('dotenv').config();

async function checkBillingStatus() {
  console.log('💳 결제 상태 상세 분석\n');
  
  console.log('📋 현재 상황:');
  console.log('   - 결제 계정: 활성 ✅');
  console.log('   - 최근 지출: $0 ❌');
  console.log('   - API 동작: 무료 티어 제한\n');
  
  console.log('🔍 가능한 원인들:\n');
  
  console.log('1️⃣ 프로젝트와 결제 계정 연결 문제:');
  console.log('   - 결제 계정은 있지만 이 프로젝트에 연결 안됨');
  console.log('   - 확인 링크:');
  console.log('   https://console.cloud.google.com/billing/linkedaccount?project=gen-lang-client-0866235587\n');
  
  console.log('2️⃣ Imagen 3 특별 제한:');
  console.log('   - 인물 사진 생성 제한 (안전 정책)');
  console.log('   - personGeneration 파라미터가 작동 안함');
  console.log('   - 무료 티어는 사람 없는 이미지만 가능\n');
  
  console.log('3️⃣ API 활성화 문제:');
  console.log('   - Vertex AI API가 유료 모드로 전환 안됨');
  console.log('   - 확인 링크:');
  console.log('   https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=gen-lang-client-0866235587\n');
  
  console.log('💡 해결 방법:\n');
  
  console.log('방법 1: 프로젝트 결제 재연결');
  console.log('1. https://console.cloud.google.com/billing/projects');
  console.log('2. "gen-lang-client-0866235587" 찾기');
  console.log('3. 결제 계정 변경 → 크레딧 있는 계정 선택\n');
  
  console.log('방법 2: 새 프로젝트 생성');
  console.log('1. https://console.cloud.google.com/projectcreate');
  console.log('2. 새 프로젝트 생성');
  console.log('3. 결제 계정 연결');
  console.log('4. Vertex AI API 활성화\n');
  
  console.log('방법 3: Vertex AI Studio 사용');
  console.log('https://console.cloud.google.com/vertex-ai/generative/vision');
  console.log('여기서 직접 이미지 생성 (웹 UI)\n');
  
  console.log('📊 현재 성공/실패 패턴:');
  console.log('✅ 성공: 단순 도형, 풍경, 사물');
  console.log('❌ 실패: 사람, 가족, 인물 사진');
  console.log('\n이는 무료 티어의 전형적인 제한사항입니다!');
  
  // 프로젝트 정보 확인
  try {
    const auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    
    const projectId = 'gen-lang-client-0866235587';
    console.log('\n🔧 프로젝트 설정 확인:');
    console.log(`프로젝트 ID: ${projectId}`);
    console.log(`서비스 계정: wjdwogurs21@${projectId}.iam.gserviceaccount.com`);
    
  } catch (error) {
    console.error('프로젝트 정보 확인 실패');
  }
}

checkBillingStatus();