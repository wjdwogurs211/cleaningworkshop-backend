const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { GoogleAuth } = require('google-auth-library');
require('dotenv').config();

async function generateAlternativeImages() {
  console.log('🎨 대체 이미지 생성 (사람 없는 버전)\n');
  
  const auth = new GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  
  const projectId = 'gen-lang-client-0866235587';
  const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`;
  
  // 사람 없이 분위기만 전달하는 이미지
  const alternativeImages = [
    {
      filename: 'story-1.jpg',
      prompt: 'Warm living room with baby items, soft morning light through window, moving boxes, teddy bear on sofa, peaceful home atmosphere, photorealistic'
    },
    {
      filename: 'story-4.jpg',
      prompt: 'Cozy evening living room scene, board games on clean floor, tea cups on coffee table, warm lamp light, city lights through window, homey atmosphere'
    }
  ];
  
  const imagesDir = path.join(__dirname, '../cleaning_workshop/images');
  
  for (const { filename, prompt } of alternativeImages) {
    console.log(`📸 ${filename} 생성 중...`);
    console.log(`   프롬프트: ${prompt}\n`);
    
    try {
      const requestData = {
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9'
        }
      };
      
      const response = await axios.post(endpoint, requestData, {
        headers: {
          'Authorization': `Bearer ${token.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data?.predictions?.[0]?.bytesBase64Encoded) {
        const imageData = response.data.predictions[0].bytesBase64Encoded;
        await fs.writeFile(path.join(imagesDir, filename), imageData, 'base64');
        console.log(`✅ ${filename} 생성 성공!\n`);
      } else {
        console.log(`❌ 실패\n`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ 에러:`, error.response?.status || error.message, '\n');
    }
  }
  
  console.log('💡 Vertex AI Studio 링크:');
  console.log('https://console.cloud.google.com/vertex-ai/generative/vision');
  console.log('위 링크에서 수동으로 생성할 수도 있습니다!');
}

generateAlternativeImages();