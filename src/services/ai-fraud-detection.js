import crypto from 'crypto';
import logger from '../utils/logger';
import { encryptGDPRData, DATA_CLASSIFICATION } from '../utils/encryption';

// Fraud detection thresholds and parameters
const FRAUD_THRESHOLDS = {
  VELOCITY_THRESHOLD: 10, // Max transactions per minute
  AMOUNT_THRESHOLD: 10000, // Max transaction amount
  LOCATION_RADIUS: 100, // Max km between consecutive transactions
  TIME_WINDOW: 300, // 5 minutes in seconds
  ANOMALY_SCORE_THRESHOLD: 0.7, // AI model threshold
  PATTERN_SIMILARITY_THRESHOLD: 0.8
};

// Risk levels for fraud detection
const RISK_LEVELS = {
  LOW: { score: 0.0, action: 'APPROVE', color: '#10b981' },
  MEDIUM: { score: 0.3, action: 'REVIEW', color: '#f59e0b' },
  HIGH: { score: 0.7, action: 'BLOCK', color: '#ef4444' },
  CRITICAL: { score: 0.9, action: 'BLOCK_PERMANENT', color: '#dc2626' }
};

// Feature extraction for ML model
class FeatureExtractor {
  constructor() {
    this.userProfiles = new Map();
    this.transactionHistory = new Map();
    this.locationHistory = new Map();
  }

  extractFeatures(transaction, userHistory = []) {
    const features = {
      // Transaction features
      amount: parseFloat(transaction.amount) || 0,
      timestamp: new Date(transaction.timestamp).getTime(),
      transactionType: this.encodeTransactionType(transaction.type),
      
      // User behavior features
      hourOfDay: new Date(transaction.timestamp).getHours(),
      dayOfWeek: new Date(transaction.timestamp).getDay(),
      
      // Velocity features
      transactionsLast5Min: this.countRecentTransactions(userHistory, 5),
      transactionsLast1Hour: this.countRecentTransactions(userHistory, 60),
      transactionsLast24Hours: this.countRecentTransactions(userHistory, 1440),
      
      // Amount patterns
      avgTransactionAmount: this.calculateAvgAmount(userHistory),
      maxTransactionAmount: this.calculateMaxAmount(userHistory),
      amountDeviation: this.calculateAmountDeviation(transaction.amount, userHistory),
      
      // Location features (if available)
      locationLat: parseFloat(transaction.location?.lat) || 0,
      locationLng: parseFloat(transaction.location?.lng) || 0,
      locationChange: this.calculateLocationChange(transaction, userHistory),
      
      // Device/NFC features
      deviceFingerprint: this.hashDeviceFingerprint(transaction.deviceInfo),
      nfcTagId: transaction.nfcData?.tagId ? 1 : 0,
      nfcVerified: transaction.nfcData?.verified ? 1 : 0,
      
      // Network features
      ipAddress: this.hashIP(transaction.ipAddress),
      userAgent: this.hashUserAgent(transaction.userAgent),
      
      // Account features
      accountAge: this.calculateAccountAge(transaction.accountId),
      kycVerified: transaction.kycVerified ? 1 : 0,
      complianceScore: parseFloat(transaction.complianceScore) || 0.5
    };

    return this.normalizeFeatures(features);
  }

  encodeTransactionType(type) {
    const typeMap = {
      'transfer': 1,
      'mint': 2,
      'burn': 3,
      'swap': 4,
      'lend': 5,
      'borrow': 6,
      'stake': 7
    };
    return typeMap[type] || 0;
  }

  countRecentTransactions(history, minutesBack) {
    const cutoff = Date.now() - (minutesBack * 60 * 1000);
    return history.filter(tx => new Date(tx.timestamp).getTime() > cutoff).length;
  }

  calculateAvgAmount(history) {
    if (history.length === 0) return 0;
    const sum = history.reduce((acc, tx) => acc + parseFloat(tx.amount || 0), 0);
    return sum / history.length;
  }

  calculateMaxAmount(history) {
    if (history.length === 0) return 0;
    return Math.max(...history.map(tx => parseFloat(tx.amount || 0)));
  }

  calculateAmountDeviation(currentAmount, history) {
    const avg = this.calculateAvgAmount(history);
    if (avg === 0) return 0;
    return Math.abs(currentAmount - avg) / avg;
  }

