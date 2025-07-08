@echo off
echo 청소공작소 백엔드 서버 테스트
echo ================================
echo.

cd /d "%~dp0"

echo MongoDB 연결 테스트 중...
echo.

echo 서버를 시작합니다...
node src/server.js

pause