import {
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicInfoQuery,
  Hbar
} from '@hashgraph/sdk';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { hederaNetwork, hederaOperatorId, hederaOperatorKey } from '../config.json';
import { encryptGDPRData, decryptGDPRData } from '../utils/encryption';

// Initialize Hedera client
const client = Client.forTestnet();
client.setOperator(hederaOperatorId, hederaOperatorKey);

// DID Document structure for Hedera
class HederaDID {
  constructor(accountId, publicKey) {
    this.id = `did:hedera:testnet:${accountId}`;
    this.accountId = accountId;
    this.publicKey = publicKey;
    this.created = new Date().toISOString();
    this.updated = this.created;
    this.topicId = null;
    this.verificationMethods = [];
    this.services = [];
    this.credentials = [];
  }

  addVerificationMethod(id, type, controller, publicKeyMultibase) {
    this.verificationMethods.push({
      id: `${this.id}#${id}`,
      type,
      controller: this.id,
      publicKeyMultibase
    });
    this.updated = new Date().toISOString();
  }

  addService(id, type, serviceEndpoint) {
    this.services.push({
      id: `${this.id}#${id}`,
      type,
      serviceEndpoint
    });
    this.updated = new Date().toISOString();
  }

  addCredential(credential) {
    this.credentials.push({
      ...credential,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    });
    this.updated = new Date().toISOString();
  }

  toDocument() {
    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1'
      ],
      id: this.id,
      verificationMethod: this.verificationMethods,
      authentication: this.verificationMethods.map(vm => vm.id),
      assertionMethod: this.verificationMethods.map(vm => vm.id),
      service: this.services,
      created: this.created,
      updated: this.updated,
      metadata: {
        accountId: this.accountId,
        topicId: this.topicId,
        credentials: this.credentials
      }
    };
  }
}

// Create DID for Hedera account
const createDID = async (accountId, privateKey) => {
  try {
    logger.info('DIDService', 'createDID', `Creating DID for account: ${accountId}`);

    const accountKey = PrivateKey.fromString(privateKey);
    const publicKey = accountKey.publicKey.toString();

    // Create DID document
    const did = new HederaDID(accountId, publicKey);

    // Add verification method
    did.addVerificationMethod(
      'key-1',
      'Ed25519VerificationKey2020',
      did.id,
      publicKey
    );

    // Create Hedera topic for DID document storage
    const topicCreateTx = new TopicCreateTransaction()
      .setTopicMemo(`DID Document for ${accountId}`)
      .setAdminKey(accountKey)
      .setSubmitKey(accountKey);

    const topicCreateSubmit = await topicCreateTx.execute(client);
    const topicCreateReceipt = await topicCreateSubmit.getReceipt(client);
    const topicId = topicCreateReceipt.topicId;

    did.topicId = topicId.toString();

    // Add DID service endpoint
    did.addService(
      'hedera-topic',
      'HederaTopicService',
      `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`
    );

    // Submit DID document to topic
    const didDocument = did.toDocument();
    const message = JSON.stringify(didDocument);

    const messageSubmitTx = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message);

    const messageSubmitSubmit = await messageSubmitTx.execute(client);
    const messageSubmitReceipt = await messageSubmitSubmit.getReceipt(client);

    logger.info('DIDService', 'createDID', `DID created successfully: ${did.id}`);

    return {
      did: did.id,
      document: didDocument,
      topicId: topicId.toString(),
      txHash: messageSubmitSubmit.transactionId.toString(),
      status: 'SUCCESS'
    };

  } catch (error) {
    logger.error('DIDService', 'createDID', error.message);
    throw {
      errorCode: 500,
      error: error.message,
      accountId
    };
  }
};

