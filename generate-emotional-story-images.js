const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const { GoogleAuth } = require('google-auth-library');

async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token;
}

// 감동적인 원래 스토리에 맞는 이미지 프롬프트들
const emotionalStoryPrompts = [
  {
    filename: 'story-1-emotional.jpg',
    prompt: `따뜻한 봄날 오후, 한국의 아늑한 거실에서 젊은 아버지가 갓 태어난 아기를 부드럽게 안고 있는 모습, 
    아버지의 눈에는 사랑과 동시에 걱정이 담겨있고, 창문으로 들어오는 부드러운 햇살이 아기의 얼굴을 비추는 장면, 
    배경에는 이사 준비 중인 박스들이 보이고, 아버지는 스마트폰으로 청소업체를 검색하며 고민하는 표정, 
    따뜻하고 감성적인 분위기, 가족의 사랑이 느껴지는 포토저널리즘 스타일, 자연광을 활용한 부드러운 조명`
  },
  {
    filename: 'story-2-emotional.jpg',
    prompt: `밝고 깨끗한 연구실에서 열정적으로 실험하는 연구원들의 모습, 중앙 테이블에는 다양한 세제 샘플들과 
    pH 측정기, 현미경 등의 실험 장비들이 정리되어 있고, 벽면의 화이트보드에는 '안전한 청소'라는 한글과 
    복잡한 화학식들이 적혀있음, 연구원 중 한 명은 아이 사진을 책상에 두고 있어 연구의 동기가 느껴지는 장면, 
    진지하고 헌신적인 분위기, 과학적이면서도 인간적인 따뜻함이 공존하는 공간, 다큐멘터리 스타일`
  },
  {
    filename: 'story-3-emotional.jpg',
    prompt: `청소공작소 로고가 새겨진 플라스크를 들고 있는 손 클로즈업, 플라스크 안에는 투명한 친환경 세제가 담겨있고, 
    배경으로는 흐릿하게 실험실 풍경이 보임, 플라스크에 비친 빛이 희망적인 느낌을 주며, 
    '실험실에서 태어난 안전한 청소'라는 메시지가 전달되는 이미지, 
    과학과 가정의 안전이 만나는 순간을 상징적으로 표현, 매크로 렌즈로 촬영한 듯한 선명하고 깨끗한 이미지`
  },
  {
    filename: 'story-4-emotional.jpg',
    prompt: `저녁 무렵 따뜻한 거실에서 행복하게 시간을 보내는 한국인 가족들의 모습, 
    엄마와 아빠는 소파에서 차를 마시며 대화하고, 두 아이는 깨끗한 거실 바닥에서 안전하게 놀고 있는 장면, 
    집 전체가 깨끗하고 정돈되어 있으며, 가족 모두의 얼굴에 편안한 미소가 있음, 
    창밖으로는 도시의 불빛이 보이고, 실내는 따뜻한 조명으로 가득함, 
    '10만 가정이 선택한 신뢰'를 느낄 수 있는 평화롭고 행복한 가정의 모습, 라이프스타일 매거진 감성`
  }
];

async function generateEmotionalImages() {
  console.log('💙 감동적인 스토리 이미지 생성을 시작합니다...\n');
  
  const projectId = process.env.GOOGLE_PROJECT_ID || 'gen-lang-client-0866235587';
  const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`;
  
  const imagesDir = path.join(__dirname, '../cleaning_workshop/images');
  
  // 기존 이미지 백업
  console.log('📁 기존 이미지 백업 중...');
  for (let i = 1; i <= 4; i++) {
    const oldPath = path.join(imagesDir, `story-${i}.jpg`);
    const backupPath = path.join(imagesDir, `story-${i}-premium-backup.jpg`);
    try {
      await fs.rename(oldPath, backupPath);
      console.log(`✅ story-${i}.jpg → story-${i}-premium-backup.jpg`);
    } catch (error) {
      console.log(`⚠️ story-${i}.jpg 백업 실패:`, error.message);
    }
  }
  
  console.log('\n🎨 새로운 감동적인 이미지 생성 시작...\n');
  
  for (let i = 0; i < emotionalStoryPrompts.length; i++) {
    const { filename, prompt } = emotionalStoryPrompts[i];
    const finalFilename = `story-${i + 1}.jpg`;
    
    console.log(`\n📸 ${finalFilename} 생성 중...`);
    
    try {
      const authToken = await getAccessToken();
      
      const requestData = {
        instances: [{
          prompt: prompt
        }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
          safetyFilterLevel: 'block_some',
          personGeneration: 'allow_adult',
          includeRaiReason: true
        }
      };
      
      const response = await axios.post(endpoint, requestData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const imageData = response.data.predictions[0].bytesBase64Encoded;
      const filePath = path.join(imagesDir, finalFilename);
      
      await fs.writeFile(filePath, imageData, 'base64');
      console.log(`✅ ${finalFilename} 생성 완료!`);
      
      if (i < emotionalStoryPrompts.length - 1) {
        console.log('⏳ 다음 이미지 생성 대기 중...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
    } catch (error) {
      console.error(`❌ ${finalFilename} 생성 실패:`, error.message);
      if (error.response?.status === 429) {
        console.log('💡 API 할당량 초과. 10초 후 재시도...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        i--; // 재시도를 위해 인덱스 감소
      }
    }
  }
  
  console.log('\n💙 모든 감동적인 스토리 이미지 생성이 완료되었습니다!');
  console.log('🎉 가족의 사랑과 신뢰를 담은 청소공작소의 이야기가 완성되었습니다!');
}

// 실행
generateEmotionalImages().catch(console.error);