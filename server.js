const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config();

// Import services
const hederaService = require('./src/services/hedera');
const nfcService = require('./src/services/nfc');
const unstoppableService = require('./src/services/unstoppable');

const PORT = process.env.PORT || 8080;
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    service: 'HederaKey API'
  });
});

// Mock API endpoints for demo
app.get('/api/status', (req, res) => {
  res.json({
    network: 'Hedera Testnet',
    connected: true,
    blockHeight: 12345678,
    nodeCount: 247,
    uptime: '98.7%'
  });
});

// NFC Scan endpoint
app.post('/api/nfc/scan', async (req, res) => {
  try {
    const { nfcData } = req.body;
    
    // Real NFC processing
    const nfcResult = await nfcService.readNFCCard();
    
    if (!nfcResult.success) {
      return res.status(400).json({ error: 'NFC scan failed' });
    }

    // Validate NFC card
    const validation = nfcService.validateNFCCard(nfcResult.walletData);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }

    res.json({
      success: true,
      cardId: nfcResult.cardId,
      walletData: nfcResult.walletData,
      signalStrength: nfcResult.signalStrength,
      readTime: nfcResult.readTime,
      validated: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Token creation endpoint
app.post('/api/tokens/create', (req, res) => {
  const { assetData, tokenConfig } = req.body;
  
  // Mock token creation
  setTimeout(() => {
    res.json({
      success: true,
      tokenId: '0.0.' + (Math.floor(Math.random() * 900000) + 100000),
      symbol: tokenConfig?.symbol || 'DEMO001',
      supply: tokenConfig?.initialSupply || '1000000',
      txHash: '0.0.2@' + Date.now() + '.123456789',
      explorerUrl: 'https://hashscan.io/testnet/token/0.0.123456'
    });
  }, 2000);
});

// AI Fraud Detection endpoint
app.post('/api/ai/fraud-detection/analyze', (req, res) => {
  const { transaction } = req.body;
  
  // Mock AI analysis
  setTimeout(() => {
    const riskScore = Math.random() * 0.3; // Low risk for demo
    res.json({
      success: true,
      riskScore: riskScore,
      riskLevel: riskScore < 0.3 ? 'LOW' : riskScore < 0.7 ? 'MEDIUM' : 'HIGH',
      decision: riskScore < 0.3 ? 'APPROVE' : 'REVIEW',
      confidence: 0.992,
      processingTime: '485ms',
      features: {
        behavioralScore: 0.95,
        locationScore: 0.98,
        deviceScore: 0.94,
        timeScore: 0.97
      }
    });
  }, 485);
});

// AMM Swap endpoint
app.post('/api/amm/swap', (req, res) => {
  const { fromToken, toToken, amountIn } = req.body;
  
  // Mock swap calculation
  const rate = fromToken === 'FARM001' ? 0.00523 : 191.2;
  const amountOut = parseFloat(amountIn) * rate;
  
  setTimeout(() => {
    res.json({
      success: true,
      fromToken,
      toToken,
      amountIn,
      amountOut: amountOut.toFixed(6),
      rate: rate,
      priceImpact: '0.12%',
      txHash: '0.0.2@' + Date.now() + '.987654321',
      gasUsed: '0.001 HBAR'
    });
  }, 1500);
});

// DePIN Network status
app.get('/api/depin/network/status', (req, res) => {
  res.json({
    totalNodes: 247,
    activeNodes: 243,
    networkUptime: 0.987,
    avgLatency: 125,
    cityHubs: [
      { city: 'New York', nodes: 45, latency: 98 },
      { city: 'London', nodes: 38, latency: 112 },
      { city: 'Tokyo', nodes: 42, latency: 134 },
      { city: 'Singapore', nodes: 35, latency: 89 }
    ],
    totalStaked: '2.3M HBAR',
    rewardRate: '87% APR'
  });
});

// Oracle price feeds
app.get('/api/oracle/prices', (req, res) => {
  res.json({
    'HBAR/USD': { 
      price: 0.0523 + (Math.random() - 0.5) * 0.001, 
      priceChangePercent: (Math.random() - 0.5) * 10 
    },
    'BTC/USD': { 
      price: 43250 + (Math.random() - 0.5) * 1000, 
      priceChangePercent: (Math.random() - 0.5) * 5 
    },
    'ETH/USD': { 
      price: 2650 + (Math.random() - 0.5) * 100, 
      priceChangePercent: (Math.random() - 0.5) * 8 
    },
    'USDC/USD': { 
      price: 1.00, 
      priceChangePercent: 0.0 
    }
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 HederaKey API Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
