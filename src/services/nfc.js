const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class NFCService {
  constructor() {
    this.encryptionKey = process.env.NFC_ENCRYPTION_KEY || crypto.randomBytes(32);
    this.algorithm = 'aes-256-gcm';
  }

  /**
   * Encrypt wallet data for NFC storage
   */
  encryptWalletData(walletData) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from('MindKeyNFC', 'utf8'));

      const payload = JSON.stringify({
        accountId: walletData.accountId,
        publicKey: walletData.publicKey,
        timestamp: Date.now(),
        version: '1.0'
      });

      let encrypted = cipher.update(payload, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        cardId: uuidv4()
      };
    } catch (error) {
      throw new Error(`NFC encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt wallet data from NFC
   */
  decryptWalletData(encryptedPayload) {
    try {
      const { encryptedData, iv, authTag } = encryptedPayload;
      
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAAD(Buffer.from('HederaKeyNFC', 'utf8'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const walletData = JSON.parse(decrypted);
      
      // Verify timestamp (prevent replay attacks)
      const age = Date.now() - walletData.timestamp;
      if (age > 24 * 60 * 60 * 1000) { // 24 hours
        throw new Error('NFC data expired');
      }

      return walletData;
    } catch (error) {
      throw new Error(`NFC decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate NFC NDEF record for wallet
   */
  generateNDEFRecord(walletData) {
    const encryptedPayload = this.encryptWalletData(walletData);
    
    // Create NDEF record structure
    const ndefRecord = {
      recordType: 'mime',
      mediaType: 'application/vnd.mindkey.wallet',
      data: {
        payload: encryptedPayload.encryptedData,
        iv: encryptedPayload.iv,
        authTag: encryptedPayload.authTag,
        cardId: encryptedPayload.cardId,
        appUrl: 'https://mindkey.app/nfc'
      }
    };

    return {
      ndef: ndefRecord,
      cardId: encryptedPayload.cardId,
      qrCode: this.generateQRBackup(encryptedPayload)
    };
  }

  /**
   * Generate QR code backup for NFC data
   */
  generateQRBackup(encryptedPayload) {
    const backupData = {
      type: 'mindkey-wallet-backup',
      data: encryptedPayload,
      timestamp: Date.now()
    };

    return Buffer.from(JSON.stringify(backupData)).toString('base64');
  }

  /**
   * Simulate NFC tap (for demo/testing)
   */
  simulateNFCTap(cardId = null) {
    // Mock NFC card data
    const mockCards = {
      'nfc_farm_001': {
        accountId: '0.0.123456',
        publicKey: '302a300506032b6570032100...',
        assetType: 'FARM_SHARE',
        assetId: 'farm_001',
        location: 'Lagos, Nigeria'
      },
      'nfc_real_estate_001': {
        accountId: '0.0.789012',
        publicKey: '302a300506032b6570032100...',
        assetType: 'REAL_ESTATE',
        assetId: 're_001',
        location: 'Nairobi, Kenya'
      },
      'nfc_carbon_001': {
        accountId: '0.0.345678',
        publicKey: '302a300506032b6570032100...',
        assetType: 'CARBON_CREDIT',
        assetId: 'carbon_001',
        location: 'Accra, Ghana'
      }
    };

    const selectedCard = cardId || Object.keys(mockCards)[Math.floor(Math.random() * Object.keys(mockCards).length)];
    const cardData = mockCards[selectedCard];

    if (!cardData) {
      throw new Error('NFC card not recognized');
    }

    // Simulate encryption/decryption process
    const encrypted = this.encryptWalletData(cardData);
    const decrypted = this.decryptWalletData(encrypted);

    return {
      success: true,
      cardId: selectedCard,
      walletData: decrypted,
      signalStrength: Math.random() * 100,
      readTime: Math.floor(Math.random() * 500) + 100 // 100-600ms
    };
  }

  /**
   * Validate NFC card authenticity
   */
  validateNFCCard(cardData) {
    try {
      // Check required fields
      const requiredFields = ['accountId', 'publicKey', 'timestamp'];
      for (const field of requiredFields) {
        if (!cardData[field]) {
          return { valid: false, reason: `Missing ${field}` };
        }
      }

      // Validate Hedera account ID format
      if (!/^0\.0\.\d+$/.test(cardData.accountId)) {
        return { valid: false, reason: 'Invalid Hedera account ID format' };
      }

      // Check timestamp freshness
      const age = Date.now() - cardData.timestamp;
      if (age > 30 * 24 * 60 * 60 * 1000) { // 30 days
        return { valid: false, reason: 'Card data too old' };
      }

      return { valid: true, cardData };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Program NFC card with wallet data
   */
  async programNFCCard(walletData, cardOptions = {}) {
    try {
      // Generate NDEF record
      const ndefData = this.generateNDEFRecord(walletData);
      
      // In a real implementation, this would interface with NFC hardware
      // For now, we'll simulate the programming process
      
      const programmingResult = {
        success: true,
        cardId: ndefData.cardId,
        ndefRecord: ndefData.ndef,
        qrBackup: ndefData.qrCode,
        capacity: cardOptions.capacity || 8192, // bytes
        writeTime: Math.floor(Math.random() * 2000) + 500, // 500-2500ms
        verificationPassed: true
      };

      // Store card info (in production, this would go to database)
      this.storeCardInfo(programmingResult);

      return programmingResult;
    } catch (error) {
      throw new Error(`NFC programming failed: ${error.message}`);
    }
  }

  /**
   * Store NFC card information
   */
  storeCardInfo(cardInfo) {
    // In production, store in database
    // For now, just log
    console.log('NFC Card Programmed:', {
      cardId: cardInfo.cardId,
      timestamp: new Date().toISOString(),
      capacity: cardInfo.capacity
    });
  }

  /**
   * Read NFC card (Web NFC API simulation)
   */
  async readNFCCard() {
    return new Promise((resolve, reject) => {
      // Simulate NFC reading delay
      setTimeout(() => {
        try {
          const tapResult = this.simulateNFCTap();
          resolve(tapResult);
        } catch (error) {
          reject(error);
        }
      }, Math.random() * 1000 + 500); // 500-1500ms delay
    });
  }

  /**
   * Check NFC availability (Web NFC API)
   */
  async checkNFCAvailability() {
    // In browser environment, check for Web NFC API
    if (typeof navigator !== 'undefined' && 'nfc' in navigator) {
      try {
        const ndef = new NDEFReader();
        return { available: true, type: 'Web NFC API' };
      } catch (error) {
        return { available: false, reason: error.message };
      }
    }
    
    // For demo purposes, assume NFC is available
    return { available: true, type: 'Simulated NFC' };
  }
}

module.exports = new NFCService();
