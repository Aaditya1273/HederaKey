import crypto from 'crypto';
import logger from '../utils/logger';
import { encryptGDPRData, decryptGDPRData, DATA_CLASSIFICATION } from '../utils/encryption';
import { createDID, resolveDID, issueCredential } from './did';
import { performKYC, performAML, generateAuthToken, COMPLIANCE_STATUS } from './compliance';

// NFC compliance workflow states
const NFC_WORKFLOW_STATES = {
  INITIATED: 'INITIATED',
  DID_CREATED: 'DID_CREATED',
  KYC_PENDING: 'KYC_PENDING',
  KYC_APPROVED: 'KYC_APPROVED',
  AML_PENDING: 'AML_PENDING',
  AML_APPROVED: 'AML_APPROVED',
  COMPLIANCE_COMPLETE: 'COMPLIANCE_COMPLETE',
  TOKEN_ISSUED: 'TOKEN_ISSUED',
  FAILED: 'FAILED'
};

// NFC transaction types that require compliance
const COMPLIANCE_REQUIRED_TRANSACTIONS = [
  'transfer',
  'mint',
  'create_account',
  'domain_link',
  'rwa_transfer'
];

// Mock NFC compliance workflow
class NFCComplianceWorkflow {
  constructor() {
    this.workflows = new Map(); // In production, use persistent storage
    this.complianceCache = new Map(); // Cache for approved users
  }

  async initiateWorkflow(nfcData, deviceInfo) {
    try {
      const workflowId = crypto.randomUUID();
      
      logger.info('NFCComplianceWorkflow', 'initiateWorkflow', `Starting workflow: ${workflowId}`);

      const workflow = {
        id: workflowId,
        state: NFC_WORKFLOW_STATES.INITIATED,
        nfcData: await encryptGDPRData(JSON.stringify(nfcData), DATA_CLASSIFICATION.SENSITIVE, 'compliance'),
        deviceInfo: await encryptGDPRData(JSON.stringify(deviceInfo), DATA_CLASSIFICATION.PII, 'compliance'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        steps: [],
        complianceResults: {}
      };

      this.workflows.set(workflowId, workflow);

      // Add initial step
      await this.addWorkflowStep(workflowId, 'WORKFLOW_INITIATED', {
        nfcTransactionType: nfcData.type,
        deviceId: deviceInfo.deviceId,
        location: deviceInfo.location
      });

      return {
        workflowId,
        state: workflow.state,
        requiresCompliance: this.requiresCompliance(nfcData.type),
        nextStep: 'CREATE_DID'
      };

    } catch (error) {
      logger.error('NFCComplianceWorkflow', 'initiateWorkflow', error.message);
      throw {
        errorCode: 500,
        error: error.message
      };
    }
  }

  async processNFCVerification(workflowId, userData) {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      logger.info('NFCComplianceWorkflow', 'processNFCVerification', `Processing verification for workflow: ${workflowId}`);

      // Step 1: Create or resolve DID
      let didResult;
      if (userData.existingDID) {
        didResult = await resolveDID(userData.existingDID);
        workflow.didId = userData.existingDID;
      } else {
        didResult = await createDID(userData.accountId, userData.privateKey);
        workflow.didId = didResult.did;
      }

      workflow.state = NFC_WORKFLOW_STATES.DID_CREATED;
      workflow.complianceResults.did = didResult;

      await this.addWorkflowStep(workflowId, 'DID_PROCESSED', {
        didId: workflow.didId,
        created: !userData.existingDID
      });

      // Step 2: Perform KYC verification
      workflow.state = NFC_WORKFLOW_STATES.KYC_PENDING;
      
      const kycResult = await performKYC(userData, workflow.didId);
      workflow.complianceResults.kyc = kycResult;

      if (kycResult.status === COMPLIANCE_STATUS.APPROVED) {
        workflow.state = NFC_WORKFLOW_STATES.KYC_APPROVED;
        
        await this.addWorkflowStep(workflowId, 'KYC_APPROVED', {
          kycId: kycResult.kycId,
          riskLevel: kycResult.riskAssessment.riskLevel
        });
      } else {
        workflow.state = NFC_WORKFLOW_STATES.FAILED;
        
        await this.addWorkflowStep(workflowId, 'KYC_FAILED', {
          kycId: kycResult.kycId,
          reason: kycResult.message
        });

        throw new Error(`KYC verification failed: ${kycResult.message}`);
      }

      // Step 3: Check if transaction requires AML screening
      const decryptedNFCData = await decryptGDPRData(workflow.nfcData);
      const nfcData = JSON.parse(decryptedNFCData.data);

      if (this.requiresAMLScreening(nfcData)) {
        workflow.state = NFC_WORKFLOW_STATES.AML_PENDING;

        const amlResult = await performAML({
          transactionId: crypto.randomUUID(),
          amount: nfcData.amount,
          from: userData.accountId,
          to: nfcData.destination,
          type: nfcData.type
        }, workflow.didId);

        workflow.complianceResults.aml = amlResult;

        if (amlResult.status === COMPLIANCE_STATUS.APPROVED) {
          workflow.state = NFC_WORKFLOW_STATES.AML_APPROVED;
          
          await this.addWorkflowStep(workflowId, 'AML_APPROVED', {
            amlId: amlResult.amlId,
            riskLevel: amlResult.riskAssessment.riskLevel
          });
        } else {
          workflow.state = NFC_WORKFLOW_STATES.FAILED;
          
          await this.addWorkflowStep(workflowId, 'AML_FAILED', {
            amlId: amlResult.amlId,
            reason: amlResult.message
          });

          throw new Error(`AML screening failed: ${amlResult.message}`);
        }
      }

      // Step 4: Generate compliance auth token
      workflow.state = NFC_WORKFLOW_STATES.COMPLIANCE_COMPLETE;

      const authToken = await generateAuthToken(workflow.didId, {
        kycStatus: kycResult.status,
        kycLevel: 'BASIC',
        riskLevel: kycResult.riskAssessment.riskLevel,
        jurisdiction: userData.jurisdiction,
        verifiedAt: new Date().toISOString()
      });

      workflow.complianceResults.authToken = authToken;
      workflow.state = NFC_WORKFLOW_STATES.TOKEN_ISSUED;
      workflow.updatedAt = new Date().toISOString();

      await this.addWorkflowStep(workflowId, 'AUTH_TOKEN_ISSUED', {
        tokenExpiresAt: authToken.expiresAt,
        permissions: authToken.permissions
      });

      // Cache the compliance result for future NFC transactions
      this.complianceCache.set(workflow.didId, {
        approved: true,
        authToken: authToken.token,
        expiresAt: authToken.expiresAt,
        cachedAt: new Date().toISOString()
      });

      logger.info('NFCComplianceWorkflow', 'processNFCVerification', `Workflow completed successfully: ${workflowId}`);

      return {
        workflowId,
        state: workflow.state,
        didId: workflow.didId,
        authToken: authToken.token,
        expiresAt: authToken.expiresAt,
        complianceLevel: 'APPROVED',
        permissions: authToken.permissions
      };

    } catch (error) {
      const workflow = this.workflows.get(workflowId);
      if (workflow) {
        workflow.state = NFC_WORKFLOW_STATES.FAILED;
        workflow.error = error.message;
        workflow.updatedAt = new Date().toISOString();

        await this.addWorkflowStep(workflowId, 'WORKFLOW_FAILED', {
          error: error.message
        });
      }

      logger.error('NFCComplianceWorkflow', 'processNFCVerification', error.message);
      throw {
        errorCode: 403,
        error: error.message,
        workflowId
      };
    }
  }

