// 🎨 OpenAI DALL-E 3 연동 가이드
// 형제가 직접 설정해야 하는 부분!

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// ⚠️ 형제가 설정해야 할 부분
const OPENAI_API_KEY = 'sk-xxxxxxxxxxxxxxxxxxxxx'; // OpenAI API 키 필요!

async function generateWithDALLE() {
  console.log('🎨 DALL-E 3 이미지 생성 시작!\n');
  
  // 필요한 이미지들
  const images = [
    {
      filename: 'story-1.jpg',
      prompt: `Photorealistic image: Warm spring afternoon in modern Korean apartment living room, 
      Korean father in early 30s carefully holding newborn baby with slightly worried expression 
      while looking at smartphone. Moving boxes in background, soft natural sunlight through window. 
      Emotional family moment, 16:9 aspect ratio`
    },
    {
      filename: 'story-4.jpg',
      prompt: `Photorealistic image: Evening in modern Korean apartment, Korean family of four - 
      parents in 30s-40s on sofa with tea, two children aged 5-8 playing board games on clean floor. 
      Seoul city lights through windows, warm lighting, everyone looking happy and comfortable. 
      Lifestyle photography, 16:9 aspect ratio`
    }
  ];

  for (const { filename, prompt } of images) {
    console.log(`📸 ${filename} 생성 중...`);
    
    try {
      // DALL-E 3 API 호출
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1792x1024", // 16:9 비율
          quality: "hd"
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // 이미지 URL 받기
      const imageUrl = response.data.data[0].url;
      console.log('✅ 이미지 생성 완료!');
      console.log(`🔗 URL: ${imageUrl}\n`);
      
      // 이미지 다운로드
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(imageResponse.data);
      
      // 저장
      const imagePath = path.join(__dirname, '../cleaning_workshop/images', filename);
      await fs.writeFile(imagePath, buffer);
      console.log(`💾 ${filename} 저장 완료!\n`);
      
    } catch (error) {
      console.error(`❌ ${filename} 생성 실패:`, error.message);
      console.log('💡 API 키를 확인하세요!\n');
    }
    
    // API 제한 방지
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('🎉 모든 이미지 생성 완료!');
}

// 실행 방법:
console.log('📌 사용 방법:');
console.log('1. OpenAI API 키 받기: https://platform.openai.com/api-keys');
console.log('2. 위 코드에서 OPENAI_API_KEY 설정');
console.log('3. node openai-dalle-integration.js 실행\n');

console.log('💰 비용:');
console.log('- DALL-E 3 HD: 이미지당 $0.08 (약 100원)');
console.log('- 2개 이미지 = 약 200원\n');

// API 키가 설정되면 주석 해제
// generateWithDALLE();