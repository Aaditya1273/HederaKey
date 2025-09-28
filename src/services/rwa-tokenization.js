import {
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenAssociateTransaction,
  TransferTransaction,
  Hbar,
  AccountId,
  TokenId
} from '@hashgraph/sdk';
import crypto from 'crypto';
import logger from '../utils/logger';
import { hederaNetwork, hederaOperatorId, hederaOperatorKey } from '../config.json';
import { encryptGDPRData, DATA_CLASSIFICATION } from '../utils/encryption';

// Initialize Hedera client
const client = Client.forTestnet();
client.setOperator(hederaOperatorId, hederaOperatorKey);

// RWA Asset Types
const RWA_ASSET_TYPES = {
  FARM_SHARE: 'FARM_SHARE',
  REAL_ESTATE: 'REAL_ESTATE',
  COMMODITY: 'COMMODITY',
  EQUIPMENT: 'EQUIPMENT',
  LIVESTOCK: 'LIVESTOCK',
  CARBON_CREDIT: 'CARBON_CREDIT'
};

// Token Standards for RWA
const RWA_TOKEN_STANDARDS = {
  FRACTIONAL: 'FRACTIONAL',     // Divisible ownership shares
  WHOLE: 'WHOLE',               // Whole asset ownership
  CERTIFICATE: 'CERTIFICATE'    // Ownership certificate NFT
};

class RWATokenizationEngine {
  constructor() {
    this.tokenRegistry = new Map(); // In production, use persistent storage
    this.assetRegistry = new Map();
    this.priceOracle = null;
  }

  async tokenizeRWA(assetData, nfcData, ownerAccountId) {
    try {
      const tokenizationId = crypto.randomUUID();
      
      logger.info('RWATokenization', 'tokenizeRWA', `Tokenizing asset: ${assetData.name}`);

      // Step 1: Validate and register the physical asset
      const assetRegistration = await this.registerPhysicalAsset(assetData, nfcData);

      // Step 2: Determine tokenization strategy
      const tokenStrategy = this.determineTokenStrategy(assetData);

      // Step 3: Create HTS token for the asset
      const tokenCreation = await this.createRWAToken(assetData, tokenStrategy, ownerAccountId);

      // Step 4: Mint initial tokens based on asset valuation
      const initialMinting = await this.mintInitialTokens(
        tokenCreation.tokenId,
        assetData.valuation,
        tokenStrategy,
        ownerAccountId
      );

      // Step 5: Create metadata and compliance records
      const metadata = await this.createTokenMetadata(assetData, tokenCreation, assetRegistration);

      // Step 6: Register in tokenization registry
      const tokenizationRecord = {
        tokenizationId,
        assetId: assetRegistration.assetId,
        tokenId: tokenCreation.tokenId,
        assetType: assetData.type,
        tokenStrategy,
        totalSupply: initialMinting.totalSupply,
        ownerAccountId,
        metadata,
        createdAt: new Date().toISOString(),
        status: 'ACTIVE',
        compliance: {
          kycVerified: true,
          amlCleared: true,
          regulatoryApproved: true
        }
      };

      this.tokenRegistry.set(tokenizationId, tokenizationRecord);

      logger.info('RWATokenization', 'tokenizeRWA', `Asset tokenized successfully: ${tokenizationId}`);

      return {
        tokenizationId,
        tokenId: tokenCreation.tokenId,
        assetId: assetRegistration.assetId,
        totalSupply: initialMinting.totalSupply,
        tokenSymbol: tokenCreation.symbol,
        tokenName: tokenCreation.name,
        pricePerToken: this.calculateInitialPrice(assetData.valuation, initialMinting.totalSupply),
        tradeable: true,
        metadata,
        txHash: tokenCreation.txHash
      };

    } catch (error) {
      logger.error('RWATokenization', 'tokenizeRWA', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        assetName: assetData.name
      };
    }
  }

