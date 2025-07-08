const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');
require('dotenv').config();

async function simpleTest() {
  console.log('🧪 간단한 이미지 생성 테스트\n');
  
  try {
    const auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    
    const projectId = 'gen-lang-client-0866235587';
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`;
    
    // 매우 간단한 프롬프트
    const requestData = {
      instances: [{
        prompt: "A simple red circle on white background"
      }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1'
      }
    };
    
    console.log('📤 요청 전송 중...');
    const response = await axios.post(endpoint, requestData, {
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 응답 상태:', response.status);
    console.log('📊 응답 데이터 구조:', Object.keys(response.data));
    
    if (response.data.predictions && response.data.predictions.length > 0) {
      console.log('✅ 이미지 생성 성공!');
      console.log('   - predictions 개수:', response.data.predictions.length);
      console.log('   - 이미지 데이터 존재:', !!response.data.predictions[0].bytesBase64Encoded);
    } else {
      console.log('❌ predictions가 비어있음');
      console.log('전체 응답:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.error('에러 상세:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

simpleTest();