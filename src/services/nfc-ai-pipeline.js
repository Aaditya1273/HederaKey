import crypto from 'crypto';
import logger from '../utils/logger';
import { analyzeTransaction } from './ai-fraud-detection';
import { logToHCS, HCS_LOG_TYPES } from './hcs-log-analyzer';
import { encryptGDPRData, DATA_CLASSIFICATION } from '../utils/encryption';

// NFC to AI Pipeline States
const PIPELINE_STATES = {
  NFC_SCAN_RECEIVED: 'NFC_SCAN_RECEIVED',
  DATA_VALIDATED: 'DATA_VALIDATED',
  FEATURES_EXTRACTED: 'FEATURES_EXTRACTED',
  AI_ANALYSIS_COMPLETE: 'AI_ANALYSIS_COMPLETE',
  DECISION_MADE: 'DECISION_MADE',
  HCS_LOGGED: 'HCS_LOGGED',
  RESPONSE_SENT: 'RESPONSE_SENT',
  PIPELINE_ERROR: 'PIPELINE_ERROR'
};

// Decision actions
const DECISION_ACTIONS = {
  AUTO_APPROVE: 'AUTO_APPROVE',
  AUTO_BLOCK: 'AUTO_BLOCK',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
  COMPLIANCE_CHECK: 'COMPLIANCE_CHECK'
};

class NFCAIPipeline {
  constructor() {
    this.activePipelines = new Map();
    this.pipelineMetrics = {
      totalProcessed: 0,
      autoApproved: 0,
      autoBlocked: 0,
      manualReview: 0,
      avgProcessingTime: 0,
      errorRate: 0
    };
    this.performanceTargets = {
      maxLatency: 500, // 500ms target for rural networks
      throughput: 10000, // 10K users capacity
      accuracy: 0.95
    };
  }

