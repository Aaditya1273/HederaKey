import { Router } from 'express';
import { version } from '../../package.json';
import { create, getBalance, transaction, deleteAccount } from '../controllers/wallet';
import { resolveDomain, reverseResolve, getHederaInfo, linkToHedera, queryMirrorNode } from '../controllers/domain';
import { createToken, mintToken, mintNFT, associateToken, getTokenInfo } from '../controllers/token';
import {
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
} from '../controllers/compliance';

import {
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
} from '../controllers/ai-fraud';

import {
  // Node Management
  registerRelayNode,
  deregisterRelayNode,
  getNetworkStatus,
  getNodeDetails,
  getNodesByOperator,
  getCityHubDetails,
  simulateNetworkLoad,
  
  // Integrated Flow
  processNFCThroughDePIN,
  
  // Staking & Rewards
  stakeForNode,
  claimRewards,
  getRewardsSummary,
  
  // Analytics & Dashboard
  getNetworkAnalytics,
  getDePINDashboard
} from '../controllers/depin';

import {
  // ZK Proofs
  generateZKProof,
  verifyZKProof,
  
  // Data Anonymization
  anonymizeNFCData,
  anonymizeDomainData,
  
  // Privacy-Preserving AI
  analyzeTransactionPrivately,
  updateModelPrivately,
  
  // Privacy Management
  createPrivacyPreservingID,
  processEncryptedPayload,
  
  // Monitoring & Audit
  getPrivacyMetrics,
  getPrivacyDashboard,
  generatePrivacyAudit
} from '../controllers/privacy';

import {
  // RWA Tokenization
  tokenizeAsset,
  processNFCTokenization,
  getTokenizationDetails,
  listTokenizedAssets,
  
  // AMM Liquidity
  createLiquidityPool,
  addLiquidity,
  removeLiquidity,
  swapTokens,
  getSwapQuote,
  getPoolInfo,
  getUserPositions,
  getAllPools,
  
  // Lending
  createLoan,
  repayLoan,
  lendToPool,
  withdrawFromPool,
  getLoanDetails,
  getUserLoans,
  getLendingPoolInfo,
  getAllLendingPools,
  
  // Oracle Pricing
  getPrice,
  getPriceHistory,
  getMultiplePrices,
  calculateRWAPrice,
  getAllPrices,
  getMarketSummary,
  
  // Dashboard
  getRWADashboard
} from '../controllers/rwa';

const router = Router();

// Wallet endpoints
router.get('/createWallet', create);
router.get('/getBalance/:accountId', getBalance);
router.post('/transaction', transaction);
router.post('/deleteAccount', deleteAccount);

// Enhanced domain resolution endpoints
router.get('/domain/resolve/:domain', resolveDomain);
router.post('/domain/reverse', reverseResolve);
router.get('/hedera/account/:accountId', getHederaInfo);
router.post('/domain/link-hedera', linkToHedera);
router.get('/hedera/mirror/:accountId', queryMirrorNode);

// Token endpoints
router.post('/tokens/create', createToken);
router.post('/tokens/mint', mintToken);
router.post('/tokens/mint-nft', mintNFT);
router.post('/tokens/associate', associateToken);
router.get('/tokens/:tokenId', getTokenInfo);

// DID Management endpoints
router.post('/did/create', createDID);
router.get('/did/resolve/:didId', resolveDID);
router.post('/did/issue-credential', issueCredential);
router.post('/did/verify-credential', verifyCredential);
router.post('/did/link-domain', linkDIDToDomain);

// KYC/AML Compliance endpoints
router.post('/compliance/kyc', performKYC);
router.post('/compliance/aml', performAML);
router.post('/compliance/auth-token', generateAuthToken);
router.post('/compliance/validate-token', validateAuthToken);

// NFC Compliance endpoints
router.post('/nfc/compliance/initiate', initiateNFCCompliance);
router.post('/nfc/compliance/verify/:workflowId', processNFCVerification);
router.post('/nfc/compliance/validate', validateNFCTransaction);
router.get('/nfc/compliance/status/:workflowId', getWorkflowStatus);
router.get('/nfc/compliance/report/:didId', getComplianceReport);

// Compliance Dashboard & Reporting
router.get('/compliance/dashboard', getComplianceDashboard);
router.get('/compliance/audit-log', getAuditLog);

// RWA Tokenization endpoints
router.post('/rwa/tokenize', tokenizeAsset);
router.post('/rwa/nfc-tokenize', processNFCTokenization);
router.get('/rwa/tokenization/:tokenizationId', getTokenizationDetails);
router.get('/rwa/assets', listTokenizedAssets);

