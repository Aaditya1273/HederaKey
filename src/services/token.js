import {
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenAssociateTransaction,
  Hbar,
  AccountId
} from '@hashgraph/sdk';
import logger from '../utils/logger';
import { hederaNetwork, hederaOperatorId, hederaOperatorKey } from '../config.json';

// Initialize Hedera client
const client = Client.forTestnet();
client.setOperator(hederaOperatorId, hederaOperatorKey);

const createFungibleToken = async ({
  tokenName,
  symbol,
  decimals = 8,
  initialSupply = '1000000',
  maxSupply = null,
  adminKey = true,
  supplyKey = true,
  pauseKey = false,
  freezeKey = false,
  wipeKey = false,
  kycKey = false,
  feeScheduleKey = false,
  metadata = null
}) => {
  try {
    logger.info('TokenService', 'createFungibleToken', `Creating fungible token: ${tokenName} (${symbol})`);

    // Generate keys
    const treasuryKey = PrivateKey.generateED25519();
    const treasuryId = AccountId.fromString(hederaOperatorId);
    
    let adminKeyObj = adminKey ? treasuryKey : null;
    let supplyKeyObj = supplyKey ? treasuryKey : null;
    let pauseKeyObj = pauseKey ? treasuryKey : null;
    let freezeKeyObj = freezeKey ? treasuryKey : null;
    let wipeKeyObj = wipeKey ? treasuryKey : null;
    let kycKeyObj = kycKey ? treasuryKey : null;
    let feeScheduleKeyObj = feeScheduleKey ? treasuryKey : null;

    // Create token
    const tokenCreateTx = new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol(symbol)
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(decimals)
      .setInitialSupply(initialSupply)
      .setTreasuryAccountId(treasuryId)
      .setSupplyType(maxSupply ? TokenSupplyType.Finite : TokenSupplyType.Infinite)
      .setMaxSupply(maxSupply || 0)
      .setAdminKey(adminKeyObj)
      .setSupplyKey(supplyKeyObj)
      .setPauseKey(pauseKeyObj)
      .setFreezeKey(freezeKeyObj)
      .setWipeKey(wipeKeyObj)
      .setKycKey(kycKeyObj)
      .setFeeScheduleKey(feeScheduleKeyObj)
      .setFreezeDefault(false);

    if (metadata) {
      tokenCreateTx.setTokenMemo(metadata);
    }

    // Sign and execute
    const tokenCreateSign = await tokenCreateTx.sign(treasuryKey);
    const tokenCreateSubmit = await tokenCreateSign.execute(client);
    const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(client);
    const tokenId = tokenCreateReceipt.tokenId;

    logger.info('TokenService', 'createFungibleToken', `Token created successfully: ${tokenId}`);

    return {
      tokenId: tokenId.toString(),
      tokenName,
      symbol,
      decimals,
      initialSupply,
      maxSupply,
      type: 'fungible',
      txHash: tokenCreateSubmit.transactionId.toString(),
      treasuryKey: treasuryKey.toString(),
      status: 'SUCCESS'
    };

  } catch (error) {
    logger.error('TokenService', 'createFungibleToken', error.message);
    throw {
      errorCode: 500,
      error: error.message,
      tokenName,
      symbol
    };
  }
};

const createNFTCollection = async ({
  tokenName,
  symbol,
  adminKey = true,
  supplyKey = true,
  pauseKey = false,
  freezeKey = false,
  wipeKey = false,
  kycKey = false,
  feeScheduleKey = false,
  metadata = null
}) => {
  try {
    logger.info('TokenService', 'createNFTCollection', `Creating NFT collection: ${tokenName} (${symbol})`);

    // Generate keys
    const treasuryKey = PrivateKey.generateED25519();
    const treasuryId = AccountId.fromString(hederaOperatorId);
    
    let adminKeyObj = adminKey ? treasuryKey : null;
    let supplyKeyObj = supplyKey ? treasuryKey : null;
    let pauseKeyObj = pauseKey ? treasuryKey : null;
    let freezeKeyObj = freezeKey ? treasuryKey : null;
    let wipeKeyObj = wipeKey ? treasuryKey : null;
    let kycKeyObj = kycKey ? treasuryKey : null;
    let feeScheduleKeyObj = feeScheduleKey ? treasuryKey : null;

    // Create NFT collection
    const nftCreateTx = new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol(symbol)
      .setTokenType(TokenType.NonFungibleUnique)
      .setDecimals(0)
      .setInitialSupply(0)
      .setTreasuryAccountId(treasuryId)
      .setSupplyType(TokenSupplyType.Infinite)
      .setAdminKey(adminKeyObj)
      .setSupplyKey(supplyKeyObj)
      .setPauseKey(pauseKeyObj)
      .setFreezeKey(freezeKeyObj)
      .setWipeKey(wipeKeyObj)
      .setKycKey(kycKeyObj)
      .setFeeScheduleKey(feeScheduleKeyObj)
      .setFreezeDefault(false);

    if (metadata) {
      nftCreateTx.setTokenMemo(metadata);
    }

    // Sign and execute
    const nftCreateSign = await nftCreateTx.sign(treasuryKey);
    const nftCreateSubmit = await nftCreateSign.execute(client);
    const nftCreateReceipt = await nftCreateSubmit.getReceipt(client);
    const tokenId = nftCreateReceipt.tokenId;

    logger.info('TokenService', 'createNFTCollection', `NFT collection created successfully: ${tokenId}`);

    return {
      tokenId: tokenId.toString(),
      tokenName,
      symbol,
      type: 'nft',
      txHash: nftCreateSubmit.transactionId.toString(),
      treasuryKey: treasuryKey.toString(),
      status: 'SUCCESS'
    };

  } catch (error) {
    logger.error('TokenService', 'createNFTCollection', error.message);
    throw {
      errorCode: 500,
      error: error.message,
      tokenName,
      symbol
    };
  }
};

