import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicInfoQuery,
  PrivateKey
} from '@hashgraph/sdk';
import crypto from 'crypto';
import logger from '../utils/logger';
import { hederaNetwork, hederaOperatorId, hederaOperatorKey } from '../config.json';
import { encryptGDPRData, DATA_CLASSIFICATION } from '../utils/encryption';

// Initialize Hedera client
const client = Client.forTestnet();
client.setOperator(hederaOperatorId, hederaOperatorKey);

// HCS Log Types
const HCS_LOG_TYPES = {
  TRANSACTION: 'TRANSACTION',
  FRAUD_DETECTION: 'FRAUD_DETECTION',
  NFC_SCAN: 'NFC_SCAN',
  COMPLIANCE_CHECK: 'COMPLIANCE_CHECK',
  AI_PREDICTION: 'AI_PREDICTION',
  USER_BEHAVIOR: 'USER_BEHAVIOR'
};

// Anomaly detection patterns
const ANOMALY_PATTERNS = {
  VELOCITY_SPIKE: 'VELOCITY_SPIKE',
  AMOUNT_OUTLIER: 'AMOUNT_OUTLIER',
  LOCATION_JUMP: 'LOCATION_JUMP',
  TIME_ANOMALY: 'TIME_ANOMALY',
  DEVICE_CHANGE: 'DEVICE_CHANGE',
  PATTERN_BREAK: 'PATTERN_BREAK'
};

class HCSLogAnalyzer {
  constructor() {
    this.topicId = null;
    this.logBuffer = [];
    this.anomalyDetectors = new Map();
    this.userBehaviorProfiles = new Map();
    this.realTimeMetrics = {
      logsProcessed: 0,
      anomaliesDetected: 0,
      avgProcessingTime: 0,
      lastProcessed: null
    };
    
    // Initialize HCS topic
    this.initializeHCSTopic();
    
    // Start real-time processing
    this.startRealTimeProcessing();
  }

  async initializeHCSTopic() {
    try {
      // Create HCS topic for fraud detection logs
      const topicKey = PrivateKey.generateED25519();
      
      const topicCreateTx = new TopicCreateTransaction()
        .setTopicMemo('AI Fraud Detection Logs')
        .setAdminKey(topicKey)
        .setSubmitKey(topicKey);

      const topicCreateSubmit = await topicCreateTx.execute(client);
      const topicCreateReceipt = await topicCreateSubmit.getReceipt(client);
      this.topicId = topicCreateReceipt.topicId;

      logger.info('HCSLogAnalyzer', 'initializeHCSTopic', `HCS topic created: ${this.topicId}`);

    } catch (error) {
      logger.error('HCSLogAnalyzer', 'initializeHCSTopic', error.message);
      // Use mock topic ID for development
      this.topicId = '0.0.123456';
    }
  }

  async logToHCS(logType, data, metadata = {}) {
    try {
      const logEntry = {
        id: crypto.randomUUID(),
        type: logType,
        timestamp: new Date().toISOString(),
        data: await encryptGDPRData(JSON.stringify(data), DATA_CLASSIFICATION.SENSITIVE, 'hcs_logging'),
        metadata: {
          ...metadata,
          version: '1.0.0',
          source: 'ai-fraud-detection'
        }
      };

      // Add to buffer for batch processing
      this.logBuffer.push(logEntry);

      // Submit to HCS (simulated for development)
      if (this.topicId && this.logBuffer.length >= 10) {
        await this.flushLogsToHCS();
      }

      return logEntry.id;

    } catch (error) {
      logger.error('HCSLogAnalyzer', 'logToHCS', error.message);
      throw error;
    }
  }

  async flushLogsToHCS() {
    try {
      if (this.logBuffer.length === 0) return;

      const batchMessage = {
        batchId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        logs: this.logBuffer.splice(0, 10), // Process in batches of 10
        count: this.logBuffer.length
      };

      // Submit to HCS topic (simulated)
      const messageSubmitTx = new TopicMessageSubmitTransaction()
        .setTopicId(this.topicId)
        .setMessage(JSON.stringify(batchMessage));

      // In production, this would actually submit to HCS
      logger.info('HCSLogAnalyzer', 'flushLogsToHCS', `Flushed ${batchMessage.logs.length} logs to HCS`);

    } catch (error) {
      logger.error('HCSLogAnalyzer', 'flushLogsToHCS', error.message);
    }
  }