  async validateNFCTransaction(nfcData, authToken) {
    try {
      logger.info('NFCComplianceWorkflow', 'validateNFCTransaction', `Validating NFC transaction`);

      // Validate auth token
      const { validateAuthToken } = await import('./compliance');
      const tokenValidation = await validateAuthToken(authToken);

      if (!tokenValidation.valid) {
        throw new Error('Invalid or expired auth token');
      }

      // Check if transaction type is allowed
      const requiredPermissions = this.getRequiredPermissions(nfcData.type);
      const hasPermissions = requiredPermissions.every(perm => 
        tokenValidation.permissions.includes(perm)
      );

      if (!hasPermissions) {
        throw new Error('Insufficient permissions for transaction type');
      }

      // Additional compliance checks for high-value transactions
      if (nfcData.amount && parseFloat(nfcData.amount) > 10000) {
        const enhancedCheck = await this.performEnhancedCompliance(nfcData, tokenValidation.didId);
        if (!enhancedCheck.approved) {
          throw new Error('Enhanced compliance check failed');
        }
      }

      return {
        valid: true,
        didId: tokenValidation.didId,
        compliance: tokenValidation.compliance,
        permissions: tokenValidation.permissions,
        transactionAllowed: true
      };

    } catch (error) {
      logger.error('NFCComplianceWorkflow', 'validateNFCTransaction', error.message);
      return {
        valid: false,
        error: error.message,
        transactionAllowed: false
      };
    }
  }

