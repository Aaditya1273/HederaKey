import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { 
  Smartphone, 
  Wallet, 
  QrCode, 
  Copy, 
  ExternalLink,
  Plus,
  LogOut,
  Key
} from 'lucide-react';
import WalletConnectProvider from '@walletconnect/web3-provider';
import QRCodeModal from '@walletconnect/qrcode-modal';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ConnectionOptions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const OptionCard = styled(motion.button)`
  padding: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  
  &:hover {
    border-color: #4f46e5;
    box-shadow: 0 5px 15px rgba(79, 70, 229, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const OptionIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const OptionTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const OptionDescription = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
`;

const QRContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 30px;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
`;

const QRWrapper = styled.div`
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const ConnectedWallet = styled.div`
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 25px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const WalletInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const WalletDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const AccountId = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
`;

const WalletType = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const CreateWalletForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const Button = styled.button`
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(79, 70, 229, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const WalletConnect = ({ onConnect, onDisconnect, connected, account }) => {
  const [showQR, setShowQR] = useState(false);
  const [wcProvider, setWcProvider] = useState(null);
  const [wcUri, setWcUri] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (wcProvider) {
        wcProvider.disconnect();
      }
    };
  }, [wcProvider]);

  const initWalletConnect = async () => {
    try {
      setLoading(true);
      
      const provider = new WalletConnectProvider({
        rpc: {
          295: "https://testnet.hashio.io/api", // Hedera testnet
        },
        chainId: 295,
        qrcodeModal: QRCodeModal,
      });

      setWcProvider(provider);

      provider.connector.on("display_uri", (err, payload) => {
        const uri = payload.params[0];
        setWcUri(uri);
        setShowQR(true);
      });

      provider.connector.on("connect", (error, payload) => {
        if (error) {
          throw error;
        }
        
        const { accounts, chainId } = payload.params[0];
        toast.success('WalletConnect session established!');
        
        // For demo purposes, create a mock Hedera account
        const mockAccount = {
          accountId: `0.0.${Math.floor(Math.random() * 999999)}`,
          privateKey: 'mock-private-key-from-walletconnect',
          publicKey: 'mock-public-key-from-walletconnect',
          source: 'walletconnect'
        };
        
        onConnect(mockAccount);
        setShowQR(false);
      });

      provider.connector.on("disconnect", (error, payload) => {
        if (error) {
          throw error;
        }
        toast.info('WalletConnect session ended');
        onDisconnect();
      });

      await provider.enable();
      
    } catch (error) {
      console.error('WalletConnect error:', error);
      toast.error('Failed to connect via WalletConnect');
    } finally {
      setLoading(false);
    }
  };

  const createHederaWallet = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/createWallet');
      if (!response.ok) {
        throw new Error('Failed to create wallet');
      }
      
      const walletData = await response.json();
      
      const account = {
        accountId: walletData.accountId,
        privateKey: walletData.privateKey,
        publicKey: walletData.publicKey,
        source: 'hedera-sdk'
      };
      
      onConnect(account);
      toast.success('New Hedera wallet created!');
      setShowCreateForm(false);
      
    } catch (error) {
      console.error('Wallet creation error:', error);
      toast.error('Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  const importWallet = async () => {
    if (!privateKey.trim()) {
      toast.error('Please enter a private key');
      return;
    }

    try {
      setLoading(true);
      
      // In a real implementation, you would derive the account ID from the private key
      // For now, we'll create a mock account
      const account = {
        accountId: `0.0.${Math.floor(Math.random() * 999999)}`,
        privateKey: privateKey.trim(),
        publicKey: 'derived-public-key',
        source: 'imported'
      };
      
      onConnect(account);
      toast.success('Wallet imported successfully!');
      setShowCreateForm(false);
      setPrivateKey('');
      
    } catch (error) {
      console.error('Wallet import error:', error);
      toast.error('Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  const copyAccountId = () => {
    if (account?.accountId) {
      navigator.clipboard.writeText(account.accountId);
      toast.success('Account ID copied to clipboard');
    }
  };

  const viewOnExplorer = () => {
    if (account?.accountId) {
      window.open(`https://hashscan.io/testnet/account/${account.accountId}`, '_blank');
    }
  };

  if (connected && account) {
    return (
      <Container>
        <SectionTitle>
          <Wallet size={24} />
          Connected Wallet
        </SectionTitle>
        
        <ConnectedWallet>
          <WalletInfo>
            <WalletDetails>
              <AccountId>{account.accountId}</AccountId>
              <WalletType>
                {account.source === 'walletconnect' ? 'WalletConnect' : 
                 account.source === 'imported' ? 'Imported Wallet' : 
                 'Hedera SDK'}
              </WalletType>
            </WalletDetails>
            
            <ActionButtons>
              <ActionButton onClick={copyAccountId}>
                <Copy size={14} />
                Copy
              </ActionButton>
              <ActionButton onClick={viewOnExplorer}>
                <ExternalLink size={14} />
                Explorer
              </ActionButton>
              <ActionButton onClick={onDisconnect}>
                <LogOut size={14} />
                Disconnect
              </ActionButton>
            </ActionButtons>
          </WalletInfo>
        </ConnectedWallet>
      </Container>
    );
  }

  return (
    <Container>
      <SectionTitle>
        <Smartphone size={24} />
        Connect Wallet
      </SectionTitle>
      
      {!showQR && !showCreateForm && (
        <ConnectionOptions>
          <OptionCard
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={initWalletConnect}
            disabled={loading}
          >
            <OptionIcon>
              <QrCode size={24} />
            </OptionIcon>
            <OptionTitle>WalletConnect</OptionTitle>
            <OptionDescription>
              Connect using mobile wallet with QR code
            </OptionDescription>
          </OptionCard>
          
          <OptionCard
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateForm(true)}
            disabled={loading}
          >
            <OptionIcon>
              <Plus size={24} />
            </OptionIcon>
            <OptionTitle>Create Wallet</OptionTitle>
            <OptionDescription>
              Create new Hedera account or import existing
            </OptionDescription>
          </OptionCard>
        </ConnectionOptions>
      )}
      
      {showQR && wcUri && (
        <QRContainer>
          <h4>Scan with your mobile wallet</h4>
          <QRWrapper>
            <QRCode value={wcUri} size={200} />
          </QRWrapper>
          <p style={{ textAlign: 'center', color: '#64748b' }}>
            Open your WalletConnect-compatible mobile wallet and scan this QR code
          </p>
          <Button onClick={() => setShowQR(false)}>
            Cancel
          </Button>
        </QRContainer>
      )}
      
      {showCreateForm && (
        <CreateWalletForm>
          <h4>Wallet Options</h4>
          
          <Button onClick={createHederaWallet} disabled={loading}>
            <Plus size={16} />
            Create New Hedera Wallet
          </Button>
          
          <div style={{ textAlign: 'center', color: '#64748b' }}>or</div>
          
          <Input
            type="password"
            placeholder="Enter private key to import existing wallet"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
          />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button onClick={importWallet} disabled={loading || !privateKey.trim()}>
              <Key size={16} />
              Import Wallet
            </Button>
            <Button 
              onClick={() => {
                setShowCreateForm(false);
                setPrivateKey('');
              }}
              style={{ background: '#64748b' }}
            >
              Cancel
            </Button>
          </div>
        </CreateWalletForm>
      )}
    </Container>
  );
};

export default WalletConnect;