  calculateLocationChange(transaction, history) {
    if (!transaction.location || history.length === 0) return 0;
    
    const lastTx = history[history.length - 1];
    if (!lastTx.location) return 0;

    return this.haversineDistance(
      transaction.location.lat, transaction.location.lng,
      lastTx.location.lat, lastTx.location.lng
    );
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI/180);
  }

  hashDeviceFingerprint(deviceInfo) {
    if (!deviceInfo) return 0;
    const fingerprint = `${deviceInfo.userAgent}-${deviceInfo.screen}-${deviceInfo.timezone}`;
    return parseInt(crypto.createHash('md5').update(fingerprint).digest('hex').substring(0, 8), 16) / 0xffffffff;
  }

  hashIP(ipAddress) {
    if (!ipAddress) return 0;
    return parseInt(crypto.createHash('md5').update(ipAddress).digest('hex').substring(0, 8), 16) / 0xffffffff;
  }

  hashUserAgent(userAgent) {
    if (!userAgent) return 0;
    return parseInt(crypto.createHash('md5').update(userAgent).digest('hex').substring(0, 8), 16) / 0xffffffff;
  }

  calculateAccountAge(accountId) {
    // Simplified account age calculation
    const profile = this.userProfiles.get(accountId);
    if (!profile) return 0;
    
    const created = new Date(profile.createdAt);
    const now = new Date();
    return (now - created) / (1000 * 60 * 60 * 24); // Days
  }

  normalizeFeatures(features) {
    // Normalize features to 0-1 range for ML model
    const normalized = { ...features };
    
    // Normalize amount (log scale)
    normalized.amount = Math.log(Math.max(features.amount, 1)) / Math.log(100000);
    
    // Normalize time features
    normalized.hourOfDay = features.hourOfDay / 24;
    normalized.dayOfWeek = features.dayOfWeek / 7;
    
    // Normalize velocity features
    normalized.transactionsLast5Min = Math.min(features.transactionsLast5Min / 10, 1);
    normalized.transactionsLast1Hour = Math.min(features.transactionsLast1Hour / 50, 1);
    normalized.transactionsLast24Hours = Math.min(features.transactionsLast24Hours / 200, 1);
    
    // Normalize location change (km)
    normalized.locationChange = Math.min(features.locationChange / 1000, 1);
    
    // Normalize account age (days)
    normalized.accountAge = Math.min(features.accountAge / 365, 1);

    return normalized;
  }
}

// Lightweight ML model implementation
class FraudDetectionModel {
  constructor() {
    this.weights = this.initializeWeights();
    this.bias = 0;
    this.trainingData = [];
    this.modelVersion = '1.0.0';
    this.lastTraining = new Date().toISOString();
  }

  initializeWeights() {
    // Initialize weights for key features (simplified logistic regression)
    return {
      amount: 0.15,
      transactionType: 0.05,
      hourOfDay: 0.08,
      dayOfWeek: 0.03,
      transactionsLast5Min: 0.25,
      transactionsLast1Hour: 0.20,
      transactionsLast24Hours: 0.10,
      avgTransactionAmount: 0.12,
      amountDeviation: 0.18,
      locationChange: 0.22,
      deviceFingerprint: 0.08,
      nfcVerified: -0.15, // Negative weight (NFC verification reduces fraud risk)
      accountAge: -0.10,
      kycVerified: -0.12,
      complianceScore: -0.08
    };
  }

  predict(features) {
    // Simple logistic regression prediction
    let score = this.bias;
    
    for (const [feature, value] of Object.entries(features)) {
      if (this.weights[feature] !== undefined) {
        score += this.weights[feature] * value;
      }
    }

    // Apply sigmoid function
    const probability = 1 / (1 + Math.exp(-score));
    
    return {
      fraudProbability: probability,
      riskScore: probability,
      confidence: this.calculateConfidence(features),
      modelVersion: this.modelVersion
    };
  }

  calculateConfidence(features) {
    // Calculate prediction confidence based on feature completeness
    const totalFeatures = Object.keys(this.weights).length;
    const availableFeatures = Object.keys(features).filter(key => 
      this.weights[key] !== undefined && features[key] !== 0
    ).length;
    
    return Math.min(availableFeatures / totalFeatures, 1.0);
  }

