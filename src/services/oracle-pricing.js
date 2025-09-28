import crypto from 'crypto';
import logger from '../utils/logger';

// Oracle data sources
const ORACLE_SOURCES = {
  CHAINLINK: 'CHAINLINK',
  HEDERA_CONSENSUS: 'HEDERA_CONSENSUS',
  EXTERNAL_API: 'EXTERNAL_API',
  INTERNAL: 'INTERNAL'
};

// Price feed types
const PRICE_FEED_TYPES = {
  CRYPTO: 'CRYPTO',
  COMMODITY: 'COMMODITY',
  REAL_ESTATE: 'REAL_ESTATE',
  FARM_PRODUCE: 'FARM_PRODUCE',
  CARBON_CREDIT: 'CARBON_CREDIT',
  FOREX: 'FOREX'
};

class OraclePricingEngine {
  constructor() {
    this.priceFeeds = new Map();
    this.priceHistory = new Map();
    this.subscribers = new Map();
    this.updateInterval = 30000; // 30 seconds
    this.volatilityThreshold = 0.05; // 5% price change threshold
    
    // Initialize mock price feeds
    this.initializeMockFeeds();
    
    // Start price update loop
    this.startPriceUpdates();
  }

  initializeMockFeeds() {
    // Initialize with realistic mock data
    const initialFeeds = [
      {
        symbol: 'HBAR/USD',
        type: PRICE_FEED_TYPES.CRYPTO,
        price: 0.0523,
        source: ORACLE_SOURCES.CHAINLINK,
        confidence: 0.99,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'BTC/USD',
        type: PRICE_FEED_TYPES.CRYPTO,
        price: 43250.00,
        source: ORACLE_SOURCES.CHAINLINK,
        confidence: 0.99,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'ETH/USD',
        type: PRICE_FEED_TYPES.CRYPTO,
        price: 2650.00,
        source: ORACLE_SOURCES.CHAINLINK,
        confidence: 0.99,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'USDC/USD',
        type: PRICE_FEED_TYPES.CRYPTO,
        price: 1.00,
        source: ORACLE_SOURCES.CHAINLINK,
        confidence: 0.999,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'CORN/USD',
        type: PRICE_FEED_TYPES.COMMODITY,
        price: 4.85,
        source: ORACLE_SOURCES.EXTERNAL_API,
        confidence: 0.95,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'WHEAT/USD',
        type: PRICE_FEED_TYPES.COMMODITY,
        price: 6.20,
        source: ORACLE_SOURCES.EXTERNAL_API,
        confidence: 0.95,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'CARBON/USD',
        type: PRICE_FEED_TYPES.CARBON_CREDIT,
        price: 85.50,
        source: ORACLE_SOURCES.EXTERNAL_API,
        confidence: 0.90,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'REALESTATE_INDEX/USD',
        type: PRICE_FEED_TYPES.REAL_ESTATE,
        price: 285.75,
        source: ORACLE_SOURCES.INTERNAL,
        confidence: 0.85,
        lastUpdated: new Date().toISOString()
      }
    ];

    initialFeeds.forEach(feed => {
      this.priceFeeds.set(feed.symbol, feed);
      this.priceHistory.set(feed.symbol, []);
    });
  }

  startPriceUpdates() {
    setInterval(() => {
      this.updateAllPrices();
    }, this.updateInterval);
  }

  async updateAllPrices() {
    try {
      for (const [symbol, feed] of this.priceFeeds.entries()) {
        const newPrice = await this.generateRealisticPrice(feed);
        await this.updatePrice(symbol, newPrice, feed.source);
      }
    } catch (error) {
      logger.error('OraclePricingEngine', 'updateAllPrices', error.message);
    }
  }

