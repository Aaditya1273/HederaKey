#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up HederaKey Web Application...\n');

// Check if .env exists, if not copy from .env.example
if (!fs.existsSync('.env')) {
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ Created .env file from .env.example');
    console.log('⚠️  Please edit .env with your Hedera credentials\n');
  } else {
    console.log('❌ .env.example not found. Please create it first.\n');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists\n');
}

// Create necessary directories
const directories = [
  'logs',
  'uploads',
  'models',
  'scripts',
  'client/src/components'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Copy React components to client
const componentFiles = [
  'src/react/components/HackathonDemo.js',
  'src/react/components/NFCSimulator.js', 
  'src/react/components/AMMSwapInterface.js',
  'src/react/components/PrivacyDashboard.js',
  'src/react/components/DePINNetworkMap.js'
];

componentFiles.forEach(file => {
  const sourcePath = file;
  const targetPath = file.replace('src/react/components/', 'client/src/components/');
  
  if (fs.existsSync(sourcePath)) {
    if (!fs.existsSync(path.dirname(targetPath))) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    }
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Copied ${path.basename(file)} to client`);
  }
});

console.log('\n📦 Installing dependencies...\n');

try {
  // Install root dependencies
  console.log('Installing server dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Install client dependencies
  console.log('\nInstalling client dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });
  
  console.log('\n🎉 Setup complete!\n');
  console.log('To start the application:');
  console.log('1. Edit .env with your Hedera credentials');
  console.log('2. Run: npm run dev');
  console.log('3. Open: http://localhost:3000\n');
  console.log('API will be available at: http://localhost:8080\n');
  
} catch (error) {
  console.error('❌ Error during setup:', error.message);
  process.exit(1);
}
