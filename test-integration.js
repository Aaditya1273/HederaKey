#!/usr/bin/env node
/**
 * Integration Test Suite for MindKey NFC (Hedera Edition)
 * Tests all major components end-to-end
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class IntegrationTester {
  constructor() {
    this.baseURL = 'http://localhost:8080';
    this.testResults = [];
    this.serverProcess = null;
  }

  async runAllTests() {
    console.log('🧪 Starting MindKey Integration Tests...\n');
    
    try {
      // Start server
      await this.startServer();
      
      // Wait for server to be ready
      await this.waitForServer();
      
      // Run test suite
      await this.testHealthCheck();
      await this.testNFCScanning();
      await this.testAIFraudDetection();
      await this.testDePINNetwork();
      await this.testAnalyticsDashboard();
      await this.testUserManagement();
      await this.testAssetManagement();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Integration test failed:', error.message);
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting test server...');
      
      this.serverProcess = spawn('node', ['server.js'], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('running on port')) {
          console.log('✅ Test server started');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      this.serverProcess.on('error', (error) => {
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Server start timeout'));
      }, 10000);
    });
  }

  async waitForServer() {
    console.log('⏳ Waiting for server to be ready...');
    
    for (let i = 0; i < 30; i++) {
      try {
        await axios.get(`${this.baseURL}/health`);
        console.log('✅ Server is ready');
        return;
      } catch (error) {
        await this.sleep(1000);
      }
    }
    
    throw new Error('Server failed to become ready');
  }

  async testHealthCheck() {
    console.log('\n🔍 Testing Health Check...');
    
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      
      this.assert(response.status === 200, 'Health check returns 200');
      this.assert(response.data.status === 'OK', 'Health status is OK');
      this.assert(response.data.services, 'Services status included');
      
      console.log('✅ Health check passed');
      this.testResults.push({ test: 'Health Check', status: 'PASS' });
      
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
      this.testResults.push({ test: 'Health Check', status: 'FAIL', error: error.message });
    }
  }

  async testNFCScanning() {
    console.log('\n📱 Testing NFC Scanning...');
    
    try {
      const nfcData = {
        nfcData: {
          tagId: 'nfc_farm_001',
          signature: '0x1a2b3c...',
          timestamp: new Date().toISOString()
        },
        deviceInfo: {
          userAgent: 'Mozilla/5.0 (Mobile; Android)',
          location: { lat: 6.5244, lng: 3.3792 }
        }
      };

      const response = await axios.post(`${this.baseURL}/api/nfc/scan`, nfcData);
      
      this.assert(response.status === 200, 'NFC scan returns 200');
      this.assert(response.data.success, 'NFC scan successful');
      this.assert(response.data.cardId, 'Card ID returned');
      this.assert(response.data.walletData, 'Wallet data returned');
      
      console.log('✅ NFC scanning passed');
      this.testResults.push({ test: 'NFC Scanning', status: 'PASS' });
      
    } catch (error) {
      console.log('❌ NFC scanning failed:', error.message);
      this.testResults.push({ test: 'NFC Scanning', status: 'FAIL', error: error.message });
    }
  }

  async testAIFraudDetection() {
    console.log('\n🤖 Testing AI Fraud Detection...');
    
    try {
      const transactionData = {
        transaction: {
          id: 'tx_test_001',
          amount: 1000,
          type: 'transfer',
          timestamp: new Date().toISOString(),
          userId: 'user_001'
        },
        userHistory: {
          account_age_days: 30,
          transaction_count: 15,
          avg_amount: 500,
          recent_tx_count: 2
        }
      };

      const response = await axios.post(`${this.baseURL}/api/ai/fraud-detection/analyze`, transactionData);
      
      this.assert(response.status === 200, 'AI analysis returns 200');
      this.assert(response.data.success, 'AI analysis successful');
      this.assert(typeof response.data.riskScore === 'number', 'Risk score is number');
      this.assert(response.data.riskLevel, 'Risk level returned');
      this.assert(response.data.decision, 'Decision returned');
      this.assert(response.data.features, 'Feature scores returned');
      
      console.log('✅ AI fraud detection passed');
      this.testResults.push({ test: 'AI Fraud Detection', status: 'PASS' });
      
    } catch (error) {
      console.log('❌ AI fraud detection failed:', error.message);
      this.testResults.push({ test: 'AI Fraud Detection', status: 'FAIL', error: error.message });
    }
  }

  async testDePINNetwork() {
    console.log('\n🌐 Testing DePIN Network...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/depin/network/status`);
      
      this.assert(response.status === 200, 'DePIN status returns 200');
      this.assert(typeof response.data.totalNodes === 'number', 'Total nodes is number');
      this.assert(typeof response.data.activeNodes === 'number', 'Active nodes is number');
      this.assert(Array.isArray(response.data.cityHubs), 'City hubs is array');
      this.assert(response.data.totalStaked, 'Total staked returned');
      
      console.log('✅ DePIN network passed');
      this.testResults.push({ test: 'DePIN Network', status: 'PASS' });
      
    } catch (error) {
      console.log('❌ DePIN network failed:', error.message);
      this.testResults.push({ test: 'DePIN Network', status: 'FAIL', error: error.message });
    }
  }

  async testAnalyticsDashboard() {
    console.log('\n📊 Testing Analytics Dashboard...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/analytics/dashboard`);
      
      this.assert(response.status === 200, 'Analytics returns 200');
      this.assert(response.data.success, 'Analytics successful');
      this.assert(response.data.data.overview, 'Overview data returned');
      this.assert(response.data.data.metrics, 'Metrics data returned');
      this.assert(response.data.data.growth, 'Growth data returned');
      
      console.log('✅ Analytics dashboard passed');
      this.testResults.push({ test: 'Analytics Dashboard', status: 'PASS' });
      
    } catch (error) {
      console.log('❌ Analytics dashboard failed:', error.message);
      this.testResults.push({ test: 'Analytics Dashboard', status: 'FAIL', error: error.message });
    }
  }

  async testUserManagement() {
    console.log('\n👤 Testing User Management...');
    
    try {
      // Test user creation
      const userData = {
        email: 'test@example.com',
        username: 'test_user',
        hederaAccountId: '0.0.999999',
        firstName: 'Test',
        lastName: 'User',
        country: 'Nigeria'
      };

      const createResponse = await axios.post(`${this.baseURL}/api/users/create`, userData);
      
      this.assert(createResponse.status === 200, 'User creation returns 200');
      this.assert(createResponse.data.success, 'User creation successful');
      
      // Test user lookup
      const lookupResponse = await axios.get(`${this.baseURL}/api/users/hedera/0.0.123456`);
      
      this.assert(lookupResponse.status === 200, 'User lookup returns 200');
      this.assert(lookupResponse.data.success, 'User lookup successful');
      
      console.log('✅ User management passed');
      this.testResults.push({ test: 'User Management', status: 'PASS' });
      
    } catch (error) {
      console.log('❌ User management failed:', error.message);
      this.testResults.push({ test: 'User Management', status: 'FAIL', error: error.message });
    }
  }

  async testAssetManagement() {
    console.log('\n🏠 Testing Asset Management...');
    
    try {
      const assetData = {
        name: 'Test Asset',
        type: 'FARM_SHARE',
        description: 'Test asset for integration testing',
        valuation: 1000,
        nfcTagId: 'nfc_test_001',
        location: 'Test Location',
        ownerId: 'user_001'
      };

      const response = await axios.post(`${this.baseURL}/api/assets/create`, assetData);
      
      this.assert(response.status === 200, 'Asset creation returns 200');
      this.assert(response.data.success, 'Asset creation successful');
      this.assert(response.data.asset, 'Asset data returned');
      
      console.log('✅ Asset management passed');
      this.testResults.push({ test: 'Asset Management', status: 'PASS' });
      
    } catch (error) {
      console.log('❌ Asset management failed:', error.message);
      this.testResults.push({ test: 'Asset Management', status: 'FAIL', error: error.message });
    }
  }

  generateReport() {
    console.log('\n📋 Integration Test Report');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      summary: { total, passed, failed, successRate: ((passed / total) * 100).toFixed(1) + '%' },
      results: this.testResults
    };
    
    fs.writeFileSync('integration-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Report saved to integration-test-report.json');
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    if (this.serverProcess) {
      this.serverProcess.kill();
      console.log('✅ Test server stopped');
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllTests().catch(console.error);
}

module.exports = IntegrationTester;