  updateModel(newData) {
    // Simple online learning update (simplified gradient descent)
    this.trainingData.push(...newData);
    
    // Keep only recent training data for efficiency
    if (this.trainingData.length > 10000) {
      this.trainingData = this.trainingData.slice(-5000);
    }

    // Update weights based on recent feedback
    this.performOnlineLearning();
    this.lastTraining = new Date().toISOString();
  }

  performOnlineLearning() {
    // Simplified online learning (would use proper ML library in production)
    const learningRate = 0.01;
    const recentData = this.trainingData.slice(-100);

    for (const sample of recentData) {
      const prediction = this.predict(sample.features);
      const error = sample.label - prediction.fraudProbability;

      // Update weights
      for (const [feature, value] of Object.entries(sample.features)) {
        if (this.weights[feature] !== undefined) {
          this.weights[feature] += learningRate * error * value;
        }
      }
      
      this.bias += learningRate * error;
    }
  }
}

// Main AI Fraud Detection Engine
class AIFraudDetectionEngine {
  constructor() {
    this.featureExtractor = new FeatureExtractor();
    this.model = new FraudDetectionModel();
    this.hcsLogs = new Map();
    this.fraudCases = new Map();
    this.performanceMetrics = {
      totalPredictions: 0,
      correctPredictions: 0,
      falsePositives: 0,
      falseNegatives: 0,
      avgLatency: 0
    };
    this.realTimeStats = {
      transactionsProcessed: 0,
      fraudDetected: 0,
      autoApproved: 0,
      autoBlocked: 0,
      manualReview: 0
    };
  }

