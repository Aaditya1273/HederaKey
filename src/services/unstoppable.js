const axios = require('axios');
const crypto = require('crypto');

class UnstoppableDomainsService {
  constructor() {
    this.apiKey = process.env.UNSTOPPABLE_DOMAINS_API_KEY;
    this.baseURL = 'https://api.unstoppabledomains.com';
    this.supportedTLDs = ['.crypto', '.nft', '.blockchain', '.bitcoin', '.coin', '.wallet', '.888', '.dao', '.x'];
  }

  /**
   * Resolve domain to get all records
   */
  async resolveDomain(domain) {
    try {
      if (!this.isValidDomain(domain)) {
        throw new Error('Invalid domain format');
      }

      const response = await axios.get(`${this.baseURL}/resolve/domains/${domain}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const records = response.data.records || {};
      
      return {
        domain,
        owner: response.data.meta?.owner,
        addresses: {
          ethereum: records['crypto.ETH.address'],
          bitcoin: records['crypto.BTC.address'],
          hedera: records['crypto.HBAR.address'],
          polygon: records['crypto.MATIC.address']
        },
        hederaMetadata: await this.getHederaMetadata(records['crypto.HBAR.address']),
        profile: {
          email: records['whois.email.value'],
          displayName: records['social.twitter.username'] || records['whois.for_sale.value'],
          avatar: records['social.picture.value'],
          description: records['whois.description.value']
        },
        social: {
          twitter: records['social.twitter.username'],
          discord: records['social.discord.username'],
          telegram: records['social.telegram.username'],
          github: records['social.github.username']
        },
        ipfs: {
          website: records['dweb.ipfs.hash'],
          redirect: records['browser.redirect_url']
        },
        verified: this.verifyDomainOwnership(response.data),
        lastUpdated: response.data.meta?.blockchain_provenance?.updated_at
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Domain not found');
      }
      throw new Error(`Domain resolution failed: ${error.message}`);
    }
  }

  /**
   * Reverse lookup - find domains by address
   */
  async reverseLookup(addresses) {
    try {
      const response = await axios.post(`${this.baseURL}/resolve/reverse`, {
        addresses: Array.isArray(addresses) ? addresses : [addresses]
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const results = response.data.data || [];
      
      return {
        results: results.map(result => ({
          domain: result.domain,
          address: result.address,
          hasHedera: !!result.records?.['crypto.HBAR.address'],
          hederaAccount: result.records?.['crypto.HBAR.address'],
          enhanced: result.records ? this.enhanceRecords(result.records) : null
        })),
        totalFound: results.length,
        hederaEnabledDomains: results.filter(r => r.records?.['crypto.HBAR.address']).length
      };
    } catch (error) {
      throw new Error(`Reverse lookup failed: ${error.message}`);
    }
  }

  /**
   * Link Hedera account to domain
   */
  async linkHederaAccount(domain, hederaAccountId, signature = null) {
    try {
      // In a real implementation, this would update domain records
      // For demo purposes, we'll simulate the linking process
      
      const linkData = {
        domain,
        hederaAccountId,
        signature,
        timestamp: new Date().toISOString(),
        linkId: crypto.randomUUID()
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify Hedera account exists
      const hederaMetadata = await this.getHederaMetadata(hederaAccountId);
      
      if (!hederaMetadata.exists) {
        throw new Error('Hedera account not found');
      }

      return {
        domain,
        hederaAccountId,
        status: 'linked',
        linkedTimestamp: linkData.timestamp,
        linkId: linkData.linkId,
        hederaMetadata
      };
    } catch (error) {
      throw new Error(`Hedera linking failed: ${error.message}`);
    }
  }

  /**
   * Get Hedera account metadata
   */
  async getHederaMetadata(accountId) {
    if (!accountId) {
      return { exists: false };
    }

    try {
      // Query Hedera Mirror Node
      const response = await axios.get(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`);
      
      const accountData = response.data;
      
      return {
        exists: true,
        accountId: accountData.account,
        balance: accountData.balance?.balance || '0',
        tokens: accountData.balance?.tokens || [],
        createdTimestamp: accountData.created_timestamp,
        stakingInfo: accountData.staked_account_id ? {
          stakedAccountId: accountData.staked_account_id,
          stakedNodeId: accountData.staked_node_id
        } : null,
        linkable: true
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return { exists: false, error: 'Account not found' };
      }
      return { exists: false, error: error.message };
    }
  }