  async addWorkflowStep(workflowId, stepType, data) {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      const step = {
        id: crypto.randomUUID(),
        type: stepType,
        data: await encryptGDPRData(JSON.stringify(data), DATA_CLASSIFICATION.SENSITIVE, 'compliance'),
        timestamp: new Date().toISOString()
      };

      workflow.steps.push(step);
      workflow.updatedAt = new Date().toISOString();
    }
  }

  requiresCompliance(transactionType) {
    return COMPLIANCE_REQUIRED_TRANSACTIONS.includes(transactionType);
  }

  requiresAMLScreening(nfcData) {
    // AML screening required for transfers above threshold
    if (nfcData.type === 'transfer' && nfcData.amount) {
      return parseFloat(nfcData.amount) > 1000; // $1000 threshold
    }
    
    // Always screen RWA transfers
    if (nfcData.type === 'rwa_transfer') {
      return true;
    }

    return false;
  }

  getRequiredPermissions(transactionType) {
    const permissionMap = {
      'transfer': ['rwa:transfer'],
      'mint': ['rwa:mint'],
      'create_account': ['rwa:create'],
      'domain_link': ['domain:link'],
      'rwa_transfer': ['rwa:transfer', 'rwa:read'],
      'balance': ['rwa:read']
    };

    return permissionMap[transactionType] || ['rwa:read'];
  }

  async performEnhancedCompliance(nfcData, didId) {
    try {
      // Enhanced compliance for high-value transactions
      // This could include additional identity verification, 
      // source of funds checks, etc.
      
      logger.info('NFCComplianceWorkflow', 'performEnhancedCompliance', `Enhanced compliance check for DID: ${didId}`);

      // Simulate enhanced checks
      const checks = {
        sourceOfFunds: Math.random() > 0.1, // 90% pass rate
        enhancedDueDiligence: Math.random() > 0.05, // 95% pass rate
        sanctionsScreening: Math.random() > 0.02, // 98% pass rate
        politicallyExposed: Math.random() > 0.01 // 99% pass rate
      };

      const allPassed = Object.values(checks).every(check => check);

      return {
        approved: allPassed,
        checks,
        performedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('NFCComplianceWorkflow', 'performEnhancedCompliance', error.message);
      return {
        approved: false,
        error: error.message,
        performedAt: new Date().toISOString()
      };
    }
  }

  async getWorkflowStatus(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    return {
      workflowId,
      state: workflow.state,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      stepCount: workflow.steps.length,
      hasError: !!workflow.error,
      error: workflow.error
    };
  }

  async getComplianceReport(didId) {
    try {
      // Generate compliance report for a DID
      const workflows = Array.from(this.workflows.values())
        .filter(w => w.didId === didId);

      const report = {
        didId,
        totalWorkflows: workflows.length,
        successfulWorkflows: workflows.filter(w => w.state === NFC_WORKFLOW_STATES.TOKEN_ISSUED).length,
        failedWorkflows: workflows.filter(w => w.state === NFC_WORKFLOW_STATES.FAILED).length,
        lastActivity: workflows.length > 0 ? Math.max(...workflows.map(w => new Date(w.updatedAt))) : null,
        complianceLevel: this.complianceCache.has(didId) ? 'APPROVED' : 'PENDING',
        generatedAt: new Date().toISOString()
      };

      return report;

    } catch (error) {
      logger.error('NFCComplianceWorkflow', 'getComplianceReport', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        didId
      };
    }
  }
}

// Create singleton instance
const nfcComplianceWorkflow = new NFCComplianceWorkflow();

// Export functions
const initiateNFCCompliance = async (nfcData, deviceInfo) => {
  return await nfcComplianceWorkflow.initiateWorkflow(nfcData, deviceInfo);
};

const processNFCVerification = async (workflowId, userData) => {
  return await nfcComplianceWorkflow.processNFCVerification(workflowId, userData);
};

const validateNFCTransaction = async (nfcData, authToken) => {
  return await nfcComplianceWorkflow.validateNFCTransaction(nfcData, authToken);
};

const getWorkflowStatus = async (workflowId) => {
  return await nfcComplianceWorkflow.getWorkflowStatus(workflowId);
};

const getComplianceReport = async (didId) => {
  return await nfcComplianceWorkflow.getComplianceReport(didId);
};

export {
  NFC_WORKFLOW_STATES,
  COMPLIANCE_REQUIRED_TRANSACTIONS,
  NFCComplianceWorkflow,
  initiateNFCCompliance,
  processNFCVerification,
  validateNFCTransaction,
  getWorkflowStatus,
  getComplianceReport
};
