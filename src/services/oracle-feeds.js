const axios = require('axios');

class OracleFeedsService {
  constructor() {
    this.priceCache = new Map();
    this.lastUpdate = new Map();
    this.updateInterval = 5 * 60 * 1000; // 5 minutes
    this.initialize();
  }

  async initialize() {
    // Start price feed updates
    this.startPriceFeedUpdates();
    console.log('✅ Oracle Feeds Service initialized');
  }

  /**
   * Get live crop and commodity prices
   */
  async getCropPrices() {
    try {
      // Mock API calls to agricultural price feeds
      const crops = await Promise.all([
        this.fetchCropPrice('corn', 'CORN/USD'),
        this.fetchCropPrice('wheat', 'WHEAT/USD'),
        this.fetchCropPrice('soybeans', 'SOY/USD'),
        this.fetchCropPrice('rice', 'RICE/USD'),
        this.fetchCropPrice('cocoa', 'COCOA/USD'),
        this.fetchCropPrice('coffee', 'COFFEE/USD')
      ]);

      return crops.reduce((acc, crop) => {
        acc[crop.symbol] = crop;
        return acc;
      }, {});
      
    } catch (error) {
      console.error('Failed to fetch crop prices:', error);
      return this.getFallbackPrices();
    }
  }

  /**
   * Fetch individual crop price with market data
   */
  async fetchCropPrice(crop, symbol) {
    try {
      // Simulate real agricultural price API
      const basePrice = this.getBaseCropPrice(crop);
      const volatility = this.getCropVolatility(crop);
      
      // Add realistic price movement
      const change = (Math.random() - 0.5) * volatility;
      const currentPrice = basePrice * (1 + change);
      
      // Calculate market metrics
      const volume24h = Math.random() * 1000000 + 100000;
      const marketCap = currentPrice * (Math.random() * 10000000 + 1000000);
      
      return {
        symbol,
        crop,
        price: parseFloat(currentPrice.toFixed(4)),
        priceChangePercent: parseFloat((change * 100).toFixed(2)),
        volume24h: Math.round(volume24h),
        marketCap: Math.round(marketCap),
        lastUpdated: new Date().toISOString(),
        source: 'Agricultural Market Data API'
      };
      
    } catch (error) {
      return this.getFallbackCropPrice(crop, symbol);
    }
  }

  /**
   * Get base prices for different crops (USD per metric ton)
   */
  getBaseCropPrice(crop) {
    const basePrices = {
      'corn': 280,      // $280/MT
      'wheat': 320,     // $320/MT  
      'soybeans': 450,  // $450/MT
      'rice': 380,      // $380/MT
      'cocoa': 2800,    // $2800/MT
      'coffee': 3200    // $3200/MT
    };
    
    return basePrices[crop] || 300;
  }

  /**
   * Get volatility factor for crops
   */
  getCropVolatility(crop) {
    const volatilities = {
      'corn': 0.05,      // 5% daily volatility
      'wheat': 0.06,     // 6% daily volatility
      'soybeans': 0.07,  // 7% daily volatility
      'rice': 0.04,      // 4% daily volatility
      'cocoa': 0.08,     // 8% daily volatility
      'coffee': 0.09     // 9% daily volatility
    };
    
    return volatilities[crop] || 0.05;
  }

  /**
   * Calculate farm token value based on crop prices
   */
  async calculateFarmTokenValue(farmData) {
    try {
      const cropPrices = await this.getCropPrices();
      
      let totalValue = 0;
      let valueBreakdown = {};
      
      // Calculate value based on farm composition
      if (farmData.crops) {
        for (const [crop, hectares] of Object.entries(farmData.crops)) {
          const cropPrice = cropPrices[`${crop.toUpperCase()}/USD`];
          if (cropPrice) {
            // Estimate yield per hectare and calculate value
            const yieldPerHectare = this.getAverageYield(crop);
            const cropValue = hectares * yieldPerHectare * cropPrice.price;
            
            totalValue += cropValue;
            valueBreakdown[crop] = {
              hectares,
              yieldPerHectare,
              pricePerTon: cropPrice.price,
              totalValue: cropValue
            };
          }
        }
      }
      
      // Add base land value
      const landValue = (farmData.totalHectares || 5) * 8000; // $8000/hectare base
      totalValue += landValue;
      
      // Apply location multiplier
      const locationMultiplier = this.getLocationMultiplier(farmData.location);
      totalValue *= locationMultiplier;
      
      return {
        totalValue: Math.round(totalValue),
        landValue: Math.round(landValue),
        cropValue: Math.round(totalValue - landValue),
        valueBreakdown,
        locationMultiplier,
        lastUpdated: new Date().toISOString(),
        priceFeeds: cropPrices
      };
      
    } catch (error) {
      throw new Error(`Farm valuation failed: ${error.message}`);
    }
  }

  /**
   * Get average yield per hectare for different crops
   */
  getAverageYield(crop) {
    const yields = {
      'corn': 9.5,      // 9.5 tons/hectare
      'wheat': 3.2,     // 3.2 tons/hectare
      'soybeans': 2.8,  // 2.8 tons/hectare
      'rice': 4.5,      // 4.5 tons/hectare
      'cocoa': 0.5,     // 0.5 tons/hectare
      'coffee': 1.2     // 1.2 tons/hectare
    };
    
    return yields[crop] || 3.0;
  }

