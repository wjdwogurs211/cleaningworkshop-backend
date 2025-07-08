// MongoDB Atlas 마이그레이션 스크립트
const { MongoClient } = require('mongodb');

// 로컬 MongoDB URL
const LOCAL_URL = 'mongodb://localhost:27017/cleaninglab';

// Atlas URL (여기에 Atlas에서 받은 connection string 입력)
// 형식: mongodb+srv://username:password@cluster.mongodb.net/cleaninglab?retryWrites=true&w=majority
const ATLAS_URL = 'mongodb+srv://cksgo130210:3nR9Tcm37IKk45DA@cluster0.led2lbu.mongodb.net/cleaninglab?retryWrites=true&w=majority&appName=Cluster0';

async function migrate() {
    console.log('🚀 MongoDB Atlas 마이그레이션 시작...');
    
    try {
        // 로컬 DB 연결
        const localClient = new MongoClient(LOCAL_URL);
        await localClient.connect();
        const localDb = localClient.db('cleaninglab');
        
        // Atlas DB 연결
        const atlasClient = new MongoClient(ATLAS_URL);
        await atlasClient.connect();
        const atlasDb = atlasClient.db('cleaninglab');
        
        // 컬렉션 목록
        const collections = ['users', 'bookings', 'services', 'reviews'];
        
        for (const collectionName of collections) {
            console.log(`\n📦 ${collectionName} 컬렉션 마이그레이션 중...`);
            
            const localCollection = localDb.collection(collectionName);
            const atlasCollection = atlasDb.collection(collectionName);
            
            // 기존 데이터 가져오기
            const documents = await localCollection.find({}).toArray();
            
            if (documents.length > 0) {
                // Atlas에 데이터 삽입
                await atlasCollection.insertMany(documents);
                console.log(`✅ ${documents.length}개 문서 마이그레이션 완료`);
            } else {
                console.log(`ℹ️ ${collectionName}에 데이터 없음`);
            }
        }
        
        // 연결 종료
        await localClient.close();
        await atlasClient.close();
        
        console.log('\n🎉 마이그레이션 완료!');
        
    } catch (error) {
        console.error('❌ 마이그레이션 실패:', error);
    }
}

// 실행
migrate();