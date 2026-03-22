@echo off
echo 🧱 Block Builder — Setup (Windows)
echo ===================================

:: Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install from https://nodejs.org
    exit /b 1
)

for /f "tokens=1 delims=." %%a in ('node -v') do set NODE_MAJOR=%%a
set NODE_MAJOR=%NODE_MAJOR:v=%
if %NODE_MAJOR% LSS 20 (
    echo ❌ Node.js ^>= 20 required. Current: 
    node -v
    exit /b 1
)

echo ✅ Node.js version OK: 
node -v

:: Check / install pnpm
pnpm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing pnpm...
    npm install -g pnpm
)

echo 📦 Installing dependencies...
pnpm install

:: Copy .env
if not exist .env (
    echo 📋 Creating .env from .env.example...
    copy .env.example .env >nul
)

echo.
echo ✅ Setup complete!
echo.
echo Start development:
echo   pnpm dev
echo.
echo   Frontend ^-^> http://localhost:3000
echo   Backend  ^-^> http://localhost:3001
