@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
if not exist ".env" (
  copy .env.example .env
  echo Created .env from .env.example. Edit backend\.env and add REPLICATE_API_TOKEN if needed.
  pause
)
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)
echo Starting backend at http://127.0.0.1:8787
echo Keep this window open. Close it to stop the server.
echo.
node src/server.js
pause
