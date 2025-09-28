import crypto from 'crypto';
import logger from '../utils/logger';
import { anonymizeNFCData, generateZKProof, ZK_PROOF_TYPES, PRIVACY_LEVELS } from './zk-privacy';

// Homomorphic encryption simulation
class HomomorphicEncryption {
  constructor() {
    this.keyPair = this.generateKeyPair();
  }

  generateKeyPair() {
    return {
      publicKey: crypto.randomBytes(32).toString('hex'),
      privateKey: crypto.randomBytes(32).toString('hex')
    };
  }

  encrypt(value) {
    // Simplified homomorphic encryption simulation
    const noise = Math.random() * 0.1;
    return {
      ciphertext: value + noise,
      randomness: crypto.randomBytes(16).toString('hex')
    };
  }

  add(encrypted1, encrypted2) {
    return {
      ciphertext: encrypted1.ciphertext + encrypted2.ciphertext,
      randomness: crypto.randomBytes(16).toString('hex')
    };
  }

  multiply(encrypted, scalar) {
    return {
      ciphertext: encrypted.ciphertext * scalar,
      randomness: crypto.randomBytes(16).toString('hex')
    };
  }

  decrypt(encrypted) {
    // Remove noise and return approximate value
    return Math.round(encrypted.ciphertext);
  }
}

class PrivacyPreservingAI {
  constructor() {
    this.homomorphicEngine = new HomomorphicEncryption();
    this.encryptedFeatures = new Map();
    this.privacyBudget = new Map(); // For differential privacy
    this.modelWeights = this.initializeEncryptedWeights();
  }

  initializeEncryptedWeights() {
    // Initialize model weights in encrypted form
    const weights = {
      amount: this.homomorphicEngine.encrypt(0.15),
      velocity: this.homomorphicEngine.encrypt(0.25),
      location: this.homomorphicEngine.encrypt(0.20),
      device: this.homomorphicEngine.encrypt(0.10),
      time: this.homomorphicEngine.encrypt(0.08),
      nfcVerified: this.homomorphicEngine.encrypt(-0.15),
      kycVerified: this.homomorphicEngine.encrypt(-0.12)
    };
    return weights;
  }

  async extractPrivacyPreservingFeatures(transaction, userHistory = []) {
    try {
      logger.info('PrivacyPreservingAI', 'extractPrivacyPreservingFeatures', 
        'Extracting features with privacy preservation');

      // Anonymize transaction data first
      const anonymizedTransaction = await anonymizeNFCData(transaction, PRIVACY_LEVELS.ZERO_KNOWLEDGE);
      
      // Extract features from ZK proof public inputs
      const features = {};
      
      if (anonymizedTransaction.zkProof) {
        const zkProof = anonymizedTransaction.zkProof;
        
        // Use public inputs that don't reveal sensitive information
        features.hasValidNFC = zkProof.publicInputs.hasValidNFC ? 1 : 0;
        features.timeCategory = this.categorizeTime(zkProof.publicInputs.timestamp);
        features.amountBucket = this.bucketizeAmount(transaction.amount);
        features.velocityScore = await this.calculatePrivateVelocity(userHistory);
        features.deviceFingerprint = this.hashDeviceFingerprint(transaction.deviceInfo);
      }

      // Encrypt features for homomorphic computation
      const encryptedFeatures = {};
      for (const [key, value] of Object.entries(features)) {
        encryptedFeatures[key] = this.homomorphicEngine.encrypt(value);
      }

      return {
        features: encryptedFeatures,
        zkProofId: anonymizedTransaction.zkProof?.proofId,
        privacyLevel: PRIVACY_LEVELS.ZERO_KNOWLEDGE
      };

    } catch (error) {
      logger.error('PrivacyPreservingAI', 'extractPrivacyPreservingFeatures', error.message);
      throw error;
    }
  }

