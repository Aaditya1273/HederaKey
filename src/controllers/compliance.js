import * as DIDService from '../services/did';
import * as ComplianceService from '../services/compliance';
import * as NFCComplianceService from '../services/nfc-compliance';

// DID Management
const createDID = async (req, res) => {
  try {
    const { accountId, privateKey } = req.body;
    const result = await DIDService.createDID(accountId, privateKey);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const resolveDID = async (req, res) => {
  try {
    const { didId } = req.params;
    const result = await DIDService.resolveDID(didId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const issueCredential = async (req, res) => {
  try {
    const { subjectDID, credentialType, claims, issuerPrivateKey } = req.body;
    const result = await DIDService.issueCredential(subjectDID, credentialType, claims, issuerPrivateKey);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const verifyCredential = async (req, res) => {
  try {
    const { credential } = req.body;
    const result = await DIDService.verifyCredential(credential);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const linkDIDToDomain = async (req, res) => {
  try {
    const { didId, domain, proof } = req.body;
    const result = await DIDService.linkDIDToDomain(didId, domain, proof);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

// KYC/AML Compliance
const performKYC = async (req, res) => {
  try {
    const { userData, didId } = req.body;
    const result = await ComplianceService.performKYC(userData, didId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const performAML = async (req, res) => {
  try {
    const { transactionData, didId } = req.body;
    const result = await ComplianceService.performAML(transactionData, didId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const generateAuthToken = async (req, res) => {
  try {
    const { didId, complianceData } = req.body;
    const result = await ComplianceService.generateAuthToken(didId, complianceData);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const validateAuthToken = async (req, res) => {
  try {
    const { token } = req.body;
    const result = await ComplianceService.validateAuthToken(token);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

// NFC Compliance Workflow
const initiateNFCCompliance = async (req, res) => {
  try {
    const { nfcData, deviceInfo } = req.body;
    const result = await NFCComplianceService.initiateNFCCompliance(nfcData, deviceInfo);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const processNFCVerification = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { userData } = req.body;
    const result = await NFCComplianceService.processNFCVerification(workflowId, userData);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const validateNFCTransaction = async (req, res) => {
  try {
    const { nfcData, authToken } = req.body;
    const result = await NFCComplianceService.validateNFCTransaction(nfcData, authToken);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getWorkflowStatus = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const result = await NFCComplianceService.getWorkflowStatus(workflowId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getComplianceReport = async (req, res) => {
  try {
    const { didId } = req.params;
    const result = await NFCComplianceService.getComplianceReport(didId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

// Compliance Dashboard
const getComplianceDashboard = async (req, res) => {
  try {
    // Mock dashboard data - in production, aggregate from database
    const dashboard = {
      summary: {
        totalUsers: 1250,
        approvedUsers: 1100,
        pendingReviews: 85,
        rejectedUsers: 65,
        complianceRate: 88.0
      },
      kycStats: {
        totalKYC: 1250,
        approved: 1100,
        pending: 85,
        rejected: 65,
        averageProcessingTime: '2.5 hours'
      },
      amlStats: {
        totalScreenings: 3420,
        flagged: 45,
        cleared: 3375,
        falsePositives: 12,
        averageScreeningTime: '15 seconds'
      },
      riskDistribution: {
        low: 850,
        medium: 250,
        high: 85,
        critical: 15
      },
      recentActivity: [
        {
          id: '1',
          type: 'KYC_APPROVED',
          didId: 'did:hedera:testnet:0.0.123456',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          riskLevel: 'LOW'
        },
        {
          id: '2',
          type: 'AML_FLAGGED',
          didId: 'did:hedera:testnet:0.0.789012',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          riskLevel: 'HIGH'
        },
        {
          id: '3',
          type: 'NFC_VERIFICATION',
          didId: 'did:hedera:testnet:0.0.345678',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          riskLevel: 'MEDIUM'
        }
      ],
      alerts: [
        {
          id: '1',
          type: 'HIGH_RISK_TRANSACTION',
          message: 'Large transaction detected requiring manual review',
          severity: 'HIGH',
          timestamp: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: '2',
          type: 'SANCTIONS_MATCH',
          message: 'Potential sanctions list match requires investigation',
          severity: 'CRITICAL',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      generatedAt: new Date().toISOString()
    };

    res.send(dashboard);
  } catch (error) {
    res.status(500).send({
      errorCode: 500,
      error: error.message
    });
  }
};

// Audit and Reporting
const getAuditLog = async (req, res) => {
  try {
    const { startDate, endDate, eventType, didId } = req.query;
    
    // Mock audit log - in production, query from encrypted audit database
    const auditLog = {
      events: [
        {
          id: '1',
          eventType: 'KYC_INITIATED',
          didId: 'did:hedera:testnet:0.0.123456',
          timestamp: new Date().toISOString(),
          details: 'KYC process started for new user',
          riskLevel: 'LOW',
          outcome: 'SUCCESS'
        },
        {
          id: '2',
          eventType: 'AML_SCREENING',
          didId: 'did:hedera:testnet:0.0.789012',
          timestamp: new Date().toISOString(),
          details: 'AML screening performed for transaction',
          riskLevel: 'MEDIUM',
          outcome: 'FLAGGED'
        },
        {
          id: '3',
          eventType: 'NFC_TRANSACTION',
          didId: 'did:hedera:testnet:0.0.345678',
          timestamp: new Date().toISOString(),
          details: 'NFC transaction validated and approved',
          riskLevel: 'LOW',
          outcome: 'APPROVED'
        }
      ],
      totalEvents: 3,
      filters: {
        startDate,
        endDate,
        eventType,
        didId
      },
      generatedAt: new Date().toISOString()
    };

    res.send(auditLog);
  } catch (error) {
    res.status(500).send({
      errorCode: 500,
      error: error.message
    });
  }
};

export {
  // DID Management
  createDID,
  resolveDID,
  issueCredential,
  verifyCredential,
  linkDIDToDomain,
  
  // KYC/AML
  performKYC,
  performAML,
  generateAuthToken,
  validateAuthToken,
  
  // NFC Compliance
  initiateNFCCompliance,
  processNFCVerification,
  validateNFCTransaction,
  getWorkflowStatus,
  getComplianceReport,
  
  // Dashboard & Reporting
  getComplianceDashboard,
  getAuditLog
};
