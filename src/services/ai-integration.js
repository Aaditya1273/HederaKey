const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class AIIntegrationService {
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.aiScriptPath = path.join(__dirname, '../../ai/fraud_detection.py');
    this.modelPath = path.join(__dirname, '../../models');
    this.isReady = false;
    this.initialize();
  }

  async initialize() {
    try {
      // Ensure models directory exists
      if (!fs.existsSync(this.modelPath)) {
        fs.mkdirSync(this.modelPath, { recursive: true });
      }

      // Check if Python script exists
      if (!fs.existsSync(this.aiScriptPath)) {
        console.log('⚠️ AI script not found, using fallback fraud detection');
        this.isReady = true;
        return;
      }

      // Test Python environment
      await this.testPythonEnvironment();
      
      // Initialize/train model if needed
      await this.initializeModel();
      
      this.isReady = true;
      console.log('✅ AI Integration Service initialized');
      
    } catch (error) {
      console.error('❌ AI service initialization failed:', error.message);
      console.log('🔄 Falling back to rule-based fraud detection');
      this.isReady = true; // Still ready with fallback
    }
  }

  async testPythonEnvironment() {
    return new Promise((resolve, reject) => {
      const testScript = `
import sys
import json
try:
    import numpy
    import pandas
    import sklearn
    print(json.dumps({"status": "success", "python_version": sys.version}))
except ImportError as e:
    print(json.dumps({"status": "error", "error": str(e)}))
`;

      const pythonProcess = spawn(this.pythonPath, ['-c', testScript]);
      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            if (result.status === 'success') {
              console.log('✅ Python environment ready');
              resolve(result);
            } else {
              reject(new Error(`Python dependencies missing: ${result.error}`));
            }
          } catch (e) {
            reject(new Error('Failed to parse Python test output'));
          }
        } else {
          reject(new Error(`Python test failed with code ${code}: ${error}`));
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Python test timeout'));
      }, 10000);
    });
  }

  async initializeModel() {
    return new Promise((resolve, reject) => {
      console.log('🤖 Initializing AI fraud detection model...');
      
      const initScript = `
import sys
import os
sys.path.append('${path.dirname(this.aiScriptPath)}')

try:
    from fraud_detection import fraud_detector
    result = {"status": "success", "model_ready": True}
    print(result)
except Exception as e:
    result = {"status": "error", "error": str(e)}
    print(result)
`;

      const pythonProcess = spawn(this.pythonPath, ['-c', initScript]);
      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ AI model initialized successfully');
          resolve();
        } else {
          console.log('⚠️ AI model initialization failed, using fallback');
          resolve(); // Don't reject, use fallback instead
        }
      });

      setTimeout(() => {
        pythonProcess.kill();
        resolve(); // Don't reject on timeout, use fallback
      }, 30000);
    });
  }

  async analyzeFraud(transactionData, userHistory = null) {
    try {
      // Try AI-powered analysis first
      if (fs.existsSync(this.aiScriptPath)) {
        return await this.aiAnalyzeFraud(transactionData, userHistory);
      } else {
        // Fallback to rule-based analysis
        return this.ruleBasedFraudAnalysis(transactionData, userHistory);
      }
    } catch (error) {
      console.error('❌ AI fraud analysis failed:', error.message);
      // Always fallback to rule-based on error
      return this.ruleBasedFraudAnalysis(transactionData, userHistory);
    }
  }

  async aiAnalyzeFraud(transactionData, userHistory) {
    return new Promise((resolve, reject) => {
      const inputData = {
        transaction: transactionData,
        user_history: userHistory
      };

      const analysisScript = `
import sys
import json
sys.path.append('${path.dirname(this.aiScriptPath)}')

try:
    from fraud_detection import analyze_transaction
    
    input_data = json.loads('${JSON.stringify(inputData).replace(/'/g, "\\'")}')
    result = analyze_transaction(input_data['transaction'], input_data['user_history'])
    print(json.dumps(result))
    
except Exception as e:
    error_result = {
        "error": str(e),
        "fallback": True
    }
    print(json.dumps(error_result))
`;

      const pythonProcess = spawn(this.pythonPath, ['-c', analysisScript]);
      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        try {
          const result = JSON.parse(output.trim());
          
          if (result.error || result.fallback) {
            // Use fallback on AI error
            resolve(this.ruleBasedFraudAnalysis(transactionData, userHistory));
          } else {
            resolve(result);
          }
        } catch (e) {
          // Fallback on parse error
          resolve(this.ruleBasedFraudAnalysis(transactionData, userHistory));
        }
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        pythonProcess.kill();
        resolve(this.ruleBasedFraudAnalysis(transactionData, userHistory));
      }, 5000);
    });
  }

  ruleBasedFraudAnalysis(transactionData, userHistory) {
    const startTime = Date.now();
    
    try {
      // Rule-based fraud detection logic
      let riskScore = 0;
      const features = {};

      // Amount-based risk
      const amount = parseFloat(transactionData.amount || 0);
      if (amount > 10000) riskScore += 0.3;
      else if (amount > 5000) riskScore += 0.2;
      else if (amount > 1000) riskScore += 0.1;

      // Time-based risk
      const hour = new Date().getHours();
      if (hour < 6 || hour > 22) riskScore += 0.1; // Late night transactions

      // User history risk
      if (userHistory) {
        const accountAge = userHistory.account_age_days || 1;
        if (accountAge < 7) riskScore += 0.2; // New accounts
        
        const txCount = userHistory.transaction_count || 0;
        if (txCount === 0) riskScore += 0.15; // First transaction
        
        const recentTxCount = userHistory.recent_tx_count || 0;
        if (recentTxCount > 10) riskScore += 0.2; // High velocity
      } else {
        riskScore += 0.1; // No history available
      }

      // Location-based risk (mock)
      const location = transactionData.location || {};
      const country = location.country || 'unknown';
      const trustedCountries = ['NG', 'KE', 'GH', 'ZA', 'UG', 'TZ'];
      if (!trustedCountries.includes(country)) {
        riskScore += 0.1;
      }

      // Device-based risk (mock)
      const deviceInfo = transactionData.deviceInfo || {};
      const userAgent = deviceInfo.userAgent || '';
      if (userAgent.includes('Mobile')) {
        riskScore -= 0.05; // Mobile devices slightly less risky
      }

      // Cap risk score at 1.0
      riskScore = Math.min(riskScore, 1.0);

      // Calculate individual feature scores
      features.behavioralScore = Math.max(0.5, 1 - riskScore);
      features.locationScore = trustedCountries.includes(country) ? 0.9 : 0.6;
      features.deviceScore = userAgent.includes('Mobile') ? 0.85 : 0.75;
      features.velocityScore = userHistory?.recent_tx_count > 5 ? 0.6 : 0.9;

      // Determine risk level and decision
      let riskLevel, decision;
      if (riskScore < 0.3) {
        riskLevel = 'LOW';
        decision = 'APPROVE';
      } else if (riskScore < 0.7) {
        riskLevel = 'MEDIUM';
        decision = 'REVIEW';
      } else {
        riskLevel = 'HIGH';
        decision = 'BLOCK';
      }

      const processingTime = Date.now() - startTime;

      return {
        riskScore: Math.round(riskScore * 1000) / 1000,
        riskLevel,
        decision,
        confidence: Math.round((1 - Math.abs(riskScore - 0.5) * 2) * 1000) / 1000,
        processingTime: `${processingTime}ms`,
        features,
        method: 'rule-based',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      // Ultimate fallback - approve with low confidence
      return {
        riskScore: 0.5,
        riskLevel: 'MEDIUM',
        decision: 'REVIEW',
        confidence: 0.5,
        processingTime: `${Date.now() - startTime}ms`,
        features: {
          behavioralScore: 0.5,
          locationScore: 0.5,
          deviceScore: 0.5,
          velocityScore: 0.5
        },
        method: 'fallback',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // DePIN AI analysis (simplified)
  async analyzeDePINPerformance(nodeData) {
    try {
      const uptime = parseFloat(nodeData.uptime || 0);
      const latency = parseInt(nodeData.latency || 0);
      const staked = parseFloat(nodeData.stakedAmount || 0);

      // Simple performance scoring
      let performanceScore = 0;
      
      // Uptime scoring (0-40 points)
      if (uptime >= 99) performanceScore += 40;
      else if (uptime >= 95) performanceScore += 30;
      else if (uptime >= 90) performanceScore += 20;
      else performanceScore += 10;

      // Latency scoring (0-30 points)
      if (latency <= 100) performanceScore += 30;
      else if (latency <= 200) performanceScore += 20;
      else if (latency <= 300) performanceScore += 10;
      else performanceScore += 5;

      // Stake scoring (0-30 points)
      if (staked >= 2000) performanceScore += 30;
      else if (staked >= 1000) performanceScore += 20;
      else if (staked >= 500) performanceScore += 10;
      else performanceScore += 5;

      const normalizedScore = performanceScore / 100;

      return {
        performanceScore: normalizedScore,
        uptime,
        latency,
        stakedAmount: staked,
        recommendation: normalizedScore > 0.8 ? 'EXCELLENT' : 
                       normalizedScore > 0.6 ? 'GOOD' : 
                       normalizedScore > 0.4 ? 'FAIR' : 'POOR',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        performanceScore: 0.5,
        recommendation: 'UNKNOWN',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Health check
  async healthCheck() {
    return {
      aiService: this.isReady ? 'ready' : 'initializing',
      pythonPath: this.pythonPath,
      modelPath: this.modelPath,
      scriptExists: fs.existsSync(this.aiScriptPath),
      modelsDir: fs.existsSync(this.modelPath),
      method: fs.existsSync(this.aiScriptPath) ? 'ai-powered' : 'rule-based'
    };
  }

  isServiceReady() {
    return this.isReady;
  }
}

module.exports = new AIIntegrationService();