  async analyzeTransaction(transaction, userHistory = []) {
    const startTime = Date.now();
    
    try {
      logger.info('AIFraudDetection', 'analyzeTransaction', `Analyzing transaction: ${transaction.id}`);

      // Step 1: Extract features
      const features = this.featureExtractor.extractFeatures(transaction, userHistory);

      // Step 2: Run ML prediction
      const prediction = this.model.predict(features);

      // Step 3: Apply rule-based checks
      const ruleBasedResult = this.applyRuleBasedChecks(transaction, userHistory);

      // Step 4: Combine ML and rule-based results
      const finalScore = this.combineScores(prediction, ruleBasedResult);

      // Step 5: Make decision
      const decision = this.makeDecision(finalScore);

      // Step 6: Log to HCS
      await this.logToHCS(transaction, features, prediction, decision);

      // Step 7: Update metrics
      this.updateMetrics(startTime, decision);

      const result = {
        transactionId: transaction.id,
        fraudScore: finalScore.riskScore,
        riskLevel: finalScore.riskLevel,
        decision: decision.action,
        confidence: prediction.confidence,
        reasons: [...ruleBasedResult.reasons, ...finalScore.reasons],
        processingTime: Date.now() - startTime,
        modelVersion: this.model.modelVersion,
        timestamp: new Date().toISOString()
      };

      logger.info('AIFraudDetection', 'analyzeTransaction', 
        `Transaction ${transaction.id}: ${decision.action} (score: ${finalScore.riskScore.toFixed(3)})`);

      return result;

    } catch (error) {
      logger.error('AIFraudDetection', 'analyzeTransaction', error.message);
      
      // Fail-safe: approve transaction if AI fails
      return {
        transactionId: transaction.id,
        fraudScore: 0.5,
        riskLevel: 'MEDIUM',
        decision: 'REVIEW',
        confidence: 0.0,
        reasons: ['AI analysis failed - manual review required'],
        processingTime: Date.now() - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  applyRuleBasedChecks(transaction, userHistory) {
    const reasons = [];
    let riskScore = 0;

    // Velocity check
    const recentTxCount = userHistory.filter(tx => 
      Date.now() - new Date(tx.timestamp).getTime() < FRAUD_THRESHOLDS.TIME_WINDOW * 1000
    ).length;

    if (recentTxCount > FRAUD_THRESHOLDS.VELOCITY_THRESHOLD) {
      riskScore += 0.3;
      reasons.push(`High velocity: ${recentTxCount} transactions in 5 minutes`);
    }

    // Amount check
    if (parseFloat(transaction.amount) > FRAUD_THRESHOLDS.AMOUNT_THRESHOLD) {
      riskScore += 0.2;
      reasons.push(`Large amount: ${transaction.amount}`);
    }

    // Location check
    if (userHistory.length > 0) {
      const lastTx = userHistory[userHistory.length - 1];
      if (transaction.location && lastTx.location) {
        const distance = this.featureExtractor.calculateLocationChange(transaction, userHistory);
        const timeDiff = (new Date(transaction.timestamp) - new Date(lastTx.timestamp)) / 1000 / 60; // minutes
        
        if (distance > FRAUD_THRESHOLDS.LOCATION_RADIUS && timeDiff < 60) {
          riskScore += 0.4;
          reasons.push(`Impossible travel: ${distance.toFixed(1)}km in ${timeDiff.toFixed(1)} minutes`);
        }
      }
    }

    // Time-based anomalies
    const hour = new Date(transaction.timestamp).getHours();
    if (hour < 6 || hour > 23) {
      riskScore += 0.1;
      reasons.push('Unusual time of day');
    }

    // NFC verification bonus
    if (transaction.nfcData?.verified) {
      riskScore -= 0.2;
      reasons.push('NFC verified transaction');
    }

    // KYC verification bonus
    if (transaction.kycVerified) {
      riskScore -= 0.15;
      reasons.push('KYC verified user');
    }

    return {
      riskScore: Math.max(0, Math.min(1, riskScore)),
      reasons
    };
  }

  combineScores(mlResult, ruleResult) {
    // Weighted combination of ML and rule-based scores
    const mlWeight = 0.7;
    const ruleWeight = 0.3;
    
    const combinedScore = (mlResult.fraudProbability * mlWeight) + (ruleResult.riskScore * ruleWeight);
    
    let riskLevel = 'LOW';
    if (combinedScore >= RISK_LEVELS.CRITICAL.score) {
      riskLevel = 'CRITICAL';
    } else if (combinedScore >= RISK_LEVELS.HIGH.score) {
      riskLevel = 'HIGH';
    } else if (combinedScore >= RISK_LEVELS.MEDIUM.score) {
      riskLevel = 'MEDIUM';
    }

    return {
      riskScore: combinedScore,
      riskLevel,
      reasons: ruleResult.reasons,
      mlScore: mlResult.fraudProbability,
      ruleScore: ruleResult.riskScore
    };
  }

  makeDecision(scoreResult) {
    const { riskScore, riskLevel } = scoreResult;
    const riskConfig = RISK_LEVELS[riskLevel];
    
    let action = riskConfig.action;
    let autoProcessed = true;

    // Additional decision logic
    if (riskLevel === 'MEDIUM' && riskScore < 0.5) {
      action = 'APPROVE';
    } else if (riskLevel === 'MEDIUM') {
      action = 'REVIEW';
      autoProcessed = false;
    }

    return {
      action,
      autoProcessed,
      riskLevel,
      riskScore,
      timestamp: new Date().toISOString()
    };
  }

  async logToHCS(transaction, features, prediction, decision) {
    try {
      // Create HCS log entry
      const logEntry = {
        id: crypto.randomUUID(),
        transactionId: transaction.id,
        accountId: transaction.accountId,
        timestamp: new Date().toISOString(),
        fraudScore: prediction.fraudProbability,
        decision: decision.action,
        features: await encryptGDPRData(JSON.stringify(features), DATA_CLASSIFICATION.SENSITIVE, 'fraud_detection'),
        modelVersion: this.model.modelVersion
      };

      // Store in HCS logs (simulated)
      this.hcsLogs.set(logEntry.id, logEntry);

      // In production, this would submit to Hedera Consensus Service
      logger.info('AIFraudDetection', 'logToHCS', `Logged transaction ${transaction.id} to HCS`);

    } catch (error) {
      logger.error('AIFraudDetection', 'logToHCS', error.message);
    }
  }

  updateMetrics(startTime, decision) {
    const processingTime = Date.now() - startTime;
    
    this.performanceMetrics.totalPredictions++;
    this.performanceMetrics.avgLatency = 
      (this.performanceMetrics.avgLatency * (this.performanceMetrics.totalPredictions - 1) + processingTime) / 
      this.performanceMetrics.totalPredictions;

    this.realTimeStats.transactionsProcessed++;
    
    switch (decision.action) {
      case 'APPROVE':
        this.realTimeStats.autoApproved++;
        break;
      case 'BLOCK':
      case 'BLOCK_PERMANENT':
        this.realTimeStats.autoBlocked++;
        break;
      case 'REVIEW':
        this.realTimeStats.manualReview++;
        break;
    }

    if (decision.riskLevel === 'HIGH' || decision.riskLevel === 'CRITICAL') {
      this.realTimeStats.fraudDetected++;
    }
  }

  async provideFeedback(transactionId, actualFraud) {
    try {
      // Find the original prediction
      const hcsLog = Array.from(this.hcsLogs.values())
        .find(log => log.transactionId === transactionId);

      if (!hcsLog) {
        throw new Error('Transaction log not found');
      }

      // Update performance metrics
      if ((hcsLog.fraudScore > 0.5) === actualFraud) {
        this.performanceMetrics.correctPredictions++;
      } else if (hcsLog.fraudScore > 0.5 && !actualFraud) {
        this.performanceMetrics.falsePositives++;
      } else if (hcsLog.fraudScore <= 0.5 && actualFraud) {
        this.performanceMetrics.falseNegatives++;
      }

      // Add to training data for model improvement
      const features = JSON.parse(await decryptGDPRData(hcsLog.features));
      this.model.trainingData.push({
        features,
        label: actualFraud ? 1 : 0,
        timestamp: new Date().toISOString()
      });

      // Retrain model if enough new data
      if (this.model.trainingData.length % 100 === 0) {
        this.model.updateModel([]);
      }

      logger.info('AIFraudDetection', 'provideFeedback', 
        `Feedback received for ${transactionId}: ${actualFraud ? 'fraud' : 'legitimate'}`);

    } catch (error) {
      logger.error('AIFraudDetection', 'provideFeedback', error.message);
    }
  }

  getPerformanceMetrics() {
    const accuracy = this.performanceMetrics.totalPredictions > 0 ? 
      this.performanceMetrics.correctPredictions / this.performanceMetrics.totalPredictions : 0;

    const precision = (this.performanceMetrics.correctPredictions + this.performanceMetrics.falsePositives) > 0 ?
      this.performanceMetrics.correctPredictions / (this.performanceMetrics.correctPredictions + this.performanceMetrics.falsePositives) : 0;

    const recall = (this.performanceMetrics.correctPredictions + this.performanceMetrics.falseNegatives) > 0 ?
      this.performanceMetrics.correctPredictions / (this.performanceMetrics.correctPredictions + this.performanceMetrics.falseNegatives) : 0;

    return {
      ...this.performanceMetrics,
      accuracy,
      precision,
      recall,
      f1Score: precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0
    };
  }

  getRealTimeStats() {
    return {
      ...this.realTimeStats,
      fraudRate: this.realTimeStats.transactionsProcessed > 0 ? 
        this.realTimeStats.fraudDetected / this.realTimeStats.transactionsProcessed : 0,
      autoProcessingRate: this.realTimeStats.transactionsProcessed > 0 ?
        (this.realTimeStats.autoApproved + this.realTimeStats.autoBlocked) / this.realTimeStats.transactionsProcessed : 0
    };
  }

  getHCSLogs(limit = 100) {
    const logs = Array.from(this.hcsLogs.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return logs.map(log => ({
      ...log,
      features: '[ENCRYPTED]' // Don't expose raw features
    }));
  }
}

// Create singleton instance
const aiFraudDetectionEngine = new AIFraudDetectionEngine();

// Export functions
const analyzeTransaction = async (transaction, userHistory) => {
  return await aiFraudDetectionEngine.analyzeTransaction(transaction, userHistory);
};

const provideFeedback = async (transactionId, actualFraud) => {
  return await aiFraudDetectionEngine.provideFeedback(transactionId, actualFraud);
};

const getPerformanceMetrics = () => {
  return aiFraudDetectionEngine.getPerformanceMetrics();
};

const getRealTimeStats = () => {
  return aiFraudDetectionEngine.getRealTimeStats();
};

const getHCSLogs = (limit) => {
  return aiFraudDetectionEngine.getHCSLogs(limit);
};

export {
  FRAUD_THRESHOLDS,
  RISK_LEVELS,
  AIFraudDetectionEngine,
  analyzeTransaction,
  provideFeedback,
  getPerformanceMetrics,
  getRealTimeStats,
  getHCSLogs
};
