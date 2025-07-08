const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { GoogleAuth } = require('google-auth-library');
require('dotenv').config();

async function testWithBilling() {
  console.log('💳 결제 연결 후 이미지 생성 테스트!\n');
  
  const auth = new GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  
  const projectId = 'gen-lang-client-0866235587';
  const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`;
  
  // 우리가 원했던 이미지들!
  const finalImages = [
    {
      filename: 'story-1.jpg',
      prompt: '한국의 젊은 아버지가 밝은 거실에서 갓 태어난 아기를 사랑스럽게 안고 있는 모습, 따뜻한 봄날 오후의 자연광, 배경에 이사 박스들이 보이고, 아버지는 약간 걱정스러운 표정으로 핸드폰을 보고 있음, 감동적이고 따뜻한 가족 사진, 포토저널리즘 스타일'
    },
    {
      filename: 'story-4.jpg',
      prompt: '저녁 시간 아늑한 한국 가정의 거실, 부모는 소파에서 차를 마시며 대화하고, 5-8살 두 아이는 깨끗한 바닥에서 보드게임을 하며 즐겁게 놀고 있는 모습, 창밖으로 도시의 야경이 보이고, 온 가족이 행복하고 편안해 보이는 따뜻한 분위기, 라이프스타일 매거진 스타일의 사진'
    }
  ];
  
  const imagesDir = path.join(__dirname, '../cleaning_workshop/images');
  
  console.log('🎯 결제 연결 확인 중...\n');
  
  for (const { filename, prompt } of finalImages) {
    console.log(`📸 ${filename} 생성 시도...`);
    
    try {
      const requestData = {
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
          safetyFilterLevel: 'block_some',
          personGeneration: 'allow_adult'
        }
      };
      
      const response = await axios.post(endpoint, requestData, {
        headers: {
          'Authorization': `Bearer ${token.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      if (response.data?.predictions?.[0]?.bytesBase64Encoded) {
        const imageData = response.data.predictions[0].bytesBase64Encoded;
        await fs.writeFile(path.join(imagesDir, filename), imageData, 'base64');
        console.log(`✅ ${filename} 생성 성공!`);
        console.log('🎉 결제가 연결되어 있습니다!\n');
      } else {
        throw new Error('이미지 데이터 없음');
      }
      
      // 다음 요청 전 3초 대기
      if (filename !== 'story-4.jpg') {
        console.log('⏳ 다음 이미지 대기 중...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
    } catch (error) {
      if (error.response?.status === 429) {
        console.error(`❌ 여전히 할당량 초과!`);
        console.error('💡 결제 계정이 아직 연결되지 않았을 수 있습니다.\n');
        console.log('👉 다음 링크에서 확인하세요:');
        console.log(`   https://console.cloud.google.com/billing/linkedaccount?project=${projectId}\n`);
      } else {
        console.error(`❌ ${filename} 실패:`, error.message, '\n');
      }
    }
  }
  
  console.log('🏁 테스트 완료!');
  console.log('✨ 성공했다면 our-story.html 페이지를 새로고침해서 확인해보세요!');
}

testWithBilling();