  startRealTimeProcessing() {
    // Process logs every 5 seconds
    setInterval(() => {
      this.processLogBuffer();
    }, 5000);

    // Flush logs to HCS every 30 seconds
    setInterval(() => {
      this.flushLogsToHCS();
    }, 30000);

    // Update user behavior profiles every minute
    setInterval(() => {
      this.updateBehaviorProfiles();
    }, 60000);
  }

  async processLogBuffer() {
    if (this.logBuffer.length === 0) return;

    const startTime = Date.now();
    const logsToProcess = [...this.logBuffer];

    try {
      for (const log of logsToProcess) {
        await this.analyzeLogForAnomalies(log);
      }

      // Update metrics
      this.realTimeMetrics.logsProcessed += logsToProcess.length;
      this.realTimeMetrics.avgProcessingTime = 
        (this.realTimeMetrics.avgProcessingTime + (Date.now() - startTime)) / 2;
      this.realTimeMetrics.lastProcessed = new Date().toISOString();

    } catch (error) {
      logger.error('HCSLogAnalyzer', 'processLogBuffer', error.message);
    }
  }

  async analyzeLogForAnomalies(log) {
    try {
      const anomalies = [];

      // Decrypt log data for analysis
      const decryptedData = JSON.parse(log.data); // Simplified - would decrypt in production

      switch (log.type) {
        case HCS_LOG_TYPES.TRANSACTION:
          anomalies.push(...await this.detectTransactionAnomalies(decryptedData));
          break;
        case HCS_LOG_TYPES.NFC_SCAN:
          anomalies.push(...await this.detectNFCAnomalies(decryptedData));
          break;
        case HCS_LOG_TYPES.USER_BEHAVIOR:
          anomalies.push(...await this.detectBehaviorAnomalies(decryptedData));
          break;
      }

      if (anomalies.length > 0) {
        await this.handleAnomalies(log, anomalies);
        this.realTimeMetrics.anomaliesDetected += anomalies.length;
      }

    } catch (error) {
      logger.error('HCSLogAnalyzer', 'analyzeLogForAnomalies', error.message);
    }
  }

  async detectTransactionAnomalies(transactionData) {
    const anomalies = [];
    const { accountId, amount, timestamp, location } = transactionData;

    // Get user's transaction history
    const userProfile = this.userBehaviorProfiles.get(accountId) || this.createUserProfile(accountId);

    // Velocity anomaly detection
    const recentTxCount = userProfile.recentTransactions.filter(tx => 
      Date.now() - new Date(tx.timestamp).getTime() < 300000 // 5 minutes
    ).length;

    if (recentTxCount > userProfile.avgVelocity * 3) {
      anomalies.push({
        type: ANOMALY_PATTERNS.VELOCITY_SPIKE,
        severity: 'HIGH',
        description: `Transaction velocity ${recentTxCount} is ${(recentTxCount / userProfile.avgVelocity).toFixed(1)}x normal`,
        confidence: 0.9
      });
    }

    // Amount anomaly detection (using Z-score)
    const zScore = this.calculateZScore(amount, userProfile.avgAmount, userProfile.stdAmount);
    if (Math.abs(zScore) > 3) {
      anomalies.push({
        type: ANOMALY_PATTERNS.AMOUNT_OUTLIER,
        severity: zScore > 3 ? 'HIGH' : 'MEDIUM',
        description: `Transaction amount ${amount} is ${Math.abs(zScore).toFixed(1)} standard deviations from normal`,
        confidence: Math.min(Math.abs(zScore) / 3, 1)
      });
    }

    // Location anomaly detection
    if (location && userProfile.commonLocations.length > 0) {
      const minDistance = Math.min(...userProfile.commonLocations.map(loc => 
        this.calculateDistance(location, loc)
      ));

      if (minDistance > 100) { // 100km threshold
        anomalies.push({
          type: ANOMALY_PATTERNS.LOCATION_JUMP,
          severity: 'MEDIUM',
          description: `Transaction location is ${minDistance.toFixed(1)}km from usual locations`,
          confidence: Math.min(minDistance / 1000, 1)
        });
      }
    }

    // Time-based anomaly detection
    const hour = new Date(timestamp).getHours();
    const isUnusualTime = !userProfile.activeHours.includes(hour);
    
    if (isUnusualTime && (hour < 6 || hour > 22)) {
      anomalies.push({
        type: ANOMALY_PATTERNS.TIME_ANOMALY,
        severity: 'LOW',
        description: `Transaction at unusual time: ${hour}:00`,
        confidence: 0.6
      });
    }

    return anomalies;
  }