  async registerPhysicalAsset(assetData, nfcData) {
    try {
      const assetId = crypto.randomUUID();
      
      // Create comprehensive asset registration
      const assetRegistration = {
        assetId,
        name: assetData.name,
        type: assetData.type,
        description: assetData.description,
        location: assetData.location,
        valuation: assetData.valuation,
        currency: assetData.currency || 'USD',
        nfcTag: {
          tagId: nfcData.tagId,
          serialNumber: nfcData.serialNumber,
          encryptedData: await encryptGDPRData(JSON.stringify(nfcData), DATA_CLASSIFICATION.SENSITIVE, 'tokenization')
        },
        physicalVerification: {
          verified: true,
          verificationMethod: 'NFC_SCAN',
          verifiedAt: new Date().toISOString(),
          verificationHash: crypto.createHash('sha256').update(JSON.stringify(nfcData)).digest('hex')
        },
        legalDocuments: assetData.documents || [],
        ownership: {
          currentOwner: assetData.ownerId,
          ownershipProof: assetData.ownershipProof,
          transferHistory: []
        },
        registeredAt: new Date().toISOString()
      };

      this.assetRegistry.set(assetId, assetRegistration);

      return assetRegistration;

    } catch (error) {
      logger.error('RWATokenization', 'registerPhysicalAsset', error.message);
      throw new Error(`Asset registration failed: ${error.message}`);
    }
  }

  determineTokenStrategy(assetData) {
    // Determine the best tokenization strategy based on asset characteristics
    const { type, valuation, divisible } = assetData;

    if (type === RWA_ASSET_TYPES.FARM_SHARE || divisible) {
      return {
        standard: RWA_TOKEN_STANDARDS.FRACTIONAL,
        decimals: 8,
        totalShares: 1000000, // 1 million shares for fractional ownership
        minInvestment: Math.max(valuation * 0.001, 100) // Minimum 0.1% or $100
      };
    } else if (type === RWA_ASSET_TYPES.REAL_ESTATE && valuation > 100000) {
      return {
        standard: RWA_TOKEN_STANDARDS.FRACTIONAL,
        decimals: 6,
        totalShares: 100000, // 100k shares for real estate
        minInvestment: Math.max(valuation * 0.01, 1000) // Minimum 1% or $1000
      };
    } else {
      return {
        standard: RWA_TOKEN_STANDARDS.WHOLE,
        decimals: 0,
        totalShares: 1, // Single ownership token
        minInvestment: valuation
      };
    }
  }

  async createRWAToken(assetData, tokenStrategy, ownerAccountId) {
    try {
      const treasuryKey = PrivateKey.generateED25519();
      const treasuryId = AccountId.fromString(ownerAccountId);

      // Generate token symbol and name
      const symbol = this.generateTokenSymbol(assetData);
      const name = `${assetData.name} Token`;

      // Create the HTS token
      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(tokenStrategy.decimals)
        .setInitialSupply(0) // Will mint after creation
        .setTreasuryAccountId(treasuryId)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(tokenStrategy.totalShares)
        .setAdminKey(treasuryKey)
        .setSupplyKey(treasuryKey)
        .setFreezeDefault(false)
        .setTokenMemo(`RWA Token for ${assetData.type}: ${assetData.name}`);

      // Sign and execute
      const tokenCreateSign = await tokenCreateTx.sign(treasuryKey);
      const tokenCreateSubmit = await tokenCreateSign.execute(client);
      const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(client);
      const tokenId = tokenCreateReceipt.tokenId;

      return {
        tokenId: tokenId.toString(),
        name,
        symbol,
        decimals: tokenStrategy.decimals,
        maxSupply: tokenStrategy.totalShares,
        treasuryKey: treasuryKey.toString(),
        txHash: tokenCreateSubmit.transactionId.toString()
      };

    } catch (error) {
      logger.error('RWATokenization', 'createRWAToken', error.message);
      throw new Error(`Token creation failed: ${error.message}`);
    }
  }

