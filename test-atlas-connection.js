// MongoDB Atlas 연결 테스트
const { MongoClient } = require('mongodb');

const ATLAS_URL = 'mongodb+srv://cksgo130210:3nR9Tcm37IKk45DA@cluster0.led2lbu.mongodb.net/cleaninglab?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
    try {
        console.log('🔄 MongoDB Atlas 연결 테스트 중...');
        
        const client = new MongoClient(ATLAS_URL);
        await client.connect();
        
        console.log('✅ MongoDB Atlas 연결 성공!');
        
        // 데이터베이스 정보 확인
        const db = client.db('cleaninglab');
        const collections = await db.listCollections().toArray();
        
        console.log('\n📦 현재 컬렉션 목록:');
        collections.forEach(col => {
            console.log(`  - ${col.name}`);
        });
        
        await client.close();
        console.log('\n🎉 테스트 완료!');
        
    } catch (error) {
        console.error('❌ 연결 실패:', error.message);
    }
}

testConnection();