  async generateRealisticPrice(currentFeed) {
    // Generate realistic price movements based on asset type
    const { price, type } = currentFeed;
    let volatility;

    switch (type) {
      case PRICE_FEED_TYPES.CRYPTO:
        volatility = 0.02; // 2% volatility for crypto
        break;
      case PRICE_FEED_TYPES.COMMODITY:
        volatility = 0.01; // 1% volatility for commodities
        break;
      case PRICE_FEED_TYPES.REAL_ESTATE:
        volatility = 0.005; // 0.5% volatility for real estate
        break;
      case PRICE_FEED_TYPES.CARBON_CREDIT:
        volatility = 0.015; // 1.5% volatility for carbon credits
        break;
      default:
        volatility = 0.01;
    }

    // Generate random walk with mean reversion
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const meanReversion = -0.1 * randomChange; // Slight mean reversion
    const totalChange = randomChange + meanReversion;

    return price * (1 + totalChange);
  }

  async updatePrice(symbol, newPrice, source = ORACLE_SOURCES.INTERNAL) {
    try {
      const currentFeed = this.priceFeeds.get(symbol);
      if (!currentFeed) {
        throw new Error(`Price feed not found: ${symbol}`);
      }

      const oldPrice = currentFeed.price;
      const priceChange = (newPrice - oldPrice) / oldPrice;
      const timestamp = new Date().toISOString();

      // Update price feed
      const updatedFeed = {
        ...currentFeed,
        price: newPrice,
        previousPrice: oldPrice,
        priceChange,
        priceChangePercent: priceChange * 100,
        source,
        lastUpdated: timestamp,
        confidence: this.calculateConfidence(symbol, newPrice, oldPrice)
      };

      this.priceFeeds.set(symbol, updatedFeed);

      // Add to price history
      const history = this.priceHistory.get(symbol) || [];
      history.push({
        price: newPrice,
        timestamp,
        source
      });

      // Keep only last 1000 price points
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }

      this.priceHistory.set(symbol, history);

      // Check for significant price changes
      if (Math.abs(priceChange) > this.volatilityThreshold) {
        await this.notifyVolatilityAlert(symbol, updatedFeed);
      }

      // Notify subscribers
      await this.notifySubscribers(symbol, updatedFeed);

      logger.info('OraclePricingEngine', 'updatePrice', `Updated ${symbol}: ${newPrice} (${(priceChange * 100).toFixed(2)}%)`);

      return updatedFeed;

    } catch (error) {
      logger.error('OraclePricingEngine', 'updatePrice', error.message);
      throw error;
    }
  }

  calculateConfidence(symbol, newPrice, oldPrice) {
    // Calculate confidence based on price stability and source reliability
    const priceChange = Math.abs((newPrice - oldPrice) / oldPrice);
    
    let baseConfidence = 0.95;
    
    // Reduce confidence for large price swings
    if (priceChange > 0.1) {
      baseConfidence -= 0.2;
    } else if (priceChange > 0.05) {
      baseConfidence -= 0.1;
    }

    // Adjust based on feed type
    const feed = this.priceFeeds.get(symbol);
    if (feed) {
      switch (feed.source) {
        case ORACLE_SOURCES.CHAINLINK:
          baseConfidence += 0.04;
          break;
        case ORACLE_SOURCES.HEDERA_CONSENSUS:
          baseConfidence += 0.03;
          break;
        case ORACLE_SOURCES.EXTERNAL_API:
          baseConfidence += 0.01;
          break;
        default:
          baseConfidence -= 0.05;
      }
    }

    return Math.max(0.5, Math.min(0.999, baseConfidence));
  }

  async getPrice(symbol) {
    const feed = this.priceFeeds.get(symbol);
    if (!feed) {
      throw new Error(`Price feed not found: ${symbol}`);
    }

    return {
      symbol,
      price: feed.price,
      previousPrice: feed.previousPrice,
      priceChange: feed.priceChange,
      priceChangePercent: feed.priceChangePercent,
      confidence: feed.confidence,
      source: feed.source,
      lastUpdated: feed.lastUpdated,
      type: feed.type
    };
  }

  async getPriceHistory(symbol, timeframe = '24h') {
    const history = this.priceHistory.get(symbol);
    if (!history) {
      throw new Error(`Price history not found: ${symbol}`);
    }

    const now = new Date();
    let cutoffTime;

    switch (timeframe) {
      case '1h':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const filteredHistory = history.filter(point => 
      new Date(point.timestamp) >= cutoffTime
    );

    return {
      symbol,
      timeframe,
      data: filteredHistory,
      count: filteredHistory.length
    };
  }

  async getMultiplePrices(symbols) {
    const prices = {};
    
    for (const symbol of symbols) {
      try {
        prices[symbol] = await this.getPrice(symbol);
      } catch (error) {
        prices[symbol] = {
          error: error.message,
          symbol
        };
      }
    }

    return prices;
  }

  async calculateRWAPrice(tokenId, assetData, marketFactors = {}) {
    try {
      logger.info('OraclePricingEngine', 'calculateRWAPrice', `Calculating RWA price for token: ${tokenId}`);

      // Base valuation from asset data
      let basePrice = assetData.valuation || 0;

      // Apply market factors
      const factors = {
        marketSentiment: marketFactors.marketSentiment || 1.0,
        liquidityPremium: marketFactors.liquidityPremium || 1.0,
        riskDiscount: marketFactors.riskDiscount || 1.0,
        demandMultiplier: marketFactors.demandMultiplier || 1.0,
        ...marketFactors
      };

      // Calculate adjusted price
      let adjustedPrice = basePrice;
      
      Object.entries(factors).forEach(([factor, value]) => {
        adjustedPrice *= value;
      });

      // Get relevant market data for comparison
      const marketData = await this.getRelevantMarketData(assetData.type);

      // Apply market correlation adjustments
      if (marketData.correlation) {
        adjustedPrice *= (1 + marketData.correlation * marketData.marketChange);
      }

      // Calculate confidence based on data quality
      const confidence = this.calculateRWAConfidence(assetData, marketFactors);

      const priceData = {
        tokenId,
        basePrice,
        adjustedPrice,
        factors,
        marketData,
        confidence,
        calculatedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Valid for 5 minutes
      };

      return priceData;

    } catch (error) {
      logger.error('OraclePricingEngine', 'calculateRWAPrice', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        tokenId
      };
    }
  }

  async getRelevantMarketData(assetType) {
    // Get relevant market indicators based on asset type
    const marketIndicators = {
      [PRICE_FEED_TYPES.REAL_ESTATE]: ['REALESTATE_INDEX/USD'],
      [PRICE_FEED_TYPES.COMMODITY]: ['CORN/USD', 'WHEAT/USD'],
      [PRICE_FEED_TYPES.CARBON_CREDIT]: ['CARBON/USD'],
      [PRICE_FEED_TYPES.FARM_PRODUCE]: ['CORN/USD', 'WHEAT/USD']
    };

    const relevantFeeds = marketIndicators[assetType] || ['HBAR/USD'];
    const marketData = {};

    for (const feed of relevantFeeds) {
      try {
        const priceData = await this.getPrice(feed);
        marketData[feed] = priceData;
      } catch (error) {
        // Skip if feed not available
      }
    }

    // Calculate overall market sentiment
    const changes = Object.values(marketData).map(data => data.priceChange || 0);
    const avgChange = changes.length > 0 ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;

    return {
      indicators: marketData,
      marketChange: avgChange,
      correlation: 0.3, // Simplified correlation factor
      sentiment: avgChange > 0 ? 'POSITIVE' : avgChange < 0 ? 'NEGATIVE' : 'NEUTRAL'
    };
  }

  calculateRWAConfidence(assetData, marketFactors) {
    let confidence = 0.8; // Base confidence

    // Adjust based on data quality
    if (assetData.verified) confidence += 0.1;
    if (assetData.documents && assetData.documents.length > 0) confidence += 0.05;
    if (assetData.location) confidence += 0.02;
    if (assetData.nfcVerified) confidence += 0.03;

    // Adjust based on market factor reliability
    const factorCount = Object.keys(marketFactors).length;
    confidence += Math.min(0.1, factorCount * 0.02);

    return Math.min(0.95, confidence);
  }

  async subscribeToPrice(symbol, callback, subscriberId = null) {
    const id = subscriberId || crypto.randomUUID();
    
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Map());
    }
    
    this.subscribers.get(symbol).set(id, callback);
    
    return id;
  }

  async unsubscribeFromPrice(symbol, subscriberId) {
    if (this.subscribers.has(symbol)) {
      this.subscribers.get(symbol).delete(subscriberId);
    }
  }

  async notifySubscribers(symbol, priceData) {
    if (this.subscribers.has(symbol)) {
      const symbolSubscribers = this.subscribers.get(symbol);
      
      for (const [id, callback] of symbolSubscribers.entries()) {
        try {
          await callback(priceData);
        } catch (error) {
          logger.error('OraclePricingEngine', 'notifySubscribers', `Callback error for ${id}: ${error.message}`);
        }
      }
    }
  }

  async notifyVolatilityAlert(symbol, priceData) {
    logger.warn('OraclePricingEngine', 'volatilityAlert', `High volatility detected for ${symbol}: ${priceData.priceChangePercent.toFixed(2)}%`);
    
    // In production, this would trigger alerts to relevant systems
    const alert = {
      type: 'VOLATILITY_ALERT',
      symbol,
      priceChange: priceData.priceChangePercent,
      currentPrice: priceData.price,
      previousPrice: priceData.previousPrice,
      timestamp: priceData.lastUpdated,
      severity: Math.abs(priceData.priceChange) > 0.1 ? 'HIGH' : 'MEDIUM'
    };

    return alert;
  }

  async getAllPrices() {
    const allPrices = {};
    
    for (const [symbol, feed] of this.priceFeeds.entries()) {
      allPrices[symbol] = {
        symbol,
        price: feed.price,
        priceChange: feed.priceChange,
        priceChangePercent: feed.priceChangePercent,
        confidence: feed.confidence,
        type: feed.type,
        lastUpdated: feed.lastUpdated
      };
    }

    return allPrices;
  }

  async getMarketSummary() {
    const allPrices = await this.getAllPrices();
    const symbols = Object.keys(allPrices);
    
    const summary = {
      totalFeeds: symbols.length,
      lastUpdated: new Date().toISOString(),
      marketSentiment: 'NEUTRAL',
      volatileAssets: [],
      topGainers: [],
      topLosers: []
    };

    // Calculate market sentiment
    const changes = symbols.map(symbol => allPrices[symbol].priceChange || 0);
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    
    if (avgChange > 0.02) {
      summary.marketSentiment = 'BULLISH';
    } else if (avgChange < -0.02) {
      summary.marketSentiment = 'BEARISH';
    }

    // Find volatile assets
    summary.volatileAssets = symbols
      .filter(symbol => Math.abs(allPrices[symbol].priceChange || 0) > this.volatilityThreshold)
      .map(symbol => ({
        symbol,
        priceChange: allPrices[symbol].priceChangePercent
      }));

    // Top gainers and losers
    const sortedByChange = symbols
      .map(symbol => ({
        symbol,
        priceChange: allPrices[symbol].priceChangePercent || 0
      }))
      .sort((a, b) => b.priceChange - a.priceChange);

    summary.topGainers = sortedByChange.slice(0, 3);
    summary.topLosers = sortedByChange.slice(-3).reverse();

    return summary;
  }
}

// Create singleton instance
const oraclePricingEngine = new OraclePricingEngine();

// Export functions
const getPrice = async (symbol) => {
  return await oraclePricingEngine.getPrice(symbol);
};

const getPriceHistory = async (symbol, timeframe) => {
  return await oraclePricingEngine.getPriceHistory(symbol, timeframe);
};

const getMultiplePrices = async (symbols) => {
  return await oraclePricingEngine.getMultiplePrices(symbols);
};

const calculateRWAPrice = async (tokenId, assetData, marketFactors) => {
  return await oraclePricingEngine.calculateRWAPrice(tokenId, assetData, marketFactors);
};

const subscribeToPrice = async (symbol, callback, subscriberId) => {
  return await oraclePricingEngine.subscribeToPrice(symbol, callback, subscriberId);
};

const getAllPrices = async () => {
  return await oraclePricingEngine.getAllPrices();
};

const getMarketSummary = async () => {
  return await oraclePricingEngine.getMarketSummary();
};

export {
  ORACLE_SOURCES,
  PRICE_FEED_TYPES,
  OraclePricingEngine,
  getPrice,
  getPriceHistory,
  getMultiplePrices,
  calculateRWAPrice,
  subscribeToPrice,
  getAllPrices,
  getMarketSummary
};
