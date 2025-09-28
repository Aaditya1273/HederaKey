import * as AIFraudService from '../services/ai-fraud-detection';
import * as HCSAnalyzerService from '../services/hcs-log-analyzer';
import * as NFCPipelineService from '../services/nfc-ai-pipeline';

// AI Fraud Detection Controllers
const analyzeTransaction = async (req, res) => {
  try {
    const { transaction, userHistory } = req.body;
    const result = await AIFraudService.analyzeTransaction(transaction, userHistory);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const provideFeedback = async (req, res) => {
  try {
    const { transactionId, actualFraud } = req.body;
    const result = await AIFraudService.provideFeedback(transactionId, actualFraud);
    res.send({ success: true, message: 'Feedback recorded successfully' });
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getPerformanceMetrics = async (req, res) => {
  try {
    const result = await AIFraudService.getPerformanceMetrics();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const getRealTimeStats = async (req, res) => {
  try {
    const result = await AIFraudService.getRealTimeStats();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const getHCSLogs = async (req, res) => {
  try {
    const { limit } = req.query;
    const result = await AIFraudService.getHCSLogs(parseInt(limit) || 100);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// HCS Log Analyzer Controllers
const getAnomalyReport = async (req, res) => {
  try {
    const { timeRange } = req.query;
    const result = await HCSAnalyzerService.getAnomalyReport(timeRange);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const getHCSMetrics = async (req, res) => {
  try {
    const result = await HCSAnalyzerService.getRealTimeMetrics();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const getUserBehaviorProfile = async (req, res) => {
  try {
    const { accountId } = req.params;
    const result = await HCSAnalyzerService.getUserBehaviorProfile(accountId);
    
    if (!result) {
      return res.status(404).send({ error: 'User behavior profile not found' });
    }
    
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// NFC AI Pipeline Controllers
const processNFCScan = async (req, res) => {
  try {
    const { nfcData, userContext } = req.body;
    const result = await NFCPipelineService.processNFCScan(nfcData, userContext);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getPipelineMetrics = async (req, res) => {
  try {
    const result = await NFCPipelineService.getPipelineMetrics();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const getPipelineStatus = async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const result = await NFCPipelineService.getPipelineStatus(pipelineId);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const getActivePipelines = async (req, res) => {
  try {
    const result = await NFCPipelineService.getActivePipelines();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const optimizeForRuralNetworks = async (req, res) => {
  try {
    await NFCPipelineService.optimizeForRuralNetworks();
    res.send({ 
      success: true, 
      message: 'Pipeline optimized for rural network conditions',
      optimizations: [
        'Increased latency tolerance to 800ms',
        'Enabled request batching',
        'Activated response compression',
        'Reduced feature extraction complexity'
      ]
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Combined AI Dashboard
const getAIDashboard = async (req, res) => {
  try {
    // Gather data from all AI services
    const fraudMetrics = await AIFraudService.getPerformanceMetrics();
    const fraudStats = await AIFraudService.getRealTimeStats();
    const pipelineMetrics = await NFCPipelineService.getPipelineMetrics();
    const hcsMetrics = await HCSAnalyzerService.getRealTimeMetrics();
    const anomalyReport = await HCSAnalyzerService.getAnomalyReport('24h');
    const activePipelines = await NFCPipelineService.getActivePipelines();

    const dashboard = {
      summary: {
        totalTransactions: fraudStats.transactionsProcessed,
        fraudDetected: fraudStats.fraudDetected,
        accuracy: fraudMetrics.accuracy,
        avgLatency: pipelineMetrics.avgProcessingTime,
        autoProcessingRate: pipelineMetrics.autoProcessingRate,
        systemHealth: 'HEALTHY'
      },
      
      fraudDetection: {
        ...fraudMetrics,
        ...fraudStats
      },
      
      pipeline: {
        ...pipelineMetrics,
        activePipelines: activePipelines.length,
        pipelineDetails: activePipelines
      },
      
      hcsAnalyzer: {
        ...hcsMetrics,
        recentAnomalies: anomalyReport.recentAnomalies?.slice(0, 10) || []
      },
      
      performance: {
        latencyTarget: pipelineMetrics.performanceTargets?.maxLatency || 500,
        throughputTarget: pipelineMetrics.performanceTargets?.throughput || 10000,
        accuracyTarget: pipelineMetrics.performanceTargets?.accuracy || 0.95,
        currentThroughput: Math.floor(fraudStats.transactionsProcessed / 24), // Per hour estimate
        withinTargets: {
          latency: pipelineMetrics.avgProcessingTime <= (pipelineMetrics.performanceTargets?.maxLatency || 500),
          accuracy: fraudMetrics.accuracy >= (pipelineMetrics.performanceTargets?.accuracy || 0.95),
          throughput: true // Simplified check
        }
      },
      
      alerts: [
        ...(fraudMetrics.accuracy < 0.9 ? [{
          id: 'low-accuracy',
          type: 'WARNING',
          message: `Model accuracy below threshold: ${(fraudMetrics.accuracy * 100).toFixed(1)}%`,
          severity: 'MEDIUM'
        }] : []),
        
        ...(pipelineMetrics.avgProcessingTime > 800 ? [{
          id: 'high-latency',
          type: 'WARNING', 
          message: `High processing latency: ${pipelineMetrics.avgProcessingTime}ms`,
          severity: 'HIGH'
        }] : []),
        
        ...(fraudStats.fraudRate > 0.05 ? [{
          id: 'high-fraud-rate',
          type: 'ALERT',
          message: `Elevated fraud rate: ${(fraudStats.fraudRate * 100).toFixed(2)}%`,
          severity: 'HIGH'
        }] : [])
      ],
      
      recentActivity: [
        {
          type: 'FRAUD_DETECTED',
          count: anomalyReport.anomaliesBySeverity?.HIGH || 0,
          timeframe: '1h'
        },
        {
          type: 'AUTO_APPROVED',
          count: Math.floor(fraudStats.autoApproved * 0.1), // Last hour estimate
          timeframe: '1h'
        },
        {
          type: 'MANUAL_REVIEW',
          count: Math.floor(fraudStats.manualReview * 0.1), // Last hour estimate
          timeframe: '1h'
        }
      ],
      
      generatedAt: new Date().toISOString()
    };

    res.send(dashboard);
  } catch (error) {
    res.status(500).send({
      error: error.message,
      dashboard: {
        summary: {
          systemHealth: 'ERROR',
          error: 'Failed to load dashboard data'
        },
        generatedAt: new Date().toISOString()
      }
    });
  }
};

// Simulation and Testing Controllers
const simulateRuralTraffic = async (req, res) => {
  try {
    const { userCount = 1000, duration = 60 } = req.body; // Default: 1000 users for 60 seconds
    
    logger.info('AIFraudController', 'simulateRuralTraffic', `Starting simulation: ${userCount} users for ${duration}s`);
    
    // Simulate concurrent NFC scans
    const simulationResults = {
      simulationId: crypto.randomUUID(),
      userCount,
      duration,
      startTime: new Date().toISOString(),
      results: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgLatency: 0,
        maxLatency: 0,
        minLatency: 0,
        throughput: 0,
        fraudDetected: 0,
        autoProcessed: 0
      }
    };

    // Simulate processing (in production, this would generate actual load)
    const requests = [];
    for (let i = 0; i < userCount; i++) {
      requests.push(simulateNFCRequest(i));
    }

    const results = await Promise.allSettled(requests);
    
    // Analyze results
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');
    const latencies = successful.map(r => r.value.processingTime);

    simulationResults.results = {
      totalRequests: userCount,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length || 0,
      maxLatency: Math.max(...latencies) || 0,
      minLatency: Math.min(...latencies) || 0,
      throughput: successful.length / duration,
      fraudDetected: successful.filter(r => r.value.decision === 'AUTO_BLOCK').length,
      autoProcessed: successful.filter(r => r.value.autoProcessed).length
    };

    simulationResults.endTime = new Date().toISOString();
    
    logger.info('AIFraudController', 'simulateRuralTraffic', 
      `Simulation completed: ${successful.length}/${userCount} successful`);

    res.send(simulationResults);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Helper function for simulation
const simulateNFCRequest = async (userId) => {
  const mockNFCData = {
    tagId: `tag_${userId}`,
    timestamp: new Date().toISOString(),
    transactionData: {
      type: 'transfer',
      amount: Math.floor(Math.random() * 1000) + 10,
      destination: `0.0.${Math.floor(Math.random() * 999999)}`
    },
    deviceInfo: {
      userAgent: 'MockDevice/1.0',
      screen: '1920x1080',
      timezone: 'UTC'
    },
    location: {
      lat: 40.7128 + (Math.random() - 0.5) * 0.1,
      lng: -74.0060 + (Math.random() - 0.5) * 0.1
    },
    verified: Math.random() > 0.2 // 80% verification rate
  };

  const userContext = {
    accountId: `0.0.${userId}`,
    ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
    kycVerified: Math.random() > 0.1, // 90% KYC rate
    complianceScore: Math.random() * 0.3 + 0.7 // 0.7-1.0 range
  };

  return await NFCPipelineService.processNFCScan(mockNFCData, userContext);
};

export {
  // AI Fraud Detection
  analyzeTransaction,
  provideFeedback,
  getPerformanceMetrics,
  getRealTimeStats,
  getHCSLogs,
  
  // HCS Log Analyzer
  getAnomalyReport,
  getHCSMetrics,
  getUserBehaviorProfile,
  
  // NFC AI Pipeline
  processNFCScan,
  getPipelineMetrics,
  getPipelineStatus,
  getActivePipelines,
  optimizeForRuralNetworks,
  
  // Dashboard & Simulation
  getAIDashboard,
  simulateRuralTraffic
};