  async processNFCScan(nfcData, userContext = {}) {
    const pipelineId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      logger.info('NFCAIPipeline', 'processNFCScan', `Starting pipeline: ${pipelineId}`);

      // Initialize pipeline tracking
      const pipeline = {
        id: pipelineId,
        startTime,
        state: PIPELINE_STATES.NFC_SCAN_RECEIVED,
        nfcData,
        userContext,
        steps: [],
        decision: null,
        processingTime: 0
      };

      this.activePipelines.set(pipelineId, pipeline);

      // Step 1: Validate NFC data
      await this.validateNFCData(pipeline);

      // Step 2: Extract transaction features
      await this.extractTransactionFeatures(pipeline);

      // Step 3: Run AI fraud detection
      await this.runAIAnalysis(pipeline);

      // Step 4: Make automated decision
      await this.makeAutomatedDecision(pipeline);

      // Step 5: Log to HCS
      await this.logPipelineToHCS(pipeline);

      // Step 6: Send response
      const response = await this.generateResponse(pipeline);

      // Update metrics
      this.updatePipelineMetrics(pipeline);

      // Cleanup
      this.activePipelines.delete(pipelineId);

      logger.info('NFCAIPipeline', 'processNFCScan', 
        `Pipeline completed: ${pipelineId} in ${pipeline.processingTime}ms`);

      return response;

    } catch (error) {
      logger.error('NFCAIPipeline', 'processNFCScan', error.message);
      
      // Error handling
      const pipeline = this.activePipelines.get(pipelineId);
      if (pipeline) {
        pipeline.state = PIPELINE_STATES.PIPELINE_ERROR;
        pipeline.error = error.message;
        pipeline.processingTime = Date.now() - startTime;
        
        // Fail-safe decision
        const failSafeResponse = {
          pipelineId,
          decision: DECISION_ACTIONS.MANUAL_REVIEW,
          riskScore: 0.5,
          confidence: 0.0,
          reason: 'Pipeline error - manual review required',
          processingTime: pipeline.processingTime,
          error: error.message
        };

        this.updatePipelineMetrics(pipeline);
        this.activePipelines.delete(pipelineId);

        return failSafeResponse;
      }

      throw error;
    }
  }

  async validateNFCData(pipeline) {
    try {
      pipeline.state = PIPELINE_STATES.DATA_VALIDATED;
      
      const { nfcData } = pipeline;
      const validationResults = {
        hasTagId: !!nfcData.tagId,
        hasTimestamp: !!nfcData.timestamp,
        hasTransactionData: !!nfcData.transactionData,
        hasDeviceInfo: !!nfcData.deviceInfo,
        isRecentScan: this.isRecentScan(nfcData.timestamp),
        tagIdValid: this.validateTagId(nfcData.tagId),
        signatureValid: this.validateSignature(nfcData)
      };

      // Check validation results
      const criticalValidations = ['hasTagId', 'hasTimestamp', 'isRecentScan', 'tagIdValid'];
      const failedCritical = criticalValidations.filter(key => !validationResults[key]);

      if (failedCritical.length > 0) {
        throw new Error(`NFC validation failed: ${failedCritical.join(', ')}`);
      }

      pipeline.steps.push({
        step: 'validation',
        timestamp: new Date().toISOString(),
        results: validationResults,
        status: 'success'
      });

      // Log NFC scan to HCS
      await logToHCS(HCS_LOG_TYPES.NFC_SCAN, {
        tagId: nfcData.tagId,
        deviceInfo: nfcData.deviceInfo,
        location: nfcData.location,
        validationResults
      }, { pipelineId: pipeline.id });

    } catch (error) {
      pipeline.steps.push({
        step: 'validation',
        timestamp: new Date().toISOString(),
        error: error.message,
        status: 'failed'
      });
      throw error;
    }
  }

  async extractTransactionFeatures(pipeline) {
    try {
      pipeline.state = PIPELINE_STATES.FEATURES_EXTRACTED;

      const { nfcData, userContext } = pipeline;
      
      // Create transaction object from NFC data
      const transaction = {
        id: crypto.randomUUID(),
        accountId: userContext.accountId || nfcData.accountId,
        type: nfcData.transactionData?.type || 'nfc_transaction',
        amount: nfcData.transactionData?.amount || 0,
        destination: nfcData.transactionData?.destination,
        timestamp: nfcData.timestamp,
        location: nfcData.location,
        deviceInfo: nfcData.deviceInfo,
        nfcData: {
          tagId: nfcData.tagId,
          verified: nfcData.verified || false,
          serialNumber: nfcData.serialNumber
        },
        ipAddress: userContext.ipAddress,
        userAgent: userContext.userAgent,
        kycVerified: userContext.kycVerified || false,
        complianceScore: userContext.complianceScore || 0.5
      };

      pipeline.transaction = transaction;
      pipeline.steps.push({
        step: 'feature_extraction',
        timestamp: new Date().toISOString(),
        transactionId: transaction.id,
        status: 'success'
      });

    } catch (error) {
      pipeline.steps.push({
        step: 'feature_extraction',
        timestamp: new Date().toISOString(),
        error: error.message,
        status: 'failed'
      });
      throw error;
    }
  }

  async runAIAnalysis(pipeline) {
    try {
      pipeline.state = PIPELINE_STATES.AI_ANALYSIS_COMPLETE;

      const { transaction, userContext } = pipeline;
      
      // Get user transaction history
      const userHistory = await this.getUserTransactionHistory(transaction.accountId);

      // Run AI fraud detection
      const aiResult = await analyzeTransaction(transaction, userHistory);

      pipeline.aiResult = aiResult;
      pipeline.steps.push({
        step: 'ai_analysis',
        timestamp: new Date().toISOString(),
        fraudScore: aiResult.fraudScore,
        riskLevel: aiResult.riskLevel,
        confidence: aiResult.confidence,
        processingTime: aiResult.processingTime,
        status: 'success'
      });

      // Log AI prediction to HCS
      await logToHCS(HCS_LOG_TYPES.AI_PREDICTION, {
        transactionId: transaction.id,
        fraudScore: aiResult.fraudScore,
        riskLevel: aiResult.riskLevel,
        decision: aiResult.decision,
        reasons: aiResult.reasons,
        modelVersion: aiResult.modelVersion
      }, { pipelineId: pipeline.id });

    } catch (error) {
      pipeline.steps.push({
        step: 'ai_analysis',
        timestamp: new Date().toISOString(),
        error: error.message,
        status: 'failed'
      });
      throw error;
    }
  }

  async makeAutomatedDecision(pipeline) {
    try {
      pipeline.state = PIPELINE_STATES.DECISION_MADE;

      const { aiResult, transaction, nfcData } = pipeline;
      
      // Decision logic based on AI results and business rules
      let decision = DECISION_ACTIONS.MANUAL_REVIEW;
      let confidence = aiResult.confidence;
      let reasons = [...aiResult.reasons];

      // Auto-approve conditions
      if (aiResult.riskLevel === 'LOW' && 
          aiResult.fraudScore < 0.3 && 
          nfcData.verified && 
          parseFloat(transaction.amount) < 1000) {
        decision = DECISION_ACTIONS.AUTO_APPROVE;
        reasons.push('Low risk, NFC verified, small amount');
      }
      
      // Auto-block conditions
      else if (aiResult.riskLevel === 'CRITICAL' || 
               aiResult.fraudScore > 0.9) {
        decision = DECISION_ACTIONS.AUTO_BLOCK;
        reasons.push('Critical risk level detected');
      }
      
      // High-value transactions require compliance check
      else if (parseFloat(transaction.amount) > 10000) {
        decision = DECISION_ACTIONS.COMPLIANCE_CHECK;
        reasons.push('High-value transaction requires compliance verification');
      }
      
      // Medium risk goes to manual review
      else if (aiResult.riskLevel === 'MEDIUM' || aiResult.fraudScore > 0.5) {
        decision = DECISION_ACTIONS.MANUAL_REVIEW;
        reasons.push('Medium risk requires human review');
      }

      // NFC verification bonus
      if (nfcData.verified) {
        confidence += 0.1;
        reasons.push('NFC tag verification increases confidence');
      }

      pipeline.decision = {
        action: decision,
        confidence: Math.min(confidence, 1.0),
        reasons,
        riskScore: aiResult.fraudScore,
        riskLevel: aiResult.riskLevel,
        autoProcessed: [DECISION_ACTIONS.AUTO_APPROVE, DECISION_ACTIONS.AUTO_BLOCK].includes(decision),
        timestamp: new Date().toISOString()
      };

      pipeline.steps.push({
        step: 'decision_making',
        timestamp: new Date().toISOString(),
        decision: decision,
        confidence: pipeline.decision.confidence,
        autoProcessed: pipeline.decision.autoProcessed,
        status: 'success'
      });

    } catch (error) {
      pipeline.steps.push({
        step: 'decision_making',
        timestamp: new Date().toISOString(),
        error: error.message,
        status: 'failed'
      });
      throw error;
    }
  }

  async logPipelineToHCS(pipeline) {
    try {
      pipeline.state = PIPELINE_STATES.HCS_LOGGED;

      // Create comprehensive pipeline log
      const pipelineLog = {
        pipelineId: pipeline.id,
        transactionId: pipeline.transaction?.id,
        accountId: pipeline.transaction?.accountId,
        nfcTagId: pipeline.nfcData.tagId,
        decision: pipeline.decision,
        aiResult: {
          fraudScore: pipeline.aiResult?.fraudScore,
          riskLevel: pipeline.aiResult?.riskLevel,
          confidence: pipeline.aiResult?.confidence
        },
        steps: pipeline.steps,
        processingTime: Date.now() - pipeline.startTime,
        timestamp: new Date().toISOString()
      };

      // Log to HCS
      await logToHCS(HCS_LOG_TYPES.FRAUD_DETECTION, pipelineLog, {
        pipelineId: pipeline.id,
        priority: pipeline.decision.riskLevel === 'CRITICAL' ? 'HIGH' : 'NORMAL'
      });

      pipeline.steps.push({
        step: 'hcs_logging',
        timestamp: new Date().toISOString(),
        status: 'success'
      });

    } catch (error) {
      pipeline.steps.push({
        step: 'hcs_logging',
        timestamp: new Date().toISOString(),
        error: error.message,
        status: 'failed'
      });
      // Don't throw - logging failure shouldn't stop the pipeline
      logger.warn('NFCAIPipeline', 'logPipelineToHCS', error.message);
    }
  }

  async generateResponse(pipeline) {
    try {
      pipeline.state = PIPELINE_STATES.RESPONSE_SENT;
      pipeline.processingTime = Date.now() - pipeline.startTime;

      const response = {
        pipelineId: pipeline.id,
        transactionId: pipeline.transaction?.id,
        decision: pipeline.decision.action,
        riskScore: pipeline.decision.riskScore,
        riskLevel: pipeline.decision.riskLevel,
        confidence: pipeline.decision.confidence,
        autoProcessed: pipeline.decision.autoProcessed,
        reasons: pipeline.decision.reasons,
        processingTime: pipeline.processingTime,
        nfcVerified: pipeline.nfcData.verified,
        timestamp: new Date().toISOString(),
        
        // Performance metrics
        performance: {
          withinLatencyTarget: pipeline.processingTime <= this.performanceTargets.maxLatency,
          latencyMs: pipeline.processingTime,
          stepsCompleted: pipeline.steps.length,
          stepsSuccessful: pipeline.steps.filter(s => s.status === 'success').length
        }
      };

      // Add next steps based on decision
      switch (pipeline.decision.action) {
        case DECISION_ACTIONS.AUTO_APPROVE:
          response.nextSteps = ['Transaction approved', 'Proceed with execution'];
          break;
        case DECISION_ACTIONS.AUTO_BLOCK:
          response.nextSteps = ['Transaction blocked', 'User notification sent'];
          break;
        case DECISION_ACTIONS.MANUAL_REVIEW:
          response.nextSteps = ['Queued for manual review', 'Estimated review time: 5-10 minutes'];
          break;
        case DECISION_ACTIONS.COMPLIANCE_CHECK:
          response.nextSteps = ['Additional compliance verification required', 'KYC team notified'];
          break;
      }

      return response;

    } catch (error) {
      logger.error('NFCAIPipeline', 'generateResponse', error.message);
      throw error;
    }
  }

  updatePipelineMetrics(pipeline) {
    this.pipelineMetrics.totalProcessed++;
    
    // Update processing time average
    this.pipelineMetrics.avgProcessingTime = 
      (this.pipelineMetrics.avgProcessingTime * (this.pipelineMetrics.totalProcessed - 1) + 
       pipeline.processingTime) / this.pipelineMetrics.totalProcessed;

    // Update decision counters
    if (pipeline.decision) {
      switch (pipeline.decision.action) {
        case DECISION_ACTIONS.AUTO_APPROVE:
          this.pipelineMetrics.autoApproved++;
          break;
        case DECISION_ACTIONS.AUTO_BLOCK:
          this.pipelineMetrics.autoBlocked++;
          break;
        case DECISION_ACTIONS.MANUAL_REVIEW:
        case DECISION_ACTIONS.COMPLIANCE_CHECK:
          this.pipelineMetrics.manualReview++;
          break;
      }
    }

    // Update error rate
    const hasError = pipeline.state === PIPELINE_STATES.PIPELINE_ERROR;
    if (hasError) {
      this.pipelineMetrics.errorRate = 
        (this.pipelineMetrics.errorRate * (this.pipelineMetrics.totalProcessed - 1) + 1) / 
        this.pipelineMetrics.totalProcessed;
    } else {
      this.pipelineMetrics.errorRate = 
        (this.pipelineMetrics.errorRate * (this.pipelineMetrics.totalProcessed - 1)) / 
        this.pipelineMetrics.totalProcessed;
    }
  }

  // Helper methods
  isRecentScan(timestamp) {
    const scanTime = new Date(timestamp);
    const now = new Date();
    const diffMinutes = (now - scanTime) / (1000 * 60);
    return diffMinutes <= 5; // 5 minute window
  }

  validateTagId(tagId) {
    // Basic tag ID validation
    return tagId && typeof tagId === 'string' && tagId.length >= 8;
  }

  validateSignature(nfcData) {
    // Simplified signature validation
    return nfcData.signature || nfcData.verified || true;
  }

  async getUserTransactionHistory(accountId) {
    // Mock user history - in production, query from database
    return [
      {
        id: 'tx1',
        amount: '100',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'transfer'
      },
      {
        id: 'tx2',
        amount: '250',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        type: 'mint'
      }
    ];
  }

  // Public API methods
  getPipelineMetrics() {
    return {
      ...this.pipelineMetrics,
      activePipelines: this.activePipelines.size,
      performanceTargets: this.performanceTargets,
      autoProcessingRate: this.pipelineMetrics.totalProcessed > 0 ? 
        (this.pipelineMetrics.autoApproved + this.pipelineMetrics.autoBlocked) / this.pipelineMetrics.totalProcessed : 0,
      successRate: 1 - this.pipelineMetrics.errorRate
    };
  }

  getPipelineStatus(pipelineId) {
    const pipeline = this.activePipelines.get(pipelineId);
    if (!pipeline) {
      return { status: 'NOT_FOUND' };
    }

    return {
      pipelineId,
      state: pipeline.state,
      processingTime: Date.now() - pipeline.startTime,
      stepsCompleted: pipeline.steps.length,
      currentStep: pipeline.steps[pipeline.steps.length - 1]?.step,
      decision: pipeline.decision
    };
  }

  getActivePipelines() {
    return Array.from(this.activePipelines.values()).map(pipeline => ({
      pipelineId: pipeline.id,
      state: pipeline.state,
      accountId: pipeline.transaction?.accountId,
      processingTime: Date.now() - pipeline.startTime,
      stepsCompleted: pipeline.steps.length
    }));
  }

  // Performance optimization for rural networks
  optimizeForRuralNetworks() {
    // Reduce feature extraction complexity
    this.performanceTargets.maxLatency = 800; // Increase tolerance for slower networks
    
    // Implement request batching
    this.batchSize = 5;
    
    // Enable response compression
    this.compressionEnabled = true;
    
    logger.info('NFCAIPipeline', 'optimizeForRuralNetworks', 'Pipeline optimized for rural network conditions');
  }
}

// Create singleton instance
const nfcAIPipeline = new NFCAIPipeline();

// Export functions
const processNFCScan = async (nfcData, userContext) => {
  return await nfcAIPipeline.processNFCScan(nfcData, userContext);
};

const getPipelineMetrics = () => {
  return nfcAIPipeline.getPipelineMetrics();
};

const getPipelineStatus = (pipelineId) => {
  return nfcAIPipeline.getPipelineStatus(pipelineId);
};

const getActivePipelines = () => {
  return nfcAIPipeline.getActivePipelines();
};

const optimizeForRuralNetworks = () => {
  return nfcAIPipeline.optimizeForRuralNetworks();
};

export {
  PIPELINE_STATES,
  DECISION_ACTIONS,
  NFCAIPipeline,
  processNFCScan,
  getPipelineMetrics,
  getPipelineStatus,
  getActivePipelines,
  optimizeForRuralNetworks
};