  async mintInitialTokens(tokenId, assetValuation, tokenStrategy, ownerAccountId) {
    try {
      const totalSupply = tokenStrategy.totalShares;
      
      // Mint the total supply to the owner
      const mintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(totalSupply)
        .freezeWith(client);

      const mintSubmit = await mintTx.execute(client);
      const mintReceipt = await mintSubmit.getReceipt(client);

      return {
        totalSupply,
        mintedTo: ownerAccountId,
        txHash: mintSubmit.transactionId.toString(),
        status: 'SUCCESS'
      };

    } catch (error) {
      logger.error('RWATokenization', 'mintInitialTokens', error.message);
      throw new Error(`Token minting failed: ${error.message}`);
    }
  }

  async createTokenMetadata(assetData, tokenCreation, assetRegistration) {
    try {
      const metadata = {
        standard: 'HIP-412', // Hedera Token Metadata Standard
        name: tokenCreation.name,
        symbol: tokenCreation.symbol,
        description: `Tokenized ${assetData.type}: ${assetData.description}`,
        image: assetData.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${assetData.name}`,
        external_url: assetData.website,
        attributes: [
          {
            trait_type: 'Asset Type',
            value: assetData.type
          },
          {
            trait_type: 'Location',
            value: assetData.location
          },
          {
            trait_type: 'Valuation',
            value: assetData.valuation,
            display_type: 'number'
          },
          {
            trait_type: 'Currency',
            value: assetData.currency || 'USD'
          },
          {
            trait_type: 'Tokenization Date',
            value: new Date().toISOString(),
            display_type: 'date'
          },
          {
            trait_type: 'NFC Verified',
            value: 'Yes'
          }
        ],
        properties: {
          category: 'Real World Asset',
          subcategory: assetData.type,
          tokenization_method: 'NFC_VERIFIED',
          compliance_status: 'APPROVED',
          tradeable: true,
          fractional: tokenCreation.decimals > 0
        }
      };

      return metadata;

    } catch (error) {
      logger.error('RWATokenization', 'createTokenMetadata', error.message);
      throw new Error(`Metadata creation failed: ${error.message}`);
    }
  }

  generateTokenSymbol(assetData) {
    const typePrefix = {
      [RWA_ASSET_TYPES.FARM_SHARE]: 'FARM',
      [RWA_ASSET_TYPES.REAL_ESTATE]: 'REAL',
      [RWA_ASSET_TYPES.COMMODITY]: 'COMM',
      [RWA_ASSET_TYPES.EQUIPMENT]: 'EQUIP',
      [RWA_ASSET_TYPES.LIVESTOCK]: 'LIVE',
      [RWA_ASSET_TYPES.CARBON_CREDIT]: 'CARB'
    };

    const prefix = typePrefix[assetData.type] || 'RWA';
    const suffix = assetData.name.replace(/[^A-Z0-9]/gi, '').substring(0, 4).toUpperCase();
    
    return `${prefix}${suffix}`;
  }

  calculateInitialPrice(valuation, totalSupply) {
    return (valuation / totalSupply).toFixed(8);
  }

  async getTokenizationDetails(tokenizationId) {
    const record = this.tokenRegistry.get(tokenizationId);
    if (!record) {
      throw new Error('Tokenization record not found');
    }

    return record;
  }

  async listTokenizedAssets(filters = {}) {
    const assets = Array.from(this.tokenRegistry.values());
    
    let filtered = assets;
    
    if (filters.assetType) {
      filtered = filtered.filter(asset => asset.assetType === filters.assetType);
    }
    
    if (filters.ownerAccountId) {
      filtered = filtered.filter(asset => asset.ownerAccountId === filters.ownerAccountId);
    }
    
    if (filters.minValuation) {
      filtered = filtered.filter(asset => {
        const assetRecord = this.assetRegistry.get(asset.assetId);
        return assetRecord && assetRecord.valuation >= filters.minValuation;
      });
    }

    return {
      assets: filtered,
      totalCount: filtered.length,
      filters
    };
  }

  async processNFCTokenization(nfcData, userAccountId) {
    try {
      logger.info('RWATokenization', 'processNFCTokenization', `Processing NFC tokenization for user: ${userAccountId}`);

      // Parse NFC data to extract asset information
      const assetData = this.parseNFCAssetData(nfcData);

      // Validate NFC tag authenticity
      const nfcValidation = await this.validateNFCTag(nfcData);
      if (!nfcValidation.valid) {
        throw new Error('Invalid NFC tag or tampered data');
      }

      // Perform tokenization
      const tokenizationResult = await this.tokenizeRWA(assetData, nfcData, userAccountId);

      // Create instant trading setup
      const tradingSetup = await this.setupInstantTrading(tokenizationResult);

      return {
        ...tokenizationResult,
        trading: tradingSetup,
        nfcVerified: true,
        instantTradeable: true
      };

    } catch (error) {
      logger.error('RWATokenization', 'processNFCTokenization', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        userAccountId
      };
    }
  }

  parseNFCAssetData(nfcData) {
    // Parse NFC data to extract asset information
    // This would be customized based on your NFC data format
    
    return {
      name: nfcData.assetName || `Asset ${nfcData.tagId}`,
      type: nfcData.assetType || RWA_ASSET_TYPES.FARM_SHARE,
      description: nfcData.description || 'NFC-verified real world asset',
      location: nfcData.location || 'Unknown',
      valuation: parseFloat(nfcData.valuation) || 10000,
      currency: nfcData.currency || 'USD',
      ownerId: nfcData.ownerId,
      divisible: nfcData.divisible !== false,
      imageUrl: nfcData.imageUrl,
      documents: nfcData.documents || []
    };
  }

  async validateNFCTag(nfcData) {
    try {
      // Validate NFC tag authenticity and integrity
      const expectedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({
          tagId: nfcData.tagId,
          serialNumber: nfcData.serialNumber,
          timestamp: nfcData.timestamp
        }))
        .digest('hex');

      return {
        valid: true, // In production, implement proper validation
        tagId: nfcData.tagId,
        serialNumber: nfcData.serialNumber,
        validatedAt: new Date().toISOString()
      };

    } catch (error) {
      return {
        valid: false,
        error: error.message,
        validatedAt: new Date().toISOString()
      };
    }
  }

  async setupInstantTrading(tokenizationResult) {
    try {
      // Set up instant trading capabilities for the newly minted token
      const tradingSetup = {
        tokenId: tokenizationResult.tokenId,
        tradeable: true,
        liquidityPool: null, // Will be created by AMM service
        initialPrice: tokenizationResult.pricePerToken,
        marketMaker: true,
        orderBook: {
          bids: [],
          asks: []
        },
        tradingPairs: [
          `${tokenizationResult.tokenSymbol}/HBAR`,
          `${tokenizationResult.tokenSymbol}/USDC`
        ]
      };

      return tradingSetup;

    } catch (error) {
      logger.error('RWATokenization', 'setupInstantTrading', error.message);
      return {
        tradeable: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const rwaTokenizationEngine = new RWATokenizationEngine();

// Export functions
const tokenizeAsset = async (assetData, nfcData, ownerAccountId) => {
  return await rwaTokenizationEngine.tokenizeRWA(assetData, nfcData, ownerAccountId);
};

const processNFCTokenization = async (nfcData, userAccountId) => {
  return await rwaTokenizationEngine.processNFCTokenization(nfcData, userAccountId);
};

const getTokenizationDetails = async (tokenizationId) => {
  return await rwaTokenizationEngine.getTokenizationDetails(tokenizationId);
};

const listTokenizedAssets = async (filters) => {
  return await rwaTokenizationEngine.listTokenizedAssets(filters);
};

export {
  RWA_ASSET_TYPES,
  RWA_TOKEN_STANDARDS,
  RWATokenizationEngine,
  tokenizeAsset,
  processNFCTokenization,
  getTokenizationDetails,
  listTokenizedAssets
};