  /**
   * Authenticate user with Unstoppable Domain
   */
  async authenticateUser(domain, signature, message) {
    try {
      // Verify signature matches domain owner
      const domainData = await this.resolveDomain(domain);
      
      if (!domainData.owner) {
        throw new Error('Domain owner not found');
      }

      // In a real implementation, verify cryptographic signature
      // For demo, we'll simulate authentication
      const authResult = {
        authenticated: true,
        domain,
        owner: domainData.owner,
        hederaAccount: domainData.addresses.hedera,
        profile: domainData.profile,
        sessionToken: this.generateSessionToken(domain),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      return authResult;
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Generate session token for authenticated user
   */
  generateSessionToken(domain) {
    const payload = {
      domain,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex')
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Validate domain format
   */
  isValidDomain(domain) {
    if (!domain || typeof domain !== 'string') {
      return false;
    }

    // Check if domain ends with supported TLD
    const hasSupportedTLD = this.supportedTLDs.some(tld => domain.toLowerCase().endsWith(tld));
    
    // Basic domain format validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.(crypto|nft|blockchain|bitcoin|coin|wallet|888|dao|x)$/i;
    
    return hasSupportedTLD && domainRegex.test(domain);
  }

  /**
   * Verify domain ownership
   */
  verifyDomainOwnership(domainData) {
    // Basic verification checks
    const hasOwner = !!domainData.meta?.owner;
    const hasRecords = Object.keys(domainData.records || {}).length > 0;
    const isNotExpired = true; // Unstoppable domains don't expire
    
    return {
      verified: hasOwner && hasRecords && isNotExpired,
      checks: {
        hasOwner,
        hasRecords,
        isNotExpired
      }
    };
  }

  /**
   * Enhance domain records with additional metadata
   */
  enhanceRecords(records) {
    return {
      wallets: {
        ethereum: records['crypto.ETH.address'],
        bitcoin: records['crypto.BTC.address'],
        hedera: records['crypto.HBAR.address'],
        polygon: records['crypto.MATIC.address'],
        solana: records['crypto.SOL.address']
      },
      social: {
        twitter: records['social.twitter.username'],
        discord: records['social.discord.username'],
        telegram: records['social.telegram.username'],
        github: records['social.github.username'],
        reddit: records['social.reddit.username']
      },
      profile: {
        email: records['whois.email.value'],
        displayName: records['whois.for_sale.value'],
        avatar: records['social.picture.value'],
        description: records['whois.description.value'],
        location: records['whois.location.value']
      },
      web: {
        ipfsHash: records['dweb.ipfs.hash'],
        redirectUrl: records['browser.redirect_url'],
        website: records['whois.website.value']
      }
    };
  }

  /**
   * Search domains by keyword
   */
  async searchDomains(keyword, tld = null) {
    try {
      // Mock search functionality (UD API doesn't have public search)
      const mockResults = [
        `${keyword}.crypto`,
        `${keyword}.nft`,
        `${keyword}dao.dao`,
        `${keyword}wallet.wallet`
      ].filter(domain => !tld || domain.endsWith(tld));

      return {
        keyword,
        suggestions: mockResults,
        available: mockResults.map(domain => ({
          domain,
          available: Math.random() > 0.3, // 70% chance available
          price: Math.floor(Math.random() * 1000) + 50 // $50-$1050
        }))
      };
    } catch (error) {
      throw new Error(`Domain search failed: ${error.message}`);
    }
  }
}

module.exports = new UnstoppableDomainsService();