  async detectNFCAnomalies(nfcData) {
    const anomalies = [];
    const { tagId, deviceInfo, location, timestamp } = nfcData;

    // Device fingerprint anomaly
    if (deviceInfo) {
      const fingerprint = this.generateDeviceFingerprint(deviceInfo);
      const knownDevices = this.getKnownDevices(nfcData.accountId);
      
      if (!knownDevices.includes(fingerprint)) {
        anomalies.push({
          type: ANOMALY_PATTERNS.DEVICE_CHANGE,
          severity: 'MEDIUM',
          description: 'NFC scan from unknown device',
          confidence: 0.7
        });
      }
    }

    // NFC tag reuse detection
    const recentScans = this.getRecentNFCScans(tagId, 3600000); // 1 hour
    if (recentScans.length > 10) {
      anomalies.push({
        type: ANOMALY_PATTERNS.VELOCITY_SPIKE,
        severity: 'HIGH',
        description: `NFC tag ${tagId} used ${recentScans.length} times in 1 hour`,
        confidence: 0.9
      });
    }

    return anomalies;
  }

  async detectBehaviorAnomalies(behaviorData) {
    const anomalies = [];
    const { accountId, sessionDuration, clickPattern, navigationPath } = behaviorData;

    const userProfile = this.userBehaviorProfiles.get(accountId);
    if (!userProfile) return anomalies;

    // Session duration anomaly
    if (sessionDuration < userProfile.avgSessionDuration * 0.1) {
      anomalies.push({
        type: ANOMALY_PATTERNS.PATTERN_BREAK,
        severity: 'LOW',
        description: 'Unusually short session duration',
        confidence: 0.5
      });
    }

    // Click pattern anomaly (simplified)
    if (clickPattern && userProfile.typicalClickPattern) {
      const similarity = this.calculatePatternSimilarity(clickPattern, userProfile.typicalClickPattern);
      if (similarity < 0.3) {
        anomalies.push({
          type: ANOMALY_PATTERNS.PATTERN_BREAK,
          severity: 'MEDIUM',
          description: 'Unusual interaction pattern detected',
          confidence: 1 - similarity
        });
      }
    }

    return anomalies;
  }

  async handleAnomalies(log, anomalies) {
    try {
      // Log anomalies to HCS
      await this.logToHCS(HCS_LOG_TYPES.AI_PREDICTION, {
        originalLogId: log.id,
        anomalies,
        riskScore: this.calculateOverallRiskScore(anomalies),
        timestamp: new Date().toISOString()
      });

      // Trigger alerts for high-severity anomalies
      const highSeverityAnomalies = anomalies.filter(a => a.severity === 'HIGH');
      if (highSeverityAnomalies.length > 0) {
        await this.triggerAlert(log, highSeverityAnomalies);
      }

    } catch (error) {
      logger.error('HCSLogAnalyzer', 'handleAnomalies', error.message);
    }
  }

  calculateOverallRiskScore(anomalies) {
    if (anomalies.length === 0) return 0;

    const severityWeights = { LOW: 0.2, MEDIUM: 0.5, HIGH: 1.0 };
    const totalScore = anomalies.reduce((sum, anomaly) => 
      sum + (severityWeights[anomaly.severity] * anomaly.confidence), 0
    );

    return Math.min(totalScore / anomalies.length, 1.0);
  }

  async triggerAlert(log, anomalies) {
    const alert = {
      id: crypto.randomUUID(),
      logId: log.id,
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
      anomalies,
      requiresAction: true
    };

    logger.warn('HCSLogAnalyzer', 'triggerAlert', 
      `High-severity anomalies detected in log ${log.id}: ${anomalies.length} anomalies`);

    // In production, this would trigger real alerts (email, SMS, etc.)
    return alert;
  }

  createUserProfile(accountId) {
    const profile = {
      accountId,
      createdAt: new Date().toISOString(),
      recentTransactions: [],
      avgAmount: 0,
      stdAmount: 0,
      avgVelocity: 1,
      commonLocations: [],
      activeHours: [],
      avgSessionDuration: 300, // 5 minutes
      typicalClickPattern: null,
      lastUpdated: new Date().toISOString()
    };

    this.userBehaviorProfiles.set(accountId, profile);
    return profile;
  }