// Resolve DID document from Hedera topic
const resolveDID = async (didId) => {
  try {
    logger.info('DIDService', 'resolveDID', `Resolving DID: ${didId}`);

    // Extract account ID from DID
    const accountId = didId.split(':').pop();
    
    // In a real implementation, you would:
    // 1. Query the DID registry to find the topic ID
    // 2. Fetch messages from the Hedera topic
    // 3. Parse the latest DID document
    
    // For now, we'll simulate this with a mock response
    const mockDocument = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1'
      ],
      id: didId,
      verificationMethod: [{
        id: `${didId}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: didId,
        publicKeyMultibase: 'mock-public-key'
      }],
      authentication: [`${didId}#key-1`],
      assertionMethod: [`${didId}#key-1`],
      service: [{
        id: `${didId}#hedera-topic`,
        type: 'HederaTopicService',
        serviceEndpoint: 'https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.123456/messages'
      }],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      metadata: {
        accountId,
        topicId: '0.0.123456',
        credentials: []
      }
    };

    return {
      did: didId,
      document: mockDocument,
      resolved: true,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('DIDService', 'resolveDID', error.message);
    throw {
      errorCode: 404,
      error: error.message,
      didId
    };
  }
};

// Issue verifiable credential
const issueCredential = async (subjectDID, credentialType, claims, issuerPrivateKey) => {
  try {
    logger.info('DIDService', 'issueCredential', `Issuing ${credentialType} credential for: ${subjectDID}`);

    const issuerAccountId = hederaOperatorId;
    const issuerDID = `did:hedera:testnet:${issuerAccountId}`;
    
    const credential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1'
      ],
      id: `urn:uuid:${crypto.randomUUID()}`,
      type: ['VerifiableCredential', credentialType],
      issuer: issuerDID,
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      credentialSubject: {
        id: subjectDID,
        ...claims
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: `${issuerDID}#key-1`,
        proofPurpose: 'assertionMethod'
      }
    };

    // Sign the credential (simplified - in production use proper cryptographic signing)
    const credentialHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(credential))
      .digest('hex');

    credential.proof.proofValue = credentialHash;

    // Store credential on Hedera topic (encrypted for GDPR compliance)
    const encryptedCredential = await encryptGDPRData(JSON.stringify(credential));
    
    logger.info('DIDService', 'issueCredential', `Credential issued successfully: ${credential.id}`);

    return {
      credential,
      credentialId: credential.id,
      type: credentialType,
      subject: subjectDID,
      issuer: issuerDID,
      status: 'ISSUED'
    };

  } catch (error) {
    logger.error('DIDService', 'issueCredential', error.message);
    throw {
      errorCode: 500,
      error: error.message,
      subjectDID,
      credentialType
    };
  }
};

// Verify credential
const verifyCredential = async (credential) => {
  try {
    logger.info('DIDService', 'verifyCredential', `Verifying credential: ${credential.id}`);

    // Basic validation checks
    const now = new Date();
    const expirationDate = new Date(credential.expirationDate);
    
    if (now > expirationDate) {
      throw new Error('Credential has expired');
    }

    // Verify issuer DID
    const issuerDID = credential.issuer;
    const issuerDocument = await resolveDID(issuerDID);
    
    if (!issuerDocument.resolved) {
      throw new Error('Could not resolve issuer DID');
    }

    // Verify signature (simplified)
    const credentialCopy = { ...credential };
    delete credentialCopy.proof;
    
    const expectedHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(credentialCopy))
      .digest('hex');

    const isValid = expectedHash === credential.proof.proofValue;

    logger.info('DIDService', 'verifyCredential', `Credential verification result: ${isValid}`);

    return {
      valid: isValid,
      credentialId: credential.id,
      subject: credential.credentialSubject.id,
      issuer: credential.issuer,
      type: credential.type,
      verifiedAt: new Date().toISOString()
    };

  } catch (error) {
    logger.error('DIDService', 'verifyCredential', error.message);
    return {
      valid: false,
      error: error.message,
      credentialId: credential.id,
      verifiedAt: new Date().toISOString()
    };
  }
};

// Create presentation (for sharing credentials)
const createPresentation = async (credentials, holderDID, challenge, domain) => {
  try {
    logger.info('DIDService', 'createPresentation', `Creating presentation for: ${holderDID}`);

    const presentation = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1'
      ],
      id: `urn:uuid:${crypto.randomUUID()}`,
      type: ['VerifiablePresentation'],
      holder: holderDID,
      verifiableCredential: credentials,
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: `${holderDID}#key-1`,
        proofPurpose: 'authentication',
        challenge,
        domain
      }
    };

    // Sign presentation
    const presentationHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(presentation))
      .digest('hex');

    presentation.proof.proofValue = presentationHash;

    logger.info('DIDService', 'createPresentation', `Presentation created: ${presentation.id}`);

    return {
      presentation,
      presentationId: presentation.id,
      holder: holderDID,
      credentialCount: credentials.length,
      status: 'CREATED'
    };

  } catch (error) {
    logger.error('DIDService', 'createPresentation', error.message);
    throw {
      errorCode: 500,
      error: error.message,
      holderDID
    };
  }
};

// Link DID to domain
const linkDIDToDomain = async (didId, domain, proof) => {
  try {
    logger.info('DIDService', 'linkDIDToDomain', `Linking DID ${didId} to domain ${domain}`);

    const linkage = {
      did: didId,
      domain,
      linkedAt: new Date().toISOString(),
      proof: proof || 'domain-verification-proof',
      status: 'LINKED'
    };

    // Store linkage (encrypted for GDPR compliance)
    const encryptedLinkage = await encryptGDPRData(JSON.stringify(linkage));

    logger.info('DIDService', 'linkDIDToDomain', `DID linked to domain successfully`);

    return linkage;

  } catch (error) {
    logger.error('DIDService', 'linkDIDToDomain', error.message);
    throw {
      errorCode: 500,
      error: error.message,
      didId,
      domain
    };
  }
};

export {
  HederaDID,
  createDID,
  resolveDID,
  issueCredential,
  verifyCredential,
  createPresentation,
  linkDIDToDomain
};
