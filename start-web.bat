@echo off
echo 🚀 Starting HederaKey Web Application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found. Running setup...
    node setup.js
    echo.
    echo ⚠️  Please edit .env with your Hedera credentials before continuing.
    echo Press any key when ready...
    pause
)

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

REM Check if client node_modules exists
if not exist client\node_modules (
    echo 📦 Installing client dependencies...
    cd client
    npm install
    cd ..
)

echo.
echo 🌐 Starting web application...
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8080
echo.

REM Start both server and client
npm run dev
