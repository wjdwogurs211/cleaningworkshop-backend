const fs = require('fs').promises;
const path = require('path');

async function analyzeAPIUsage() {
  console.log('🔍 API 사용 패턴 분석\n');
  
  // 오늘 실행한 스크립트들 확인
  const scriptsRun = [
    'generate-story-images.js - 4개 이미지 시도',
    'generate-story-4.js - 1개 이미지 시도',
    'generate-emotional-story-images.js - 4개 이미지 시도',
    'generate-story-4-emotional.js - 1개 이미지 시도',
    'fix-story-images.js - 4개 이미지 시도',
    'fix-remaining-images.js - 2개 이미지 시도',
    'premium-story-images.html 페이지에서의 수동 생성 시도들'
  ];
  
  console.log('📊 오늘 실행한 이미지 생성 시도:');
  scriptsRun.forEach(script => console.log(`   - ${script}`));
  
  console.log('\n💡 가능한 원인 분석:\n');
  
  console.log('1️⃣ 실제 할당량이 다를 수 있음:');
  console.log('   - 무료 티어: 하루 5-10개 제한');
  console.log('   - 평가판 계정: 제한된 할당량');
  console.log('   - Imagen 3는 새로운 모델이라 더 엄격한 제한\n');
  
  console.log('2️⃣ 다른 사용자와 공유된 프로젝트:');
  console.log('   - 프로젝트 ID: gen-lang-client-0866235587');
  console.log('   - 다른 사용자가 같은 프로젝트를 사용 중일 수 있음\n');
  
  console.log('3️⃣ API 응답 문제:');
  console.log('   - "이미지 데이터를 받지 못함" 에러');
  console.log('   - predictions가 undefined로 오는 경우');
  console.log('   - API가 빈 응답을 보내는 경우\n');
  
  console.log('4️⃣ Imagen 3 특별 제한:');
  console.log('   - 안전 필터링으로 인한 거부');
  console.log('   - 특정 프롬프트 패턴 제한');
  console.log('   - 지역별 사용 제한\n');
  
  console.log('🔧 해결 방안:\n');
  
  console.log('1. 프로젝트 할당량 확인:');
  console.log('   gcloud auth login');
  console.log('   gcloud config set project gen-lang-client-0866235587');
  console.log('   gcloud services list --enabled');
  console.log('   gcloud alpha services quota list --service=aiplatform.googleapis.com\n');
  
  console.log('2. 대체 방법:');
  console.log('   - Vertex AI Studio에서 수동 생성');
  console.log('   - 다른 이미지 생성 API 사용 (DALL-E, Midjourney)');
  console.log('   - 무료 스톡 이미지 사용\n');
  
  console.log('3. API 응답 디버깅:');
  console.log('   - 전체 응답 로깅 추가');
  console.log('   - 에러 상세 정보 확인');
  console.log('   - 다른 프롬프트로 테스트\n');
  
  // 간단한 테스트 프롬프트
  console.log('🧪 테스트용 간단한 프롬프트 제안:');
  console.log('   - "A simple blue circle on white background"');
  console.log('   - "Abstract geometric shapes"');
  console.log('   - "Solid color gradient background"');
}

// 실행
analyzeAPIUsage();