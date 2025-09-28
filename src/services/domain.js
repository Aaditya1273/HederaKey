import { AccountId, AccountInfoQuery } from '@hashgraph/sdk';
import logger from '../utils/logger';
import { hederaMirrorNode } from '../config.json';

// Hedera Mirror Node API integration
const queryHederaMirrorNode = async (accountId) => {
  try {
    const response = await fetch(`${hederaMirrorNode}/api/v1/accounts/${accountId}`);
    if (!response.ok) {
      throw new Error(`Mirror Node API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    logger.error('DomainService', 'queryHederaMirrorNode', error.message);
    throw error;
  }
};

// Enhanced domain resolution with Hedera integration
const resolveDomainWithHedera = async (domain) => {
  try {
    logger.info('DomainService', 'resolveDomainWithHedera', `Resolving domain: ${domain}`);
    
    // Step 1: Resolve domain via Unstoppable Domains API
    const udResponse = await fetch(`https://api.unstoppabledomains.com/resolve/domains/${domain}`, {
      headers: {
        'Authorization': 'Bearer <YOUR_TOKEN_HERE>',
        'Content-Type': 'application/json'
      }
    });

    if (!udResponse.ok) {
      throw new Error(`UD API error: ${udResponse.status}`);
    }

    const domainData = await udResponse.json();
    
    // Step 2: Extract blockchain addresses
    const addresses = {
      ethereum: domainData.records?.['crypto.ETH.address'] || null,
      polygon: domainData.records?.['crypto.MATIC.address'] || null,
      bitcoin: domainData.records?.['crypto.BTC.address'] || null,
      hedera: domainData.records?.['crypto.HBAR.address'] || null
    };

    // Step 3: If Hedera address exists, query Mirror Node for additional data
    let hederaData = null;
    if (addresses.hedera) {
      try {
        hederaData = await queryHederaMirrorNode(addresses.hedera);
        
        // Add additional Hedera-specific metadata
        hederaData.enhanced = {
          accountType: hederaData.account ? 'Standard Account' : 'Unknown',
          createdTimestamp: hederaData.created_timestamp,
          isDeleted: hederaData.deleted || false,
          stakingInfo: hederaData.staking_info || null,
          tokenRelationships: hederaData.balance?.tokens?.length || 0
        };
      } catch (error) {
        logger.warn('DomainService', 'resolveDomainWithHedera', `Could not fetch Hedera data: ${error.message}`);
      }
    }

    // Step 4: Compile enhanced response
    const enhancedResult = {
      domain: domain,
      owner: domainData.meta?.owner || null,
      resolver: domainData.meta?.resolver || null,
      addresses: addresses,
      hederaMetadata: hederaData,
      records: domainData.records || {},
      ipfsHash: domainData.records?.['dweb.ipfs.hash'] || null,
      website: domainData.records?.['dns.A'] || null,
      email: domainData.records?.['whois.email.value'] || null,
      social: {
        twitter: domainData.records?.['social.twitter.username'] || null,
        discord: domainData.records?.['social.discord.username'] || null,
        telegram: domainData.records?.['social.telegram.username'] || null
      },
      timestamp: new Date().toISOString()
    };

    logger.info('DomainService', 'resolveDomainWithHedera', `Successfully resolved ${domain}`);
    return enhancedResult;

  } catch (error) {
    logger.error('DomainService', 'resolveDomainWithHedera', error.message);
    throw {
      errorCode: 500,
      error: error.message,
      domain: domain
    };
  }
};

