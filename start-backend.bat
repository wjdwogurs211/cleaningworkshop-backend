@echo off
echo 청소공작소 백엔드 서버를 시작합니다...
cd /d "%~dp0"

echo.
echo MongoDB가 실행중인지 확인해주세요.
echo 환경변수(.env) 파일이 설정되어 있는지 확인해주세요.
echo.

if not exist node_modules (
    echo node_modules이 없습니다. 패키지를 설치합니다...
    npm install
)

echo 서버를 시작합니다...
npm run dev

pause