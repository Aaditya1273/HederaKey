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
const contractService = require('./src/services/contracts');
const dbService = require('./src/database/sqlite');
const aiService = require('./src/services/ai-integration');

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
app.get('/health', async (req, res) => {
  try {
    const [dbHealth, aiHealth, contractHealth] = await Promise.all([
      dbService.healthCheck(),
      aiService.healthCheck(),
      contractService.getNetworkInfo()
    ]);

    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      service: 'HederaKey API',
      services: {
        database: dbHealth,
        ai: aiHealth,
        contracts: contractHealth,
        hedera: hederaService ? 'ready' : 'not initialized',
        nfc: 'ready',
        unstoppable: 'ready'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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
app.post('/api/ai/fraud-detection/analyze', async (req, res) => {
  try {
    const { transaction, userHistory } = req.body;
    
    // Real AI analysis
    const fraudAnalysis = await aiService.analyzeFraud(transaction, userHistory);
    
    // Store fraud score in database
    if (transaction.userId) {
      await dbService.createFraudScore({
        userId: transaction.userId,
        riskScore: fraudAnalysis.riskScore,
        riskLevel: fraudAnalysis.riskLevel,
        confidence: fraudAnalysis.confidence,
        decision: fraudAnalysis.decision,
        behavioralScore: fraudAnalysis.features?.behavioralScore,
        locationScore: fraudAnalysis.features?.locationScore,
        deviceScore: fraudAnalysis.features?.deviceScore,
        timeScore: fraudAnalysis.features?.velocityScore,
        transactionId: transaction.id
      });
    }

    res.json({
      success: true,
      ...fraudAnalysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
app.get('/api/depin/network/status', async (req, res) => {
  try {
    // Get real DePIN nodes from database
    const nodes = await dbService.getDePINNodes();
    
    // Calculate network statistics
    const totalNodes = nodes.length;
    const activeNodes = nodes.filter(n => n.status === 'ACTIVE').length;
    const avgUptime = nodes.reduce((sum, n) => sum + (n.uptime || 0), 0) / totalNodes;
    const avgLatency = nodes.reduce((sum, n) => sum + (n.latency || 0), 0) / totalNodes;
    const totalStaked = nodes.reduce((sum, n) => sum + (n.staked_amount || 0), 0);

    // Group by city
    const cityHubs = nodes.reduce((hubs, node) => {
      const existing = hubs.find(h => h.city === node.city);
      if (existing) {
        existing.nodes += 1;
        existing.latency = (existing.latency + node.latency) / 2;
      } else {
        hubs.push({
          city: node.city,
          country: node.country,
          nodes: 1,
          latency: node.latency || 0,
          uptime: node.uptime || 0
        });
      }
      return hubs;
    }, []);

    res.json({
      totalNodes,
      activeNodes,
      networkUptime: avgUptime / 100,
      avgLatency: Math.round(avgLatency),
      cityHubs,
      totalStaked: `${(totalStaked / 1000).toFixed(1)}K HBAR`,
      rewardRate: '87% APR',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
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

// Analytics Dashboard
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const analytics = await dbService.getAnalytics();
    
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: analytics.totalUsers,
          totalAssets: analytics.totalAssets,
          totalTransactions: analytics.totalTransactions,
          totalNodes: analytics.totalNodes,
          totalValuation: analytics.totalValuation,
          avgUptime: analytics.avgUptime
        },
        metrics: {
          usersImpacted: analytics.totalUsers,
          liquidityUnlocked: `$${(analytics.totalValuation || 0).toLocaleString()}`,
          fraudReduction: '99.2%',
          costSavings: '95%',
          transactionVolume: `$${(analytics.totalValuation * 0.3 || 0).toLocaleString()}`,
          networkCoverage: '20 cities'
        },
        growth: {
          userGrowth: '+340% MoM',
          assetGrowth: '+520% MoM',
          transactionGrowth: '+280% MoM',
          nodeGrowth: '+15 this month'
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// User Management
app.post('/api/users/create', async (req, res) => {
  try {
    const userData = req.body;
    const user = await dbService.createUser(userData);
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/users/hedera/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const user = await dbService.getUserByHederaAccount(accountId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Asset Management
app.post('/api/assets/create', async (req, res) => {
  try {
    const assetData = req.body;
    const asset = await dbService.createAsset(assetData);
    
    res.json({
      success: true,
      asset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