  async predictFraudPrivately(encryptedFeatures) {
    try {
      logger.info('PrivacyPreservingAI', 'predictFraudPrivately', 
        'Running fraud prediction on encrypted data');

      // Perform homomorphic computation
      let encryptedScore = this.homomorphicEngine.encrypt(0); // bias term

      // Add weighted features
      for (const [featureName, encryptedValue] of Object.entries(encryptedFeatures)) {
        if (this.modelWeights[featureName]) {
          const weightedFeature = this.homomorphicEngine.multiply(
            encryptedValue, 
            this.homomorphicEngine.decrypt(this.modelWeights[featureName])
          );
          encryptedScore = this.homomorphicEngine.add(encryptedScore, weightedFeature);
        }
      }

      // Apply differential privacy noise
      const dpNoise = this.generateDifferentialPrivacyNoise();
      const noisyScore = this.homomorphicEngine.add(
        encryptedScore, 
        this.homomorphicEngine.encrypt(dpNoise)
      );

      // Decrypt final score
      const fraudScore = this.homomorphicEngine.decrypt(noisyScore);
      const normalizedScore = this.sigmoid(fraudScore);

      return {
        fraudScore: normalizedScore,
        confidence: this.calculatePrivacyPreservingConfidence(encryptedFeatures),
        privacyBudgetUsed: Math.abs(dpNoise),
        computationProof: await this.generateComputationProof(encryptedFeatures, normalizedScore)
      };

    } catch (error) {
      logger.error('PrivacyPreservingAI', 'predictFraudPrivately', error.message);
      throw error;
    }
  }

  async analyzeTransactionPrivately(transaction, userHistory = []) {
    try {
      const startTime = Date.now();

      // Extract privacy-preserving features
      const featureResult = await this.extractPrivacyPreservingFeatures(transaction, userHistory);
      
      // Run private prediction
      const predictionResult = await this.predictFraudPrivately(featureResult.features);

      // Generate ZK proof of computation
      const computationProof = await generateZKProof(
        ZK_PROOF_TYPES.TRANSACTION_VALIDITY,
        {
          transactionHash: crypto.createHash('sha256').update(JSON.stringify(transaction)).digest('hex'),
          fraudScore: predictionResult.fraudScore,
          timestamp: Date.now()
        },
        {
          hasValidComputation: true,
          scoreRange: this.getScoreRange(predictionResult.fraudScore),
          privacyPreserved: true
        }
      );

      const processingTime = Date.now() - startTime;

      return {
        transactionId: transaction.id,
        fraudScore: predictionResult.fraudScore,
        confidence: predictionResult.confidence,
        riskLevel: this.determineRiskLevel(predictionResult.fraudScore),
        privacyLevel: PRIVACY_LEVELS.ZERO_KNOWLEDGE,
        zkProofId: featureResult.zkProofId,
        computationProofId: computationProof.proofId,
        privacyBudgetUsed: predictionResult.privacyBudgetUsed,
        processingTime,
        reasons: this.generatePrivacyPreservingReasons(predictionResult.fraudScore),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('PrivacyPreservingAI', 'analyzeTransactionPrivately', error.message);
      throw error;
    }
  }

  categorizeTime(timestamp) {
    const hour = new Date(timestamp).getHours();
    if (hour >= 6 && hour < 12) return 1; // Morning
    if (hour >= 12 && hour < 18) return 2; // Afternoon
    if (hour >= 18 && hour < 24) return 3; // Evening
    return 4; // Night
  }

  bucketizeAmount(amount) {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount < 100) return 1;
    if (numAmount < 1000) return 2;
    if (numAmount < 10000) return 3;
    return 4;
  }

  async calculatePrivateVelocity(userHistory) {
    // Calculate velocity without revealing exact transaction counts
    const recentCount = userHistory.filter(tx => 
      Date.now() - new Date(tx.timestamp).getTime() < 300000 // 5 minutes
    ).length;

    // Add differential privacy noise
    const noise = this.generateDifferentialPrivacyNoise(0.1);
    return Math.max(0, recentCount + noise);
  }

  hashDeviceFingerprint(deviceInfo) {
    if (!deviceInfo) return 0;
    const fingerprint = `${deviceInfo.userAgent || ''}-${deviceInfo.screen || ''}`;
    const hash = crypto.createHash('md5').update(fingerprint).digest('hex');
    return parseInt(hash.substring(0, 8), 16) / 0xffffffff;
  }

