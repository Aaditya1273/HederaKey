import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Wallet, 
  Smartphone, 
  Nfc, 
  Send, 
  Coins, 
  QrCode,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import WalletConnect from './components/WalletConnect';
import NFCHandler from './components/NFCHandler';
import HederaWallet from './components/HederaWallet';
import TokenMinter from './components/TokenMinter';
import TransactionHistory from './components/TransactionHistory';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Header = styled.header`
  text-align: center;
  color: white;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 10px;
  background: linear-gradient(45deg, #fff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 30px;
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const Card = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  background: ${props => props.connected ? 
    'linear-gradient(135deg, #10b981, #059669)' : 
    'linear-gradient(135deg, #ef4444, #dc2626)'};
  color: white;
  font-weight: 600;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  animation: ${props => props.connected ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  background: rgba(0, 0, 0, 0.05);
  padding: 5px;
  border-radius: 12px;
`;

const Tab = styled.button`
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background: ${props => props.active ? 
    'linear-gradient(135deg, #4f46e5, #7c3aed)' : 
    'transparent'};
  color: ${props => props.active ? 'white' : '#64748b'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.active ? 
      'linear-gradient(135deg, #4f46e5, #7c3aed)' : 
      'rgba(79, 70, 229, 0.1)'};
  }
`;

const NFCStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-radius: 12px;
  background: ${props => props.nfcAvailable ? 
    'linear-gradient(135deg, #10b981, #059669)' : 
    'linear-gradient(135deg, #f59e0b, #d97706)'};
  color: white;
  margin-bottom: 20px;
`;

const NFCIcon = styled(Nfc)`
  width: 24px;
  height: 24px;
  animation: ${props => props.scanning ? 'spin 2s linear infinite' : 'none'};
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

function App() {
  const [activeTab, setActiveTab] = useState('wallet');
  const [walletConnected, setWalletConnected] = useState(false);
  const [hederaAccount, setHederaAccount] = useState(null);
  const [nfcAvailable, setNfcAvailable] = useState(false);
  const [nfcScanning, setNfcScanning] = useState(false);
  const [walletBalance, setWalletBalance] = useState('0');
  const [tokens, setTokens] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Check NFC availability
    if ('NDEFReader' in window) {
      setNfcAvailable(true);
    }
    
    // Load saved wallet data
    const savedAccount = localStorage.getItem('hederaAccount');
    if (savedAccount) {
      setHederaAccount(JSON.parse(savedAccount));
      setWalletConnected(true);
      loadWalletData(JSON.parse(savedAccount));
    }
  }, []);

  const loadWalletData = async (account) => {
    try {
      // Load balance
      const balanceResponse = await fetch(`/getBalance/${account.accountId}`);
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setWalletBalance(balanceData.balance);
      }

      // Load transaction history
      const txResponse = await fetch(`/hedera/account/${account.accountId}`);
      if (txResponse.ok) {
        const txData = await txResponse.json();
        setTokens(txData.tokens || []);
        setTransactions(txData.transactions?.recent || []);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const handleWalletConnect = (account) => {
    setHederaAccount(account);
    setWalletConnected(true);
    localStorage.setItem('hederaAccount', JSON.stringify(account));
    loadWalletData(account);
    toast.success('Wallet connected successfully!');
  };

  const handleWalletDisconnect = () => {
    setHederaAccount(null);
    setWalletConnected(false);
    setWalletBalance('0');
    setTokens([]);
    setTransactions([]);
    localStorage.removeItem('hederaAccount');
    toast.success('Wallet disconnected');
  };

  const handleNFCTransaction = async (transactionData) => {
    try {
      setNfcScanning(true);
      
      // Process NFC transaction based on type
      let response;
      
      if (transactionData.type === 'transfer') {
        response = await fetch('/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            privateKey: hederaAccount.privateKey,
            destination: transactionData.destination,
            amount: transactionData.amount
          })
        });
      } else if (transactionData.type === 'mint') {
        response = await fetch('/tokens/mint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenName: transactionData.tokenName || 'NFC Token',
            symbol: transactionData.symbol || 'NFT',
            supply: transactionData.supply || '1'
          })
        });
      }

      if (response && response.ok) {
        const result = await response.json();
        toast.success(`Transaction successful: ${result.txHash}`);
        
        // Refresh wallet data
        await loadWalletData(hederaAccount);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      toast.error(`Transaction failed: ${error.message}`);
    } finally {
      setNfcScanning(false);
    }
  };

  const refreshWalletData = () => {
    if (hederaAccount) {
      loadWalletData(hederaAccount);
      toast.success('Wallet data refreshed');
    }
  };

  const tabs = [
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'nfc', label: 'NFC', icon: Nfc },
    { id: 'tokens', label: 'Tokens', icon: Coins },
    { id: 'connect', label: 'Connect', icon: Smartphone }
  ];

  return (
    <AppContainer>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      <Header>
        <Title>🌐 HederaKey NFC Wallet</Title>
        <Subtitle>
          Next-generation NFC wallet with Hedera integration and WalletConnect support
        </Subtitle>
        
        <ConnectionStatus connected={walletConnected}>
          <StatusDot connected={walletConnected} />
          {walletConnected ? 
            `Connected: ${hederaAccount?.accountId}` : 
            'No wallet connected'
          }
          {walletConnected && (
            <RefreshCw 
              size={16} 
              style={{ cursor: 'pointer', marginLeft: 'auto' }}
              onClick={refreshWalletData}
            />
          )}
        </ConnectionStatus>
      </Header>

      <MainContent>
        <Card
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TabContainer>
            {tabs.map(tab => (
              <Tab
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={18} />
                {tab.label}
              </Tab>
            ))}
          </TabContainer>

          <AnimatePresence mode="wait">
            {activeTab === 'wallet' && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <HederaWallet
                  account={hederaAccount}
                  balance={walletBalance}
                  tokens={tokens}
                  connected={walletConnected}
                  onTransaction={handleNFCTransaction}
                />
              </motion.div>
            )}

            {activeTab === 'nfc' && (
              <motion.div
                key="nfc"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <NFCStatus nfcAvailable={nfcAvailable}>
                  <NFCIcon scanning={nfcScanning} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {nfcAvailable ? 'NFC Available' : 'NFC Not Available'}
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                      {nfcScanning ? 'Scanning for NFC tags...' : 
                       nfcAvailable ? 'Ready to scan NFC tags' : 
                       'NFC not supported on this device'}
                    </div>
                  </div>
                </NFCStatus>
                
                <NFCHandler
                  available={nfcAvailable}
                  scanning={nfcScanning}
                  onScan={handleNFCTransaction}
                  account={hederaAccount}
                />
              </motion.div>
            )}

            {activeTab === 'tokens' && (
              <motion.div
                key="tokens"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TokenMinter
                  account={hederaAccount}
                  onMint={handleNFCTransaction}
                  connected={walletConnected}
                />
              </motion.div>
            )}

            {activeTab === 'connect' && (
              <motion.div
                key="connect"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <WalletConnect
                  onConnect={handleWalletConnect}
                  onDisconnect={handleWalletDisconnect}
                  connected={walletConnected}
                  account={hederaAccount}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <Card
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TransactionHistory
            transactions={transactions}
            account={hederaAccount}
            connected={walletConnected}
          />
        </Card>
      </MainContent>
    </AppContainer>
  );
}

export default App;