  /**
   * Get location-based price multiplier
   */
  getLocationMultiplier(location) {
    const multipliers = {
      'Lagos': 1.2,     // Higher prices near cities
      'Nairobi': 1.15,
      'Accra': 1.1,
      'Kampala': 1.05,
      'Kigali': 1.0,
      'rural': 0.9      // Lower prices in rural areas
    };
    
    // Check if location contains any known city
    for (const [city, multiplier] of Object.entries(multipliers)) {
      if (location && location.toLowerCase().includes(city.toLowerCase())) {
        return multiplier;
      }
    }
    
    return multipliers.rural;
  }

  /**
   * Update farm token prices based on oracle feeds
   */
  async updateFarmTokenPrices(farmTokens) {
    const updates = [];
    
    for (const token of farmTokens) {
      try {
        const newValuation = await this.calculateFarmTokenValue(token.farmData);
        
        if (Math.abs(newValuation.totalValue - token.currentValue) > token.currentValue * 0.01) {
          // Price changed by more than 1%
          updates.push({
            tokenId: token.tokenId,
            oldValue: token.currentValue,
            newValue: newValuation.totalValue,
            changePercent: ((newValuation.totalValue - token.currentValue) / token.currentValue * 100).toFixed(2),
            reason: 'Oracle price update',
            timestamp: new Date().toISOString()
          });
        }
        
      } catch (error) {
        console.error(`Failed to update token ${token.tokenId}:`, error);
      }
    }
    
    return updates;
  }

  /**
   * Get market sentiment for agricultural sector
   */
  async getMarketSentiment() {
    try {
      const cropPrices = await this.getCropPrices();
      
      // Calculate overall market sentiment
      const priceChanges = Object.values(cropPrices).map(c => c.priceChangePercent);
      const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
      
      let sentiment = 'NEUTRAL';
      if (avgChange > 2) sentiment = 'BULLISH';
      else if (avgChange < -2) sentiment = 'BEARISH';
      
      return {
        sentiment,
        averageChange: parseFloat(avgChange.toFixed(2)),
        totalVolume: Object.values(cropPrices).reduce((sum, c) => sum + c.volume24h, 0),
        topGainers: Object.values(cropPrices)
          .filter(c => c.priceChangePercent > 0)
          .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
          .slice(0, 3),
        topLosers: Object.values(cropPrices)
          .filter(c => c.priceChangePercent < 0)
          .sort((a, b) => a.priceChangePercent - b.priceChangePercent)
          .slice(0, 3),
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        sentiment: 'UNKNOWN',
        error: error.message,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Start automatic price feed updates
   */
  startPriceFeedUpdates() {
    setInterval(async () => {
      try {
        const prices = await this.getCropPrices();
        this.priceCache.set('crops', prices);
        this.lastUpdate.set('crops', Date.now());
        
        console.log('📊 Oracle price feeds updated');
      } catch (error) {
        console.error('Failed to update price feeds:', error);
      }
    }, this.updateInterval);
  }

  /**
   * Get cached prices if available
   */
  getCachedPrices() {
    const cached = this.priceCache.get('crops');
    const lastUpdate = this.lastUpdate.get('crops');
    
    if (cached && lastUpdate && (Date.now() - lastUpdate) < this.updateInterval) {
      return cached;
    }
    
    return null;
  }

  /**
   * Fallback prices when API fails
   */
  getFallbackPrices() {
    return {
      'CORN/USD': { symbol: 'CORN/USD', crop: 'corn', price: 280, priceChangePercent: 0, source: 'fallback' },
      'WHEAT/USD': { symbol: 'WHEAT/USD', crop: 'wheat', price: 320, priceChangePercent: 0, source: 'fallback' },
      'SOY/USD': { symbol: 'SOY/USD', crop: 'soybeans', price: 450, priceChangePercent: 0, source: 'fallback' },
      'RICE/USD': { symbol: 'RICE/USD', crop: 'rice', price: 380, priceChangePercent: 0, source: 'fallback' }
    };
  }

  /**
   * Fallback for individual crop
   */
  getFallbackCropPrice(crop, symbol) {
    return {
      symbol,
      crop,
      price: this.getBaseCropPrice(crop),
      priceChangePercent: 0,
      volume24h: 100000,
      marketCap: 1000000,
      lastUpdated: new Date().toISOString(),
      source: 'fallback'
    };
  }

  /**
   * Health check for oracle service
   */
  async healthCheck() {
    try {
      const prices = await this.getCropPrices();
      const sentiment = await this.getMarketSentiment();
      
      return {
        status: 'healthy',
        priceFeeds: Object.keys(prices).length,
        lastUpdate: this.lastUpdate.get('crops'),
        sentiment: sentiment.sentiment,
        uptime: process.uptime()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        uptime: process.uptime()
      };
    }
  }
}

module.exports = new OracleFeedsService();