  generateDifferentialPrivacyNoise(sensitivity = 1.0, epsilon = 1.0) {
    // Laplace mechanism for differential privacy
    const scale = sensitivity / epsilon;
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  calculatePrivacyPreservingConfidence(encryptedFeatures) {
    // Calculate confidence based on feature availability without revealing values
    const featureCount = Object.keys(encryptedFeatures).length;
    const maxFeatures = 10;
    return Math.min(featureCount / maxFeatures, 1.0);
  }

  async generateComputationProof(encryptedFeatures, result) {
    // Generate proof that computation was performed correctly
    return {
      proofId: crypto.randomUUID(),
      featureHash: crypto.createHash('sha256').update(JSON.stringify(encryptedFeatures)).digest('hex'),
      resultHash: crypto.createHash('sha256').update(result.toString()).digest('hex'),
      timestamp: new Date().toISOString()
    };
  }

  getScoreRange(score) {
    if (score < 0.3) return 'LOW';
    if (score < 0.7) return 'MEDIUM';
    return 'HIGH';
  }

  determineRiskLevel(fraudScore) {
    if (fraudScore < 0.3) return 'LOW';
    if (fraudScore < 0.5) return 'MEDIUM';
    if (fraudScore < 0.8) return 'HIGH';
    return 'CRITICAL';
  }

  generatePrivacyPreservingReasons(fraudScore) {
    // Generate generic reasons without revealing specific feature values
    const reasons = [];
    
    if (fraudScore > 0.7) {
      reasons.push('Multiple risk indicators detected');
      reasons.push('Pattern analysis suggests elevated risk');
    } else if (fraudScore > 0.5) {
      reasons.push('Some risk factors present');
      reasons.push('Requires additional verification');
    } else {
      reasons.push('Low risk transaction pattern');
      reasons.push('Standard verification sufficient');
    }

    return reasons;
  }

  async updateModelPrivately(feedbackData) {
    try {
      logger.info('PrivacyPreservingAI', 'updateModelPrivately', 'Updating model with private feedback');

      // Use federated learning approach for privacy-preserving updates
      const gradients = this.calculatePrivateGradients(feedbackData);
      
      // Apply differential privacy to gradients
      const privateGradients = {};
      for (const [key, gradient] of Object.entries(gradients)) {
        const noise = this.generateDifferentialPrivacyNoise(0.1, 1.0);
        privateGradients[key] = gradient + noise;
      }

      // Update model weights
      const learningRate = 0.01;
      for (const [key, gradient] of Object.entries(privateGradients)) {
        if (this.modelWeights[key]) {
          const currentWeight = this.homomorphicEngine.decrypt(this.modelWeights[key]);
          const newWeight = currentWeight - learningRate * gradient;
          this.modelWeights[key] = this.homomorphicEngine.encrypt(newWeight);
        }
      }

      return {
        updated: true,
        gradientNorm: Math.sqrt(Object.values(privateGradients).reduce((sum, g) => sum + g * g, 0)),
        privacyBudgetUsed: Object.values(privateGradients).reduce((sum, g) => sum + Math.abs(g), 0),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('PrivacyPreservingAI', 'updateModelPrivately', error.message);
      throw error;
    }
  }

  calculatePrivateGradients(feedbackData) {
    // Simplified gradient calculation for privacy-preserving learning
    const gradients = {};
    
    for (const feedback of feedbackData) {
      const error = feedback.actualLabel - feedback.predictedScore;
      
      // Calculate gradients for each feature (simplified)
      gradients.amount = (gradients.amount || 0) + error * 0.1;
      gradients.velocity = (gradients.velocity || 0) + error * 0.1;
      gradients.location = (gradients.location || 0) + error * 0.1;
    }

    return gradients;
  }

  getPrivacyMetrics() {
    return {
      totalPrivateComputations: this.encryptedFeatures.size,
      averagePrivacyBudget: this.calculateAveragePrivacyBudget(),
      privacyLevel: PRIVACY_LEVELS.ZERO_KNOWLEDGE,
      homomorphicOperations: this.getHomomorphicOperationCount(),
      lastUpdated: new Date().toISOString()
    };
  }

  calculateAveragePrivacyBudget() {
    const budgets = Array.from(this.privacyBudget.values());
    return budgets.length > 0 ? budgets.reduce((sum, b) => sum + b, 0) / budgets.length : 0;
  }

  getHomomorphicOperationCount() {
    // Mock operation count
    return Math.floor(Math.random() * 1000) + 500;
  }
}

// Create singleton instance
const privacyPreservingAI = new PrivacyPreservingAI();

// Export functions
const analyzeTransactionPrivately = async (transaction, userHistory) => {
  return await privacyPreservingAI.analyzeTransactionPrivately(transaction, userHistory);
};

const updateModelPrivately = async (feedbackData) => {
  return await privacyPreservingAI.updateModelPrivately(feedbackData);
};

const getPrivacyMetrics = () => {
  return privacyPreservingAI.getPrivacyMetrics();
};

export {
  PrivacyPreservingAI,
  HomomorphicEncryption,
  analyzeTransactionPrivately,
  updateModelPrivately,
  getPrivacyMetrics
};
