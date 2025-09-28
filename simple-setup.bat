@echo off
echo 🚀 HederaKey - Simple Web Setup (No Build Tools Required)
echo.

REM Clean up any problematic node_modules
if exist node_modules (
    echo 🧹 Cleaning up previous installation...
    rmdir /s /q node_modules 2>nul
)

if exist client\node_modules (
    rmdir /s /q client\node_modules 2>nul
)

echo 📦 Installing minimal dependencies...

REM Install only essential packages without native dependencies
npm install --no-optional --ignore-scripts ^
    @hashgraph/sdk@^2.49.2 ^
    express@^4.21.2 ^
    cors@^2.8.5 ^
    dotenv@^16.3.1 ^
    helmet@^7.1.0 ^
    morgan@^1.10.1 ^
    body-parser@^1.20.3 ^
    axios@^1.6.2 ^
    uuid@^9.0.1 ^
    winston@^3.11.0 ^
    nodemon@^3.1.0 ^
    concurrently@^8.2.2

if %errorlevel% neq 0 (
    echo ❌ Server dependencies failed to install
    pause
    exit /b 1
)

echo ✅ Server dependencies installed successfully

REM Install client dependencies
echo 📦 Installing client dependencies...
cd client
npm install --no-optional

if %errorlevel% neq 0 (
    echo ❌ Client dependencies failed to install
    cd ..
    pause
    exit /b 1
)

cd ..
echo ✅ Client dependencies installed successfully

REM Copy .env if it doesn't exist
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo ✅ Created .env file from template
    )
)

echo.
echo 🎉 Setup complete!
echo.
echo To start the application:
echo   npm run start:simple
echo.
echo Web app will be available at:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8080
echo.
pause