// AMM Liquidity endpoints
router.post('/rwa/amm/create-pool', createLiquidityPool);
router.post('/rwa/amm/add-liquidity', addLiquidity);
router.post('/rwa/amm/remove-liquidity', removeLiquidity);
router.post('/rwa/amm/swap', swapTokens);
router.get('/rwa/amm/quote', getSwapQuote);
router.get('/rwa/amm/pool/:poolId', getPoolInfo);
router.get('/rwa/amm/positions/:userAccountId', getUserPositions);
router.get('/rwa/amm/pools', getAllPools);

// Lending endpoints
router.post('/rwa/lending/loan', createLoan);
router.post('/rwa/lending/repay', repayLoan);
router.post('/rwa/lending/lend', lendToPool);
router.post('/rwa/lending/withdraw', withdrawFromPool);
router.get('/rwa/lending/loan/:loanId', getLoanDetails);
router.get('/rwa/lending/loans/:userAccountId', getUserLoans);
router.get('/rwa/lending/pool/:poolId', getLendingPoolInfo);
router.get('/rwa/lending/pools', getAllLendingPools);

// Oracle Pricing endpoints
router.get('/oracle/price/:symbol', getPrice);
router.get('/oracle/history/:symbol', getPriceHistory);
router.post('/oracle/prices', getMultiplePrices);
router.post('/oracle/rwa-price', calculateRWAPrice);
router.get('/oracle/prices', getAllPrices);
router.get('/oracle/market-summary', getMarketSummary);

// RWA Dashboard
router.get('/rwa/dashboard/:userAccountId', getRWADashboard);

// AI Fraud Detection endpoints
router.post('/ai/fraud-detection/analyze', analyzeTransaction);
router.post('/ai/fraud-detection/feedback', provideFeedback);
router.get('/ai/fraud-detection/metrics', getPerformanceMetrics);
router.get('/ai/fraud-detection/stats', getRealTimeStats);
router.get('/ai/fraud-detection/logs', getHCSLogs);

// HCS Log Analyzer endpoints
router.get('/ai/hcs/anomalies', getAnomalyReport);
router.get('/ai/hcs/metrics', getHCSMetrics);
router.get('/ai/hcs/profile/:accountId', getUserBehaviorProfile);

// NFC AI Pipeline endpoints
router.post('/ai/nfc-pipeline/process', processNFCScan);
router.get('/ai/nfc-pipeline/metrics', getPipelineMetrics);
router.get('/ai/nfc-pipeline/status/:pipelineId', getPipelineStatus);
router.get('/ai/nfc-pipeline/active', getActivePipelines);
router.post('/ai/nfc-pipeline/optimize-rural', optimizeForRuralNetworks);

// AI Dashboard & Simulation
router.get('/ai/dashboard', getAIDashboard);
router.post('/ai/simulate/rural-traffic', simulateRuralTraffic);

// DePIN Network Management endpoints
router.post('/depin/nodes/register', registerRelayNode);
router.delete('/depin/nodes/:nodeId', deregisterRelayNode);
router.get('/depin/network/status', getNetworkStatus);
router.get('/depin/nodes/:nodeId', getNodeDetails);
router.get('/depin/operators/:operatorId/nodes', getNodesByOperator);
router.get('/depin/cities/:cityId', getCityHubDetails);
router.post('/depin/network/simulate-load', simulateNetworkLoad);

// DePIN Integrated Flow
router.post('/depin/nfc/process', processNFCThroughDePIN);

// DePIN Staking & Rewards
router.post('/depin/stake', stakeForNode);
router.post('/depin/rewards/claim', claimRewards);
router.get('/depin/rewards/:operatorId', getRewardsSummary);

// DePIN Analytics & Dashboard
router.get('/depin/analytics', getNetworkAnalytics);
router.get('/depin/dashboard', getDePINDashboard);

// Privacy & ZK Proof endpoints
router.post('/privacy/zk/generate', generateZKProof);
router.post('/privacy/zk/verify', verifyZKProof);
router.post('/privacy/anonymize/nfc', anonymizeNFCData);
router.post('/privacy/anonymize/domain', anonymizeDomainData);
router.post('/privacy/ai/analyze', analyzeTransactionPrivately);
router.post('/privacy/ai/update', updateModelPrivately);
router.post('/privacy/id/create', createPrivacyPreservingID);
router.post('/privacy/payload/process', processEncryptedPayload);
router.get('/privacy/metrics', getPrivacyMetrics);
router.get('/privacy/dashboard', getPrivacyDashboard);
router.get('/privacy/audit', generatePrivacyAudit);

// System endpoints
router.get('/health', (req, res) => res.send({ version }));
router.get('*', (req, res) => res.send('.'));

export default router;