// Reverse lookup with Hedera integration
const reverseResolveWithHedera = async (addresses) => {
  try {
    logger.info('DomainService', 'reverseResolveWithHedera', `Reverse resolving addresses: ${JSON.stringify(addresses)}`);

    // Step 1: Reverse resolve via UD API
    const udResponse = await fetch('https://api.unstoppabledomains.com/resolve/reverse/query', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer <YOUR_TOKEN_HERE>',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        addresses: Array.isArray(addresses) ? addresses : [addresses]
      })
    });

    if (!udResponse.ok) {
      throw new Error(`UD Reverse API error: ${udResponse.status}`);
    }

    const reverseData = await udResponse.json();

    // Step 2: For each found domain, enhance with Hedera data
    const enhancedResults = await Promise.all(
      reverseData.data?.map(async (item) => {
        if (item.domain) {
          try {
            const enhancedDomain = await resolveDomainWithHedera(item.domain);
            return {
              ...item,
              enhanced: enhancedDomain
            };
          } catch (error) {
            return {
              ...item,
              enhanced: null,
              error: error.message
            };
          }
        }
        return item;
      }) || []
    );

    return {
      results: enhancedResults,
      totalFound: enhancedResults.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('DomainService', 'reverseResolveWithHedera', error.message);
    throw {
      errorCode: 500,
      error: error.message,
      addresses: addresses
    };
  }
};

// Get Hedera account info for wallet linking
const getHederaAccountInfo = async (accountId) => {
  try {
    if (!accountId) {
      throw new Error('Account ID is required');
    }

    // Validate account ID format
    let hederaAccountId;
    try {
      hederaAccountId = AccountId.fromString(accountId);
    } catch (error) {
      throw new Error('Invalid Hedera account ID format');
    }

    // Query Mirror Node for comprehensive account data
    const accountData = await queryHederaMirrorNode(accountId);
    
    // Format response for UI
    return {
      accountId: accountId,
      balance: accountData.balance?.balance || '0',
      tokens: accountData.balance?.tokens || [],
      createdTimestamp: accountData.created_timestamp,
      isDeleted: accountData.deleted || false,
      stakingInfo: accountData.staking_info,
      transactions: {
        count: accountData.transactions?.length || 0,
        recent: accountData.transactions?.slice(0, 5) || []
      },
      linkable: true,
      metadata: {
        accountType: 'Hedera Account',
        network: 'testnet',
        lastUpdated: new Date().toISOString()
      }
    };

  } catch (error) {
    logger.error('DomainService', 'getHederaAccountInfo', error.message);
    throw {
      errorCode: 400,
      error: error.message,
      accountId: accountId
    };
  }
};

// Link domain to Hedera wallet
const linkDomainToHederaWallet = async (domain, hederaAccountId, signature) => {
  try {
    logger.info('DomainService', 'linkDomainToHederaWallet', `Linking ${domain} to ${hederaAccountId}`);

    // Validate inputs
    if (!domain || !hederaAccountId) {
      throw new Error('Domain and Hedera account ID are required');
    }

    // Validate Hedera account ID
    try {
      AccountId.fromString(hederaAccountId);
    } catch (error) {
      throw new Error('Invalid Hedera account ID format');
    }

    // Get current domain data
    const domainData = await resolveDomainWithHedera(domain);
    
    // Get Hedera account info
    const hederaInfo = await getHederaAccountInfo(hederaAccountId);

    // Create linking record (in a real implementation, this would update the domain records)
    const linkingRecord = {
      domain: domain,
      hederaAccountId: hederaAccountId,
      linkedTimestamp: new Date().toISOString(),
      signature: signature || null,
      status: 'linked',
      domainOwner: domainData.owner,
      hederaAccountInfo: hederaInfo,
      linkingMethod: 'api'
    };

    logger.info('DomainService', 'linkDomainToHederaWallet', `Successfully linked ${domain} to ${hederaAccountId}`);
    
    return linkingRecord;

  } catch (error) {
    logger.error('DomainService', 'linkDomainToHederaWallet', error.message);
    throw {
      errorCode: 400,
      error: error.message,
      domain: domain,
      hederaAccountId: hederaAccountId
    };
  }
};

export { 
  resolveDomainWithHedera, 
  reverseResolveWithHedera, 
  getHederaAccountInfo, 
  linkDomainToHederaWallet,
  queryHederaMirrorNode 
};
