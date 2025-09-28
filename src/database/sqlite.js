const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class SQLiteService {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../../data/mindkey.db');
    this.isConnected = false;
    this.initialize();
  }

  async initialize() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Initialize SQLite database
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ SQLite connection failed:', err.message);
        } else {
          console.log('✅ SQLite database connected');
          this.createTables();
          this.seedTempData();
        }
      });

      this.isConnected = true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
    }
  }

  createTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        username TEXT UNIQUE,
        hedera_account_id TEXT UNIQUE,
        unstoppable_domain TEXT UNIQUE,
        nfc_card_id TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        phone_number TEXT,
        country TEXT,
        kyc_status TEXT DEFAULT 'PENDING',
        public_key TEXT,
        encrypted_private_key TEXT,
        wallet_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME
      )`,

      // Assets table
      `CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        valuation REAL NOT NULL,
        token_id TEXT UNIQUE,
        nfc_tag_id TEXT UNIQUE,
        location TEXT,
        image_url TEXT,
        document_hash TEXT,
        verified BOOLEAN DEFAULT 0,
        owner_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )`,

      // Transactions table
      `CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        amount REAL NOT NULL,
        from_token TEXT,
        to_token TEXT,
        exchange_rate REAL,
        hedera_tx_id TEXT UNIQUE,
        hedera_status TEXT,
        gas_used REAL,
        user_id TEXT NOT NULL,
        asset_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (asset_id) REFERENCES assets(id)
      )`,

      // Fraud scores table
      `CREATE TABLE IF NOT EXISTS fraud_scores (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        risk_score REAL NOT NULL,
        risk_level TEXT NOT NULL,
        confidence REAL NOT NULL,
        decision TEXT NOT NULL,
        behavioral_score REAL,
        location_score REAL,
        device_score REAL,
        time_score REAL,
        transaction_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,

      // DePIN nodes table
      `CREATE TABLE IF NOT EXISTS depin_nodes (
        id TEXT PRIMARY KEY,
        node_id TEXT UNIQUE NOT NULL,
        city TEXT NOT NULL,
        country TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        status TEXT DEFAULT 'ACTIVE',
        uptime REAL DEFAULT 0,
        latency INTEGER DEFAULT 0,
        operator_id TEXT NOT NULL,
        staked_amount REAL DEFAULT 0,
        rewards_earned REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_ping_at DATETIME,
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )`,

      // NFC cards table
      `CREATE TABLE IF NOT EXISTS nfc_cards (
        id TEXT PRIMARY KEY,
        card_id TEXT UNIQUE NOT NULL,
        encrypted_data TEXT NOT NULL,
        card_type TEXT,
        manufacturer TEXT,
        capacity INTEGER,
        encryption_key TEXT NOT NULL,
        access_count INTEGER DEFAULT 0,
        last_access_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    tables.forEach(sql => {
      this.db.run(sql, (err) => {
        if (err) {
          console.error('❌ Table creation failed:', err.message);
        }
      });
    });

    console.log('✅ Database tables created');
  }

  seedTempData() {
    // Check if data already exists
    this.db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (err) {
        console.error('❌ Seed check failed:', err.message);
        return;
      }

      if (row.count > 0) {
        console.log('📊 Database already has data, skipping seed');
        return;
      }

      console.log('🌱 Seeding temporary data...');

      // Seed users
      const users = [
        {
          id: 'user_001',
          email: 'farmer@lagos.ng',
          username: 'lagos_farmer',
          hedera_account_id: '0.0.123456',
          first_name: 'Adebayo',
          last_name: 'Okafor',
          country: 'Nigeria',
          kyc_status: 'APPROVED'
        },
        {
          id: 'user_002',
          email: 'investor@nairobi.ke',
          username: 'nairobi_investor',
          hedera_account_id: '0.0.789012',
          first_name: 'Grace',
          last_name: 'Wanjiku',
          country: 'Kenya',
          kyc_status: 'APPROVED'
        },
        {
          id: 'user_003',
          email: 'trader@accra.gh',
          username: 'accra_trader',
          hedera_account_id: '0.0.345678',
          first_name: 'Kwame',
          last_name: 'Asante',
          country: 'Ghana',
          kyc_status: 'PENDING'
        }
      ];

      users.forEach(user => {
        this.db.run(`INSERT INTO users (id, email, username, hedera_account_id, first_name, last_name, country, kyc_status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.id, user.email, user.username, user.hedera_account_id, user.first_name, user.last_name, user.country, user.kyc_status]);
      });

      // Seed assets
      const assets = [
        {
          id: 'asset_001',
          name: 'Organic Farm Share #001',
          type: 'FARM_SHARE',
          description: 'Premium organic farm share in Lagos, Nigeria',
          valuation: 5000,
          nfc_tag_id: 'nfc_farm_001',
          location: 'Lagos, Nigeria',
          verified: 1,
          owner_id: 'user_001'
        },
        {
          id: 'asset_002',
          name: 'Downtown Apartment Unit',
          type: 'REAL_ESTATE',
          description: 'Modern apartment in Nairobi city center',
          valuation: 250000,
          nfc_tag_id: 'nfc_re_001',
          location: 'Nairobi, Kenya',
          verified: 1,
          owner_id: 'user_002'
        },
        {
          id: 'asset_003',
          name: 'Carbon Credit Certificate',
          type: 'CARBON_CREDIT',
          description: 'Verified carbon credits from Ghana forest project',
          valuation: 850,
          nfc_tag_id: 'nfc_carbon_001',
          location: 'Accra, Ghana',
          verified: 0,
          owner_id: 'user_003'
        }
      ];

      assets.forEach(asset => {
        this.db.run(`INSERT INTO assets (id, name, type, description, valuation, nfc_tag_id, location, verified, owner_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [asset.id, asset.name, asset.type, asset.description, asset.valuation, asset.nfc_tag_id, asset.location, asset.verified, asset.owner_id]);
      });

      // Seed DePIN nodes
      const nodes = [
        {
          id: 'node_001',
          node_id: 'node_lagos_001',
          city: 'Lagos',
          country: 'Nigeria',
          latitude: 6.5244,
          longitude: 3.3792,
          uptime: 98.7,
          latency: 125,
          operator_id: 'user_001',
          staked_amount: 1000
        },
        {
          id: 'node_002',
          node_id: 'node_nairobi_001',
          city: 'Nairobi',
          country: 'Kenya',
          latitude: -1.2921,
          longitude: 36.8219,
          uptime: 99.2,
          latency: 98,
          operator_id: 'user_002',
          staked_amount: 1500
        },
        {
          id: 'node_003',
          node_id: 'node_accra_001',
          city: 'Accra',
          country: 'Ghana',
          latitude: 5.6037,
          longitude: -0.1870,
          uptime: 97.5,
          latency: 156,
          operator_id: 'user_003',
          staked_amount: 800
        }
      ];

      nodes.forEach(node => {
        this.db.run(`INSERT INTO depin_nodes (id, node_id, city, country, latitude, longitude, uptime, latency, operator_id, staked_amount)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [node.id, node.node_id, node.city, node.country, node.latitude, node.longitude, node.uptime, node.latency, node.operator_id, node.staked_amount]);
      });

      // Seed some transactions
      const transactions = [
        {
          id: 'tx_001',
          type: 'MINT',
          status: 'CONFIRMED',
          amount: 1,
          from_token: 'ASSET',
          to_token: 'FARM001',
          user_id: 'user_001',
          asset_id: 'asset_001'
        },
        {
          id: 'tx_002',
          type: 'SWAP',
          status: 'CONFIRMED',
          amount: 1000,
          from_token: 'FARM001',
          to_token: 'HBAR',
          exchange_rate: 0.00523,
          user_id: 'user_001'
        }
      ];

      transactions.forEach(tx => {
        this.db.run(`INSERT INTO transactions (id, type, status, amount, from_token, to_token, exchange_rate, user_id, asset_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [tx.id, tx.type, tx.status, tx.amount, tx.from_token, tx.to_token, tx.exchange_rate, tx.user_id, tx.asset_id]);
      });

      console.log('✅ Temporary data seeded successfully');
    });
  }

  // User operations
  async createUser(userData) {
    return new Promise((resolve, reject) => {
      const id = this.generateId();
      const sql = `INSERT INTO users (id, email, username, hedera_account_id, first_name, last_name, country, kyc_status)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      
      this.db.run(sql, [id, userData.email, userData.username, userData.hederaAccountId, 
                       userData.firstName, userData.lastName, userData.country, userData.kycStatus || 'PENDING'],
        function(err) {
          if (err) {
            reject(new Error(`User creation failed: ${err.message}`));
          } else {
            resolve({ id, ...userData });
          }
        });
    });
  }

  async getUserByHederaAccount(hederaAccountId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE hedera_account_id = ?`;
      
      this.db.get(sql, [hederaAccountId], (err, row) => {
        if (err) {
          reject(new Error(`User lookup failed: ${err.message}`));
        } else {
          resolve(row || null);
        }
      });
    });
  }

  // Asset operations
  async getAssetByNFC(nfcTagId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT a.*, u.first_name, u.last_name, u.hedera_account_id 
                   FROM assets a 
                   JOIN users u ON a.owner_id = u.id 
                   WHERE a.nfc_tag_id = ?`;
      
      this.db.get(sql, [nfcTagId], (err, row) => {
        if (err) {
          reject(new Error(`Asset lookup failed: ${err.message}`));
        } else {
          resolve(row || null);
        }
      });
    });
  }

  async createAsset(assetData) {
    return new Promise((resolve, reject) => {
      const id = this.generateId();
      const sql = `INSERT INTO assets (id, name, type, description, valuation, nfc_tag_id, location, owner_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      
      this.db.run(sql, [id, assetData.name, assetData.type, assetData.description,
                       assetData.valuation, assetData.nfcTagId, assetData.location, assetData.ownerId],
        function(err) {
          if (err) {
            reject(new Error(`Asset creation failed: ${err.message}`));
          } else {
            resolve({ id, ...assetData });
          }
        });
    });
  }

  // Transaction operations
  async createTransaction(txData) {
    return new Promise((resolve, reject) => {
      const id = this.generateId();
      const sql = `INSERT INTO transactions (id, type, status, amount, from_token, to_token, exchange_rate, user_id, asset_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      this.db.run(sql, [id, txData.type, txData.status || 'PENDING', txData.amount,
                       txData.fromToken, txData.toToken, txData.exchangeRate, txData.userId, txData.assetId],
        function(err) {
          if (err) {
            reject(new Error(`Transaction creation failed: ${err.message}`));
          } else {
            resolve({ id, ...txData });
          }
        });
    });
  }

  // Fraud score operations
  async createFraudScore(fraudData) {
    return new Promise((resolve, reject) => {
      const id = this.generateId();
      const sql = `INSERT INTO fraud_scores (id, user_id, risk_score, risk_level, confidence, decision, behavioral_score, location_score, device_score, time_score)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      this.db.run(sql, [id, fraudData.userId, fraudData.riskScore, fraudData.riskLevel,
                       fraudData.confidence, fraudData.decision, fraudData.behavioralScore,
                       fraudData.locationScore, fraudData.deviceScore, fraudData.timeScore],
        function(err) {
          if (err) {
            reject(new Error(`Fraud score creation failed: ${err.message}`));
          } else {
            resolve({ id, ...fraudData });
          }
        });
    });
  }

  // DePIN operations
  async getDePINNodes() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT d.*, u.first_name, u.last_name 
                   FROM depin_nodes d 
                   JOIN users u ON d.operator_id = u.id 
                   ORDER BY d.created_at DESC`;
      
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(new Error(`DePIN nodes query failed: ${err.message}`));
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async updateNodePing(nodeId, uptime) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE depin_nodes SET uptime = ?, last_ping_at = CURRENT_TIMESTAMP WHERE node_id = ?`;
      
      this.db.run(sql, [uptime, nodeId], function(err) {
        if (err) {
          reject(new Error(`Node ping update failed: ${err.message}`));
        } else {
          resolve({ nodeId, uptime, updated: this.changes > 0 });
        }
      });
    });
  }

  // Analytics
  async getAnalytics() {
    return new Promise((resolve, reject) => {
      const queries = [
        "SELECT COUNT(*) as totalUsers FROM users",
        "SELECT COUNT(*) as totalAssets FROM assets",
        "SELECT COUNT(*) as totalTransactions FROM transactions",
        "SELECT COUNT(*) as totalNodes FROM depin_nodes",
        "SELECT SUM(valuation) as totalValuation FROM assets WHERE verified = 1",
        "SELECT AVG(uptime) as avgUptime FROM depin_nodes WHERE status = 'ACTIVE'"
      ];

      Promise.all(queries.map(sql => 
        new Promise((res, rej) => {
          this.db.get(sql, [], (err, row) => {
            if (err) rej(err);
            else res(row);
          });
        })
      )).then(results => {
        resolve({
          totalUsers: results[0].totalUsers,
          totalAssets: results[1].totalAssets,
          totalTransactions: results[2].totalTransactions,
          totalNodes: results[3].totalNodes,
          totalValuation: results[4].totalValuation || 0,
          avgUptime: results[5].avgUptime || 0
        });
      }).catch(reject);
    });
  }

  // Utility methods
  generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  async healthCheck() {
    return new Promise((resolve) => {
      if (!this.isConnected) {
        resolve({ status: 'disconnected', database: 'sqlite' });
        return;
      }

      this.db.get("SELECT 1", [], (err) => {
        resolve({
          status: err ? 'error' : 'healthy',
          database: 'sqlite',
          path: this.dbPath,
          error: err?.message
        });
      });
    });
  }

  async close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('❌ Database close error:', err.message);
        } else {
          console.log('✅ Database connection closed');
        }
      });
    }
  }
}

module.exports = new SQLiteService();