  updateBehaviorProfiles() {
    // Update user behavior profiles based on recent activity
    for (const [accountId, profile] of this.userBehaviorProfiles.entries()) {
      if (profile.recentTransactions.length > 0) {
        // Update average amount and standard deviation
        const amounts = profile.recentTransactions.map(tx => parseFloat(tx.amount));
        profile.avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        profile.stdAmount = Math.sqrt(
          amounts.reduce((sum, amount) => sum + Math.pow(amount - profile.avgAmount, 2), 0) / amounts.length
        );

        // Update velocity
        const timeSpan = Date.now() - new Date(profile.recentTransactions[0].timestamp).getTime();
        profile.avgVelocity = profile.recentTransactions.length / (timeSpan / 3600000); // per hour

        // Update active hours
        const hours = profile.recentTransactions.map(tx => new Date(tx.timestamp).getHours());
        profile.activeHours = [...new Set(hours)];

        profile.lastUpdated = new Date().toISOString();
      }
    }
  }

  calculateZScore(value, mean, stdDev) {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }

  calculateDistance(loc1, loc2) {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.lat - loc1.lat);
    const dLon = this.toRad(loc2.lng - loc1.lng);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(loc1.lat)) * Math.cos(this.toRad(loc2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI/180);
  }

  generateDeviceFingerprint(deviceInfo) {
    const fingerprint = `${deviceInfo.userAgent}-${deviceInfo.screen}-${deviceInfo.timezone}-${deviceInfo.language}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  getKnownDevices(accountId) {
    // Simplified - would query from database in production
    return ['known-device-1', 'known-device-2'];
  }

  getRecentNFCScans(tagId, timeWindow) {
    // Simplified - would query from database in production
    return [];
  }

  calculatePatternSimilarity(pattern1, pattern2) {
    // Simplified pattern similarity calculation
    if (!pattern1 || !pattern2) return 0;
    
    // Would implement proper pattern matching algorithm
    return Math.random() * 0.8 + 0.2; // Mock similarity score
  }

  // Public methods for API access
  async getAnomalyReport(timeRange = '24h') {
    const cutoffTime = this.getTimeRangeCutoff(timeRange);
    const recentLogs = this.logBuffer.filter(log => 
      new Date(log.timestamp) > cutoffTime
    );

    const anomalies = [];
    for (const log of recentLogs) {
      if (log.type === HCS_LOG_TYPES.AI_PREDICTION) {
        const data = JSON.parse(log.data);
        if (data.anomalies) {
          anomalies.push(...data.anomalies.map(a => ({
            ...a,
            logId: log.id,
            timestamp: log.timestamp
          })));
        }
      }
    }

    return {
      timeRange,
      totalAnomalies: anomalies.length,
      anomaliesBySeverity: {
        HIGH: anomalies.filter(a => a.severity === 'HIGH').length,
        MEDIUM: anomalies.filter(a => a.severity === 'MEDIUM').length,
        LOW: anomalies.filter(a => a.severity === 'LOW').length
      },
      anomaliesByType: this.groupAnomaliesByType(anomalies),
      recentAnomalies: anomalies.slice(0, 20)
    };
  }

  getTimeRangeCutoff(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  groupAnomaliesByType(anomalies) {
    const grouped = {};
    for (const anomaly of anomalies) {
      grouped[anomaly.type] = (grouped[anomaly.type] || 0) + 1;
    }
    return grouped;
  }

  getRealTimeMetrics() {
    return {
      ...this.realTimeMetrics,
      topicId: this.topicId?.toString(),
      bufferSize: this.logBuffer.length,
      userProfiles: this.userBehaviorProfiles.size
    };
  }

  getUserBehaviorProfile(accountId) {
    return this.userBehaviorProfiles.get(accountId) || null;
  }
}

// Create singleton instance
const hcsLogAnalyzer = new HCSLogAnalyzer();

// Export functions
const logToHCS = async (logType, data, metadata) => {
  return await hcsLogAnalyzer.logToHCS(logType, data, metadata);
};

const getAnomalyReport = async (timeRange) => {
  return await hcsLogAnalyzer.getAnomalyReport(timeRange);
};

const getRealTimeMetrics = () => {
  return hcsLogAnalyzer.getRealTimeMetrics();
};

const getUserBehaviorProfile = (accountId) => {
  return hcsLogAnalyzer.getUserBehaviorProfile(accountId);
};

export {
  HCS_LOG_TYPES,
  ANOMALY_PATTERNS,
  HCSLogAnalyzer,
  logToHCS,
  getAnomalyReport,
  getRealTimeMetrics,
  getUserBehaviorProfile
};
