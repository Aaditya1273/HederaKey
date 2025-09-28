const { Client, PrivateKey, PublicKey } = require("@hashgraph/sdk");

class HederaDIDService {
  constructor() {
    this.client = null;
    this.didRegistry = new Map(); // Mock DID registry
    this.initialize();
  }

  async initialize() {
    // Initialize Hedera client for DID operations
    this.client = Client.forTestnet();
    console.log('✅ Hedera DID Service initialized');
  }

  /**
   * Create Decentralized Identity for user
   */
  async createDID(userData) {
    try {
      const { hederaAccountId, publicKey, kycData } = userData;
      
      // Generate DID document
      const didDocument = {
        "@context": ["https://www.w3.org/ns/did/v1"],
        "id": `did:hedera:testnet:${hederaAccountId}`,
        "verificationMethod": [{
          "id": `did:hedera:testnet:${hederaAccountId}#key-1`,
          "type": "Ed25519VerificationKey2020",
          "controller": `did:hedera:testnet:${hederaAccountId}`,
          "publicKeyMultibase": publicKey
        }],
        "authentication": [`did:hedera:testnet:${hederaAccountId}#key-1`],
        "service": [{
          "id": `did:hedera:testnet:${hederaAccountId}#hederakey-service`,
          "type": "HederaKeyNFCService",
          "serviceEndpoint": "https://api.hederakey.com/did"
        }],
        "created": new Date().toISOString(),
        "updated": new Date().toISOString()
      };

      // Create verifiable credentials for KYC
      const kycCredential = await this.createKYCCredential(didDocument.id, kycData);
      
      // Store in mock registry (in production, store on Hedera File Service)
      this.didRegistry.set(didDocument.id, {
        document: didDocument,
        credentials: [kycCredential],
        status: 'active'
      });

      return {
        did: didDocument.id,
        document: didDocument,
        kycCredential,
        status: 'created'
      };
      
    } catch (error) {
      throw new Error(`DID creation failed: ${error.message}`);
    }
  }

  /**
   * Create KYC Verifiable Credential
   */
  async createKYCCredential(did, kycData) {
    const credential = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://hederakey.com/credentials/kyc/v1"
      ],
      "id": `urn:uuid:${this.generateUUID()}`,
      "type": ["VerifiableCredential", "KYCCredential"],
      "issuer": "did:hedera:testnet:hederakey-issuer",
      "issuanceDate": new Date().toISOString(),
      "credentialSubject": {
        "id": did,
        "kycLevel": this.calculateKYCLevel(kycData),
        "country": kycData.country,
        "verificationStatus": kycData.verified ? "VERIFIED" : "PENDING",
        "riskScore": kycData.riskScore || 0.1,
        "complianceFlags": {
          "amlCheck": true,
          "sanctionsList": false,
          "pepCheck": false
        }
      },
      "proof": {
        "type": "Ed25519Signature2020",
        "created": new Date().toISOString(),
        "verificationMethod": "did:hedera:testnet:hederakey-issuer#key-1",
        "proofPurpose": "assertionMethod",
        "proofValue": this.generateMockProof()
      }
    };

    return credential;
  }

  /**
   * Verify DID and credentials
   */
  async verifyDID(did) {
    try {
      const didRecord = this.didRegistry.get(did);
      
      if (!didRecord) {
        return {
          valid: false,
          error: 'DID not found'
        };
      }

      // Verify KYC credential
      const kycCredential = didRecord.credentials.find(c => 
        c.type.includes('KYCCredential')
      );

      if (!kycCredential) {
        return {
          valid: false,
          error: 'No KYC credential found'
        };
      }

      // Check credential validity
      const isValid = this.validateCredential(kycCredential);
      
      return {
        valid: isValid,
        did,
        kycLevel: kycCredential.credentialSubject.kycLevel,
        verificationStatus: kycCredential.credentialSubject.verificationStatus,
        complianceScore: this.calculateComplianceScore(kycCredential),
        lastVerified: kycCredential.issuanceDate
      };
      
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate KYC level based on provided data
   */
  calculateKYCLevel(kycData) {
    let level = 0;
    
    if (kycData.firstName && kycData.lastName) level += 1;
    if (kycData.phoneNumber) level += 1;
    if (kycData.country) level += 1;
    if (kycData.hederaAccountId) level += 1;
    if (kycData.verified) level += 1;
    
    const levels = ['NONE', 'BASIC', 'STANDARD', 'ENHANCED', 'PREMIUM'];
    return levels[Math.min(level, 4)];
  }

  /**
   * Calculate compliance score
   */
  calculateComplianceScore(credential) {
    const subject = credential.credentialSubject;
    let score = 0;
    
    // Base score from KYC level
    const levelScores = {
      'NONE': 0,
      'BASIC': 20,
      'STANDARD': 50,
      'ENHANCED': 80,
      'PREMIUM': 95
    };
    
    score += levelScores[subject.kycLevel] || 0;
    
    // Compliance flags bonus
    if (subject.complianceFlags.amlCheck) score += 5;
    if (!subject.complianceFlags.sanctionsList) score += 5;
    if (!subject.complianceFlags.pepCheck) score += 5;
    
    // Risk score penalty
    score -= (subject.riskScore * 10);
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Validate credential integrity
   */
  validateCredential(credential) {
    // Check required fields
    if (!credential.credentialSubject || !credential.proof) {
      return false;
    }
    
    // Check expiration (if applicable)
    if (credential.expirationDate) {
      const expiry = new Date(credential.expirationDate);
      if (expiry < new Date()) {
        return false;
      }
    }
    
    // Verify proof (mock verification)
    return this.verifyProof(credential.proof);
  }

  /**
   * Generate mock cryptographic proof
   */
  generateMockProof() {
    // In production, this would be a real cryptographic signature
    return Buffer.from(JSON.stringify({
      timestamp: Date.now(),
      nonce: Math.random().toString(36)
    })).toString('base64');
  }

  /**
   * Verify cryptographic proof
   */
  verifyProof(proof) {
    // Mock verification - in production, verify actual signature
    try {
      const decoded = JSON.parse(Buffer.from(proof.proofValue, 'base64').toString());
      return decoded.timestamp && decoded.nonce;
    } catch {
      return false;
    }
  }

  /**
   * Generate UUID for credentials
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get DID analytics
   */
  async getDIDAnalytics() {
    const dids = Array.from(this.didRegistry.values());
    
    return {
      totalDIDs: dids.length,
      verifiedDIDs: dids.filter(d => 
        d.credentials.some(c => 
          c.credentialSubject.verificationStatus === 'VERIFIED'
        )
      ).length,
      kycLevels: dids.reduce((acc, d) => {
        const kycCred = d.credentials.find(c => c.type.includes('KYCCredential'));
        const level = kycCred?.credentialSubject.kycLevel || 'NONE';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {}),
      averageComplianceScore: dids.reduce((sum, d) => {
        const kycCred = d.credentials.find(c => c.type.includes('KYCCredential'));
        return sum + (kycCred ? this.calculateComplianceScore(kycCred) : 0);
      }, 0) / dids.length || 0
    };
  }
}

module.exports = new HederaDIDService();