const mintNFT = async ({ tokenId, metadata = [] }) => {
  try {
    logger.info('TokenService', 'mintNFT', `Minting NFT for token: ${tokenId}`);

    // Convert metadata to bytes
    const metadataBytes = metadata.map(meta => 
      Buffer.from(JSON.stringify(meta), 'utf8')
    );

    // Create mint transaction
    const mintTx = new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata(metadataBytes)
      .freezeWith(client);

    // Sign and execute (would need the supply key in real implementation)
    const mintSubmit = await mintTx.execute(client);
    const mintReceipt = await mintSubmit.getReceipt(client);
    const serialNumbers = mintReceipt.serials;

    logger.info('TokenService', 'mintNFT', `NFT minted successfully. Serial numbers: ${serialNumbers}`);

    return {
      tokenId,
      serialNumbers: serialNumbers.map(sn => sn.toString()),
      txHash: mintSubmit.transactionId.toString(),
      status: 'SUCCESS'
    };

  } catch (error) {
    logger.error('TokenService', 'mintNFT', error.message);
    throw {
      errorCode: 500,
      error: error.message,
      tokenId
    };
  }
};

const associateToken = async ({ accountId, tokenId, privateKey }) => {
  try {
    logger.info('TokenService', 'associateToken', `Associating token ${tokenId} with account ${accountId}`);

    const accountKey = PrivateKey.fromString(privateKey);
    const account = AccountId.fromString(accountId);
    const token = tokenId;

    // Create association transaction
    const associateTx = new TokenAssociateTransaction()
      .setAccountId(account)
      .setTokenIds([token])
      .freezeWith(client);

    // Sign and execute
    const associateSign = await associateTx.sign(accountKey);
    const associateSubmit = await associateSign.execute(client);
    const associateReceipt = await associateSubmit.getReceipt(client);

    logger.info('TokenService', 'associateToken', `Token association successful`);

    return {
      accountId,
      tokenId,
      txHash: associateSubmit.transactionId.toString(),
      status: 'SUCCESS'
    };

  } catch (error) {
    logger.error('TokenService', 'associateToken', error.message);
    throw {
      errorCode: 500,
      error: error.message,
      accountId,
      tokenId
    };
  }
};

const getTokenInfo = async (tokenId) => {
  try {
    logger.info('TokenService', 'getTokenInfo', `Getting token info for: ${tokenId}`);

    // Query token info via Mirror Node
    const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/tokens/${tokenId}`);
    
    if (!response.ok) {
      throw new Error(`Token not found: ${tokenId}`);
    }

    const tokenData = await response.json();

    return {
      tokenId: tokenData.token_id,
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      totalSupply: tokenData.total_supply,
      maxSupply: tokenData.max_supply,
      type: tokenData.type,
      treasuryAccountId: tokenData.treasury_account_id,
      createdTimestamp: tokenData.created_timestamp,
      metadata: tokenData.memo
    };

  } catch (error) {
    logger.error('TokenService', 'getTokenInfo', error.message);
    throw {
      errorCode: 404,
      error: error.message,
      tokenId
    };
  }
};

const processNFCTokenMint = async (nfcData) => {
  try {
    logger.info('TokenService', 'processNFCTokenMint', 'Processing NFC token mint request');

    const {
      tokenType = 'nft',
      tokenName = 'NFC Token',
      symbol = 'NFT',
      decimals = 0,
      initialSupply = '1',
      metadata = null
    } = nfcData;

    let result;

    if (tokenType === 'fungible') {
      result = await createFungibleToken({
        tokenName,
        symbol,
        decimals: parseInt(decimals),
        initialSupply,
        metadata
      });
    } else {
      // Create NFT collection and mint first NFT
      const collection = await createNFTCollection({
        tokenName,
        symbol,
        metadata
      });

      // Mint the first NFT
      const nftMetadata = metadata ? [{ name: tokenName, description: metadata }] : [{ name: tokenName }];
      const mintResult = await mintNFT({
        tokenId: collection.tokenId,
        metadata: nftMetadata
      });

      result = {
        ...collection,
        mintedNFTs: mintResult.serialNumbers,
        mintTxHash: mintResult.txHash
      };
    }

    logger.info('TokenService', 'processNFCTokenMint', `NFC token mint completed: ${result.tokenId}`);

    return result;

  } catch (error) {
    logger.error('TokenService', 'processNFCTokenMint', error.message);
    throw {
      errorCode: 500,
      error: error.message
    };
  }
};

export { 
  createFungibleToken, 
  createNFTCollection, 
  mintNFT, 
  associateToken, 
  getTokenInfo,
  processNFCTokenMint 
};
