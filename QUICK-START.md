# 🚀 HederaKey - Quick Start Guide

## ⚡ Instant Setup (No Build Tools Required)

### Option 1: Automated Setup (Recommended)
```bash
# Run the simple setup script
simple-setup.bat
```

### Option 2: Manual Setup
```bash
# 1. Install minimal dependencies (avoids build issues)
npm run install:simple

# 2. Install client dependencies
cd client
npm install
cd ..

# 3. Copy environment file
copy .env.example .env

# 4. Start the application
npm run start:simple
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

## 🎯 Demo Features

### 1. **Home Page** - Overview and navigation
### 2. **NFC Simulator** - Tap-to-tokenize demo
### 3. **AMM Swap** - Trade tokenized assets
### 4. **AI Fraud Detection** - Real-time risk analysis
### 5. **DePIN Network** - Global infrastructure map

## 🔧 API Endpoints

```bash
# Health check
GET http://localhost:8080/health

# NFC asset scanning
POST http://localhost:8080/api/nfc/scan

# Token creation
POST http://localhost:8080/api/tokens/create

# AI fraud detection
POST http://localhost:8080/api/ai/fraud-detection/analyze

# AMM trading
POST http://localhost:8080/api/amm/swap

# Network status
GET http://localhost:8080/api/depin/network/status

# Live prices
GET http://localhost:8080/api/oracle/prices
```

## 🎮 Demo Flow

1. **Visit** http://localhost:3000
2. **Click** "Try Live Demo"
3. **Follow** the 6-step interactive demo:
   - NFC Tap → Token Mint → AI Analysis → AMM Swap → Network View

## 🛠️ Troubleshooting

### If you get build errors:
- Use `simple-setup.bat` instead of `npm run setup`
- This avoids problematic native dependencies

### If ports are busy:
- Change PORT in .env file
- Default: Backend=8080, Frontend=3000

### If client won't start:
```bash
cd client
npm install --legacy-peer-deps
npm start
```

## 📱 Mobile Testing

- Open http://localhost:3000 on mobile
- NFC simulation works on all devices
- Responsive design optimized for mobile

## 🎥 For Hackathon Judges

1. **Auto-Play Demo**: Click "Start Demo" → "Auto-Play"
2. **Manual Control**: Navigate through each step manually
3. **Live Data**: All metrics and prices update in real-time
4. **Mobile Ready**: Works perfectly on phones/tablets

## 🔥 Key Highlights

- **No Build Tools Required** - Runs on any system
- **Real-Time APIs** - Live data simulation
- **Mobile Optimized** - Touch-friendly interface
- **Zero Configuration** - Works out of the box
- **Hackathon Ready** - Professional demo experience

---

**🏆 Ready to showcase the future of asset tokenization!**
