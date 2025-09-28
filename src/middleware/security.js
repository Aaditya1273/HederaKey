const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class SecurityMiddleware {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'mindkey-super-secret-key-2024';
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
  }

  // Rate limiting middleware
  createRateLimiter(windowMs = 15 * 60 * 1000, max = 100) {
    return rateLimit({
      windowMs,
      max,
      message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests from this IP',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
    });
  }

  // JWT authentication middleware
  authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    jwt.verify(token, this.jwtSecret, (err, user) => {
      if (err) {
        return res.status(403).json({
          error: 'Invalid token',
          message: 'The provided token is invalid or expired'
        });
      }
      
      req.user = user;
      next();
    });
  }

  // Optional authentication (for public endpoints that benefit from user context)
  optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, this.jwtSecret, (err, user) => {
        if (!err) {
          req.user = user;
        }
      });
    }
    
    next();
  }

  // Generate JWT token
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      hederaAccountId: user.hederaAccountId,
      kycStatus: user.kycStatus
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '24h',
      issuer: 'mindkey-api',
      audience: 'mindkey-client'
    });
  }

  // Input validation middleware
  validateInput(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.details[0].message,
          field: error.details[0].path[0]
        });
      }
      
      req.body = value;
      next();
    };
  }

  // CORS security headers
  securityHeaders(req, res, next) {
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://testnet.mirrornode.hedera.com https://testnet.hashio.io; " +
      "font-src 'self'; " +
      "object-src 'none'; " +
      "base-uri 'self';"
    );

    // Other security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
  }

  // API key validation for external services
  validateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'Please provide a valid API key'
      });
    }

    // In production, validate against database
    const validApiKeys = [
      process.env.ADMIN_API_KEY,
      process.env.MOBILE_API_KEY,
      process.env.WEB_API_KEY
    ].filter(Boolean);

    if (!validApiKeys.includes(apiKey)) {
      return res.status(403).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid'
      });
    }

    next();
  }

  // Hedera account ownership verification
  async verifyHederaOwnership(req, res, next) {
    try {
      const { hederaAccountId, signature, message } = req.body;
      
      if (!hederaAccountId || !signature || !message) {
        return res.status(400).json({
          error: 'Missing verification data',
          message: 'Hedera account ID, signature, and message are required'
        });
      }

      // In production, verify the signature against the account's public key
      // For now, we'll do basic validation
      if (!hederaAccountId.match(/^0\.0\.\d+$/)) {
        return res.status(400).json({
          error: 'Invalid Hedera account format',
          message: 'Hedera account ID must be in format 0.0.XXXXXX'
        });
      }

      req.verifiedAccount = hederaAccountId;
      next();
      
    } catch (error) {
      res.status(500).json({
        error: 'Verification failed',
        message: error.message
      });
    }
  }

  // NFC data validation
  validateNFCData(req, res, next) {
    const { nfcData } = req.body;
    
    if (!nfcData || !nfcData.tagId) {
      return res.status(400).json({
        error: 'Invalid NFC data',
        message: 'NFC tag ID is required'
      });
    }

    // Basic NFC tag ID validation
    if (nfcData.tagId.length < 8 || nfcData.tagId.length > 64) {
      return res.status(400).json({
        error: 'Invalid NFC tag format',
        message: 'NFC tag ID must be between 8 and 64 characters'
      });
    }

    next();
  }

  // Fraud prevention middleware
  async fraudCheck(req, res, next) {
    try {
      const clientIP = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // Basic fraud indicators
      const suspiciousPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i
      ];

      const isSuspicious = suspiciousPatterns.some(pattern => 
        pattern.test(userAgent || '')
      );

      if (isSuspicious) {
        console.log(`🚨 Suspicious request detected from ${clientIP}: ${userAgent}`);
        
        return res.status(429).json({
          error: 'Request blocked',
          message: 'Suspicious activity detected'
        });
      }

      // Add fraud context to request
      req.fraudContext = {
        clientIP,
        userAgent,
        timestamp: new Date().toISOString(),
        riskLevel: 'LOW'
      };

      next();
      
    } catch (error) {
      console.error('Fraud check error:', error);
      next(); // Continue on error
    }
  }

  // Encryption utilities
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Hash sensitive data
  hashData(data, salt = null) {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
    
    return {
      hash: hash.toString('hex'),
      salt: actualSalt
    };
  }

  // Verify hashed data
  verifyHash(data, hash, salt) {
    const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
    return hash === verifyHash.toString('hex');
  }
}

module.exports = new SecurityMiddleware();
