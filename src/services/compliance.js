import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { encryptGDPRData, decryptGDPRData, hashPII } from '../utils/encryption';
import { issueCredential, verifyCredential } from './did';

// Compliance risk levels
const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Compliance status types
const COMPLIANCE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  EXPIRED: 'EXPIRED'
};

// Mock AI compliance engine
class AIComplianceEngine {
  constructor() {
    this.sanctionsList = [
      'sanctioned-entity-1',
      'sanctioned-entity-2',
      'high-risk-jurisdiction'
    ];
    
    this.riskFactors = {
      jurisdiction: {
        'US': 0.1,
        'EU': 0.1,
        'UK': 0.1,
        'CA': 0.1,
        'AU': 0.1,
        'UNKNOWN': 0.8,
        'HIGH_RISK': 0.9
      },
      transactionAmount: {
        threshold_low: 1000,
        threshold_medium: 10000,
        threshold_high: 100000
      },
      frequency: {
        daily_limit: 10,
        weekly_limit: 50,
        monthly_limit: 200
      }
    };
  }

  async assessRisk(userData, transactionData = null) {
    try {
      let riskScore = 0;
      const riskFactors = [];

      // Jurisdiction risk
      const jurisdiction = userData.jurisdiction || 'UNKNOWN';
      const jurisdictionRisk = this.riskFactors.jurisdiction[jurisdiction] || 0.5;
      riskScore += jurisdictionRisk;
      
      if (jurisdictionRisk > 0.5) {
        riskFactors.push(`High-risk jurisdiction: ${jurisdiction}`);
      }

      // Sanctions screening
      const fullName = `${userData.firstName} ${userData.lastName}`.toLowerCase();
      const isSanctioned = this.sanctionsList.some(entity => 
        fullName.includes(entity.toLowerCase())
      );
      
      if (isSanctioned) {
        riskScore += 0.9;
        riskFactors.push('Potential sanctions match detected');
      }

      // Age verification
      if (userData.age && userData.age < 18) {
        riskScore += 0.8;
        riskFactors.push('Minor detected - requires additional verification');
      }

      // Transaction amount risk (if provided)
      if (transactionData && transactionData.amount) {
        const amount = parseFloat(transactionData.amount);
        if (amount > this.riskFactors.transactionAmount.threshold_high) {
          riskScore += 0.6;
          riskFactors.push(`High-value transaction: ${amount}`);
        } else if (amount > this.riskFactors.transactionAmount.threshold_medium) {
          riskScore += 0.3;
          riskFactors.push(`Medium-value transaction: ${amount}`);
        }
      }

      // Document verification risk
      if (!userData.documentVerified) {
        riskScore += 0.4;
        riskFactors.push('Documents not verified');
      }

      // Determine risk level
      let riskLevel;
      if (riskScore >= 0.8) {
        riskLevel = RISK_LEVELS.CRITICAL;
      } else if (riskScore >= 0.6) {
        riskLevel = RISK_LEVELS.HIGH;
      } else if (riskScore >= 0.3) {
        riskLevel = RISK_LEVELS.MEDIUM;
      } else {
        riskLevel = RISK_LEVELS.LOW;
      }

      return {
        riskScore: Math.min(riskScore, 1.0),
        riskLevel,
        riskFactors,
        recommendation: this.getRecommendation(riskLevel),
        assessedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('AIComplianceEngine', 'assessRisk', error.message);
      return {
        riskScore: 1.0,
        riskLevel: RISK_LEVELS.CRITICAL,
        riskFactors: ['Assessment failed - manual review required'],
        recommendation: 'REJECT',
        assessedAt: new Date().toISOString()
      };
    }
  }

  getRecommendation(riskLevel) {
    switch (riskLevel) {
      case RISK_LEVELS.LOW:
        return 'APPROVE';
      case RISK_LEVELS.MEDIUM:
        return 'APPROVE_WITH_MONITORING';
      case RISK_LEVELS.HIGH:
        return 'MANUAL_REVIEW';
      case RISK_LEVELS.CRITICAL:
        return 'REJECT';
      default:
        return 'MANUAL_REVIEW';
    }
  }
}

const aiEngine = new AIComplianceEngine();

// KYC verification process
const performKYC = async (userData, didId) => {
  try {
    logger.info('ComplianceService', 'performKYC', `Starting KYC for DID: ${didId}`);

    // Hash PII for GDPR compliance
    const hashedData = {
      firstNameHash: hashPII(userData.firstName),
      lastNameHash: hashPII(userData.lastName),
      emailHash: hashPII(userData.email),
      phoneHash: hashPII(userData.phone),
      addressHash: hashPII(userData.address),
      documentNumberHash: hashPII(userData.documentNumber)
    };

    // Perform AI risk assessment
    const riskAssessment = await aiEngine.assessRisk(userData);

    // Create KYC record
    const kycRecord = {
      id: crypto.randomUUID(),
      didId,
      status: COMPLIANCE_STATUS.PENDING,
      riskAssessment,
      hashedData,
      jurisdiction: userData.jurisdiction,
      documentType: userData.documentType,
      documentVerified: userData.documentVerified || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    };

    // Determine approval based on risk assessment
    if (riskAssessment.recommendation === 'APPROVE') {
      kycRecord.status = COMPLIANCE_STATUS.APPROVED;
      kycRecord.approvedAt = new Date().toISOString();
    } else if (riskAssessment.recommendation === 'REJECT') {
      kycRecord.status = COMPLIANCE_STATUS.REJECTED;
      kycRecord.rejectedAt = new Date().toISOString();
      kycRecord.rejectionReason = 'High risk profile detected';
    } else {
      kycRecord.status = COMPLIANCE_STATUS.UNDER_REVIEW;
    }

    // Encrypt and store KYC record
    const encryptedRecord = await encryptGDPRData(JSON.stringify(kycRecord));

    // Issue KYC credential if approved
    let credential = null;
    if (kycRecord.status === COMPLIANCE_STATUS.APPROVED) {
      credential = await issueCredential(
        didId,
        'KYCCredential',
        {
          kycLevel: 'BASIC',
          jurisdiction: userData.jurisdiction,
          verifiedAt: new Date().toISOString(),
          riskLevel: riskAssessment.riskLevel
        },
        process.env.ISSUER_PRIVATE_KEY
      );
    }

    logger.info('ComplianceService', 'performKYC', `KYC completed with status: ${kycRecord.status}`);

    return {
      kycId: kycRecord.id,
      status: kycRecord.status,
      riskAssessment,
      credential,
      expiresAt: kycRecord.expiresAt,
      message: this.getStatusMessage(kycRecord.status)
    };

  } catch (error) {
    logger.error('ComplianceService', 'performKYC', error.message);
    throw {
      errorCode: 500,
      error: error.message,
      didId
    };
  }
};

// AML screening
const performAML = async (transactionData, didId) => {
  try {
    logger.info('ComplianceService', 'performAML', `Starting AML screening for DID: ${didId}`);

    const amlRecord = {
      id: crypto.randomUUID(),
      didId,
      transactionId: transactionData.transactionId,
      amount: transactionData.amount,
      currency: transactionData.currency || 'HBAR',
      fromAddress: hashPII(transactionData.from),
      toAddress: hashPII(transactionData.to),
      status: COMPLIANCE_STATUS.PENDING,
      createdAt: new Date().toISOString()
    };

    // Perform risk assessment
    const riskAssessment = await aiEngine.assessRisk({}, transactionData);

    // Check transaction patterns
    const patternAnalysis = await analyzeTransactionPatterns(didId, transactionData);

    // Sanctions screening on addresses
    const sanctionsCheck = await screenSanctions([
      transactionData.from,
      transactionData.to
    ]);

    // Determine AML status
    if (sanctionsCheck.isSanctioned || riskAssessment.riskLevel === RISK_LEVELS.CRITICAL) {
      amlRecord.status = COMPLIANCE_STATUS.REJECTED;
      amlRecord.rejectionReason = 'AML screening failed';
    } else if (riskAssessment.riskLevel === RISK_LEVELS.HIGH) {
      amlRecord.status = COMPLIANCE_STATUS.UNDER_REVIEW;
    } else {
      amlRecord.status = COMPLIANCE_STATUS.APPROVED;
    }

    amlRecord.riskAssessment = riskAssessment;
    amlRecord.patternAnalysis = patternAnalysis;
    amlRecord.sanctionsCheck = sanctionsCheck;
    amlRecord.updatedAt = new Date().toISOString();

    // Encrypt and store AML record
    const encryptedRecord = await encryptGDPRData(JSON.stringify(amlRecord));

    logger.info('ComplianceService', 'performAML', `AML screening completed with status: ${amlRecord.status}`);

    return {
      amlId: amlRecord.id,
      status: amlRecord.status,
      riskAssessment,
      patternAnalysis,
      sanctionsCheck,
      approved: amlRecord.status === COMPLIANCE_STATUS.APPROVED,
      message: this.getStatusMessage(amlRecord.status)
    };

  } catch (error) {
    logger.error('ComplianceService', 'performAML', error.message);
    throw {
      errorCode: 500,
      error: error.message,
      didId,
      transactionId: transactionData.transactionId
    };
  }
};

// Analyze transaction patterns for suspicious activity
const analyzeTransactionPatterns = async (didId, transactionData) => {
  try {
    // Mock pattern analysis - in production, this would analyze historical data
    const patterns = {
      frequencyScore: Math.random(), // 0-1, higher = more suspicious
      amountScore: Math.random(),
      timeScore: Math.random(),
      geographicScore: Math.random(),
      suspiciousPatterns: []
    };

    // Check for suspicious patterns
    if (patterns.frequencyScore > 0.8) {
      patterns.suspiciousPatterns.push('High frequency transactions detected');
    }

    if (patterns.amountScore > 0.8) {
      patterns.suspiciousPatterns.push('Unusual transaction amounts');
    }

    if (patterns.timeScore > 0.8) {
      patterns.suspiciousPatterns.push('Transactions at unusual times');
    }

    if (patterns.geographicScore > 0.8) {
      patterns.suspiciousPatterns.push('Geographic anomalies detected');
    }

    const overallSuspicion = (
      patterns.frequencyScore +
      patterns.amountScore +
      patterns.timeScore +
      patterns.geographicScore
    ) / 4;

    return {
      ...patterns,
      overallSuspicion,
      riskLevel: overallSuspicion > 0.7 ? 'HIGH' : overallSuspicion > 0.4 ? 'MEDIUM' : 'LOW',
      analyzedAt: new Date().toISOString()
    };

  } catch (error) {
    logger.error('ComplianceService', 'analyzeTransactionPatterns', error.message);
    return {
      overallSuspicion: 1.0,
      riskLevel: 'HIGH',
      suspiciousPatterns: ['Pattern analysis failed'],
      analyzedAt: new Date().toISOString()
    };
  }
};

// Screen against sanctions lists
const screenSanctions = async (addresses) => {
  try {
    const sanctionedAddresses = [
      '0x1234567890abcdef',
      '0.0.999999',
      'sanctioned-address'
    ];

    const matches = addresses.filter(addr => 
      sanctionedAddresses.some(sanctioned => 
        addr.toLowerCase().includes(sanctioned.toLowerCase())
      )
    );

    return {
      isSanctioned: matches.length > 0,
      matches,
      screenedAddresses: addresses,
      screenedAt: new Date().toISOString()
    };

  } catch (error) {
    logger.error('ComplianceService', 'screenSanctions', error.message);
    return {
      isSanctioned: true, // Fail safe
      matches: [],
      error: error.message,
      screenedAt: new Date().toISOString()
    };
  }
};

// Generate compliance auth token
const generateAuthToken = async (didId, complianceData) => {
  try {
    logger.info('ComplianceService', 'generateAuthToken', `Generating auth token for DID: ${didId}`);

    // Verify compliance status
    if (complianceData.kycStatus !== COMPLIANCE_STATUS.APPROVED) {
      throw new Error('KYC not approved');
    }

    const tokenPayload = {
      sub: didId,
      iss: 'hedera-compliance-service',
      aud: 'hedera-rwa-platform',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      compliance: {
        kycLevel: complianceData.kycLevel || 'BASIC',
        riskLevel: complianceData.riskLevel,
        jurisdiction: complianceData.jurisdiction,
        verifiedAt: complianceData.verifiedAt
      },
      permissions: [
        'rwa:read',
        'rwa:transfer',
        'domain:link'
      ]
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'default-secret', {
      algorithm: 'HS256'
    });

    // Log token generation (encrypted)
    const logEntry = {
      action: 'AUTH_TOKEN_GENERATED',
      didId,
      tokenId: crypto.createHash('sha256').update(token).digest('hex').substring(0, 16),
      expiresAt: new Date(tokenPayload.exp * 1000).toISOString(),
      timestamp: new Date().toISOString()
    };

    const encryptedLog = await encryptGDPRData(JSON.stringify(logEntry));

    logger.info('ComplianceService', 'generateAuthToken', `Auth token generated successfully`);

    return {
      token,
      expiresAt: new Date(tokenPayload.exp * 1000).toISOString(),
      permissions: tokenPayload.permissions,
      compliance: tokenPayload.compliance
    };

  } catch (error) {
    logger.error('ComplianceService', 'generateAuthToken', error.message);
    throw {
      errorCode: 403,
      error: error.message,
      didId
    };
  }
};

// Validate auth token
const validateAuthToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // Check if token is expired
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return {
      valid: true,
      didId: decoded.sub,
      compliance: decoded.compliance,
      permissions: decoded.permissions,
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    };

  } catch (error) {
    logger.error('ComplianceService', 'validateAuthToken', error.message);
    return {
      valid: false,
      error: error.message
    };
  }
};

// Get status message
const getStatusMessage = (status) => {
  const messages = {
    [COMPLIANCE_STATUS.PENDING]: 'Compliance check in progress',
    [COMPLIANCE_STATUS.APPROVED]: 'Compliance verification successful',
    [COMPLIANCE_STATUS.REJECTED]: 'Compliance verification failed',
    [COMPLIANCE_STATUS.UNDER_REVIEW]: 'Manual review required',
    [COMPLIANCE_STATUS.EXPIRED]: 'Compliance verification expired'
  };
  
  return messages[status] || 'Unknown status';
};

export {
  RISK_LEVELS,
  COMPLIANCE_STATUS,
  AIComplianceEngine,
  performKYC,
  performAML,
  analyzeTransactionPatterns,
  screenSanctions,
  generateAuthToken,
  validateAuthToken,
  getStatusMessage
};
