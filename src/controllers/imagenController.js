const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Google Imagen 3 API 설정
const getImagenEndpoint = () => {
  const projectId = process.env.GOOGLE_PROJECT_ID || 'gen-lang-client-0866235587';
  return `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`;
};

// 이미지 생성 요청
exports.generateImage = async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', numberOfImages = 1 } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: '프롬프트가 필요합니다.'
      });
    }

    // Google Cloud 인증 설정
    const authToken = await getAccessToken();

    // Imagen 3 API 요청 데이터
    const requestData = {
      instances: [{
        prompt: prompt
      }],
      parameters: {
        sampleCount: numberOfImages,
        aspectRatio: aspectRatio,
        // Imagen 3 추가 파라미터들
        safetyFilterLevel: 'block_some',
        personGeneration: 'allow_adult',
        includeRaiReason: true
      }
    };

    // API 호출
    const response = await axios.post(getImagenEndpoint(), requestData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    // 생성된 이미지 처리
    const predictions = response.data.predictions;
    const images = [];

    for (let i = 0; i < predictions.length; i++) {
      const imageData = predictions[i].bytesBase64Encoded;
      
      // Base64를 파일로 저장
      const fileName = `imagen_${Date.now()}_${i}.png`;
      const filePath = path.join(__dirname, '../../uploads', fileName);
      
      await fs.writeFile(filePath, imageData, 'base64');
      
      images.push({
        url: `/uploads/${fileName}`,
        prompt: prompt,
        createdAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      data: {
        images,
        prompt,
        count: images.length
      }
    });

  } catch (error) {
    console.error('Imagen 3 API 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message || '이미지 생성 중 오류가 발생했습니다.'
    });
  }
};

// 청소 관련 이미지 프롬프트 템플릿
exports.getPromptTemplates = async (req, res) => {
  try {
    const templates = {
      services: {
        moveInCleaning: {
          title: '입주청소',
          prompts: [
            '깨끗하고 밝은 한국 아파트 거실, 창문으로 햇빛이 들어오는 모습, 전문 청소 후의 모습',
            '반짝이는 주방, 스테인리스 싱크대와 깨끗한 조리대, 프로페셔널한 청소 결과'
          ]
        },
        airConditioner: {
          title: '에어컨 청소',
          prompts: [
            '전문가가 에어컨을 분해 청소하는 모습, 깨끗한 필터와 전문 장비',
            '깨끗하게 청소된 에어컨에서 시원한 바람이 나오는 모습, 행복한 가족'
          ]
        },
        sofa: {
          title: '쇼파 청소',
          prompts: [
            '전문 장비로 쇼파를 청소하는 모습, 얼룩 제거 전후 비교',
            '깨끗해진 패브릭 쇼파, 밝고 청결한 거실 분위기'
          ]
        }
      },
      marketing: {
        banner: {
          title: '마케팅 배너',
          prompts: [
            '청소 전문가들이 미소 짓는 모습, 전문적이고 친근한 분위기, 한국적인 배경',
            '깨끗한 집 인테리어, "청소공작소" 로고와 함께, 프로페셔널한 서비스 이미지'
          ]
        },
        beforeAfter: {
          title: '전후 비교',
          prompts: [
            '청소 전후 비교 이미지, 극적인 변화, 왼쪽은 지저분한 모습 오른쪽은 깨끗한 모습',
            '프로페셔널 청소 서비스의 결과물, 반짝이는 바닥과 정돈된 공간'
          ]
        }
      }
    };

    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 생성된 이미지 목록 조회
exports.getGeneratedImages = async (req, res) => {
  try {
    // 실제로는 DB에서 조회해야 함
    const uploadsDir = path.join(__dirname, '../../uploads');
    const files = await fs.readdir(uploadsDir);
    
    const images = files
      .filter(file => file.startsWith('imagen_'))
      .map(file => ({
        filename: file,
        url: `/uploads/${file}`,
        createdAt: new Date()
      }));

    res.status(200).json({
      success: true,
      data: {
        images,
        total: images.length
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Google Cloud 액세스 토큰 가져오기
async function getAccessToken() {
  try {
    // 서비스 계정 JSON 파일 경로
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (!serviceAccountPath) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS 환경변수가 설정되지 않았습니다.');
    }

    // 서비스 계정 정보 읽기
    const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, 'utf8'));
    
    // JWT 생성 및 토큰 요청 (실제 구현 필요)
    // 여기서는 간단한 예시만 제공
    // 실제로는 google-auth-library를 사용하는 것이 좋습니다
    
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    return accessToken.token;
  } catch (error) {
    console.error('액세스 토큰 획득 실패:', error);
    throw error;
  }
}