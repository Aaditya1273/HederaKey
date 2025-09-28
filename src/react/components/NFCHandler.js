import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Nfc, 
  Play, 
  Square, 
  Zap, 
  Shield, 
  Wifi,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const NFCControls = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
`;

const ControlButton = styled(motion.button)`
  padding: 15px 20px;
  border: 2px solid ${props => props.variant === 'start' ? '#10b981' : '#ef4444'};
  border-radius: 12px;
  background: ${props => props.variant === 'start' ? 
    'linear-gradient(135deg, #10b981, #059669)' : 
    'linear-gradient(135deg, #ef4444, #dc2626)'};
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px ${props => props.variant === 'start' ? 
      'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ScanningIndicator = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 12px;
  color: white;
  text-align: center;
`;

const PulsingNFC = styled(motion.div)`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }
`;

const NFCSettings = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e2e8f0;
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const SettingLabel = styled.div`
  font-weight: 600;
  color: #374151;
`;

const SettingValue = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
`;

const Toggle = styled.button`
  width: 48px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: ${props => props.active ? '#10b981' : '#d1d5db'};
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    top: 2px;
    left: ${props => props.active ? '26px' : '2px'};
    transition: all 0.3s ease;
  }
`;

const SecurityBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${props => props.secure ? 
    'linear-gradient(135deg, #10b981, #059669)' : 
    'linear-gradient(135deg, #f59e0b, #d97706)'};
  color: white;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
`;

const TransactionPreview = styled.div`
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
`;

const PreviewItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
  
  &:last-child {
    border-bottom: none;
    font-weight: 600;
  }
`;

const NFCHandler = ({ available, scanning, onScan, account }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [ndefReader, setNdefReader] = useState(null);
  const [sslEnabled, setSslEnabled] = useState(true);
  const [whitelistEnabled, setWhitelistEnabled] = useState(true);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [lastScanData, setLastScanData] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const abortController = useRef(null);

  useEffect(() => {
    if (available && 'NDEFReader' in window) {
      const reader = new window.NDEFReader();
      setNdefReader(reader);
    }
    
    return () => {
      stopScanning();
    };
  }, [available]);

  const startScanning = async () => {
    if (!ndefReader || !account) {
      toast.error('NFC not available or wallet not connected');
      return;
    }

    try {
      setIsScanning(true);
      abortController.current = new AbortController();
      
      await ndefReader.scan({ signal: abortController.current.signal });
      
      ndefReader.addEventListener('reading', handleNFCRead);
      ndefReader.addEventListener('readingerror', handleNFCError);
      
      toast.success('NFC scanning started');
      
    } catch (error) {
      console.error('NFC scan error:', error);
      toast.error('Failed to start NFC scanning');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    
    if (ndefReader) {
      ndefReader.removeEventListener('reading', handleNFCRead);
      ndefReader.removeEventListener('readingerror', handleNFCError);
    }
    
    setIsScanning(false);
    toast.info('NFC scanning stopped');
  };

  const handleNFCRead = async (event) => {
    try {
      const { message, serialNumber } = event;
      
      // Security check: whitelist validation
      if (whitelistEnabled && !isWhitelisted(serialNumber)) {
        toast.error('NFC tag not whitelisted');
        return;
      }
      
      // Parse NFC data
      const nfcData = parseNFCMessage(message);
      
      if (!nfcData) {
        toast.error('Invalid NFC data format');
        return;
      }
      
      // Decrypt if encryption is enabled
      let transactionData = nfcData;
      if (encryptionEnabled && nfcData.encrypted) {
        transactionData = await decryptNFCData(nfcData);
      }
      
      // Validate transaction data size (828 byte limit)
      const dataSize = JSON.stringify(transactionData).length;
      if (dataSize > 828) {
        toast.error('NFC data exceeds 828 byte limit');
        return;
      }
      
      setLastScanData(transactionData);
      
      // Add to scan history
      const scanRecord = {
        timestamp: new Date().toISOString(),
        serialNumber,
        data: transactionData,
        size: dataSize
      };
      
      setScanHistory(prev => [scanRecord, ...prev.slice(0, 4)]);
      
      // Process transaction
      await processNFCTransaction(transactionData);
      
    } catch (error) {
      console.error('NFC read error:', error);
      toast.error('Failed to process NFC tag');
    }
  };

  const handleNFCError = (error) => {
    console.error('NFC reading error:', error);
    toast.error('NFC reading error occurred');
  };

  const parseNFCMessage = (message) => {
    try {
      // Parse NDEF message records
      for (const record of message.records) {
        if (record.recordType === 'text') {
          const textDecoder = new TextDecoder(record.encoding);
          const text = textDecoder.decode(record.data);
          
          // Try to parse as JSON (Hedera transaction data)
          try {
            return JSON.parse(text);
          } catch {
            // If not JSON, treat as simple text command
            return parseTextCommand(text);
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error parsing NFC message:', error);
      return null;
    }
  };

  const parseTextCommand = (text) => {
    // Parse simple text commands from NFC
    const commands = {
      'BALANCE': { type: 'balance' },
      'SEND_1_HBAR': { type: 'transfer', amount: '1', destination: '0.0.123456' },
      'MINT_NFT': { type: 'mint', tokenName: 'NFC Token', symbol: 'NFT', supply: '1' },
      'CREATE_ACCOUNT': { type: 'create' }
    };
    
    return commands[text.toUpperCase()] || null;
  };

  const isWhitelisted = (serialNumber) => {
    // In a real implementation, check against a whitelist database
    const whitelist = [
      '04:12:34:56:78:90:AB',
      '04:AB:CD:EF:12:34:56',
      // Add more whitelisted NFC tag serial numbers
    ];
    
    return whitelist.includes(serialNumber);
  };

  const decryptNFCData = async (encryptedData) => {
    // Placeholder for NFC data decryption
    // In a real implementation, use proper encryption/decryption
    try {
      // Simulate decryption process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        ...encryptedData,
        encrypted: false,
        decrypted: true
      };
    } catch (error) {
      throw new Error('Failed to decrypt NFC data');
    }
  };

  const processNFCTransaction = async (transactionData) => {
    try {
      toast.loading('Processing NFC transaction...');
      
      // Add SSL verification if enabled
      if (sslEnabled) {
        // Verify SSL connection
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
          throw new Error('SSL connection required');
        }
      }
      
      // Process the transaction via the onScan callback
      await onScan(transactionData);
      
      toast.dismiss();
      toast.success('NFC transaction completed successfully');
      
    } catch (error) {
      toast.dismiss();
      toast.error(`Transaction failed: ${error.message}`);
    }
  };

  const writeNFCTag = async (data) => {
    if (!ndefReader) {
      toast.error('NFC not available');
      return;
    }

    try {
      // Ensure data fits within 828 byte limit
      const dataString = JSON.stringify(data);
      if (dataString.length > 828) {
        toast.error('Data exceeds 828 byte NFC limit');
        return;
      }

      const message = {
        records: [{
          recordType: "text",
          data: dataString
        }]
      };

      await ndefReader.write(message);
      toast.success('NFC tag written successfully');
      
    } catch (error) {
      console.error('NFC write error:', error);
      toast.error('Failed to write NFC tag');
    }
  };

  if (!available) {
    return (
      <Container>
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#64748b',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '2px dashed #cbd5e1'
        }}>
          <AlertTriangle size={48} style={{ marginBottom: '20px', color: '#f59e0b' }} />
          <h3>NFC Not Available</h3>
          <p>NFC is not supported on this device or browser.</p>
          <p>Try using a mobile device with NFC capability.</p>
        </div>
      </Container>
    );
  }

  if (!account) {
    return (
      <Container>
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#64748b',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '2px dashed #cbd5e1'
        }}>
          <Wifi size={48} style={{ marginBottom: '20px', color: '#3b82f6' }} />
          <h3>Wallet Required</h3>
          <p>Please connect a wallet to use NFC features.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <NFCControls>
        <ControlButton
          variant="start"
          onClick={startScanning}
          disabled={isScanning}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Play size={20} />
          Start Scanning
        </ControlButton>
        
        <ControlButton
          variant="stop"
          onClick={stopScanning}
          disabled={!isScanning}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Square size={20} />
          Stop Scanning
        </ControlButton>
      </NFCControls>

      <AnimatePresence>
        {isScanning && (
          <ScanningIndicator
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <PulsingNFC>
              <Nfc size={40} />
            </PulsingNFC>
            <div>
              <h3>Scanning for NFC Tags</h3>
              <p>Hold your device near an NFC tag to read transaction data</p>
            </div>
          </ScanningIndicator>
        )}
      </AnimatePresence>

      <NFCSettings>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <Settings size={20} />
          <h4>Security Settings</h4>
        </div>
        
        <SettingRow>
          <div>
            <SettingLabel>SSL Encryption</SettingLabel>
            <SettingValue>Secure communication required</SettingValue>
          </div>
          <Toggle active={sslEnabled} onClick={() => setSslEnabled(!sslEnabled)} />
        </SettingRow>
        
        <SettingRow>
          <div>
            <SettingLabel>NFC Whitelisting</SettingLabel>
            <SettingValue>Only allow trusted NFC tags</SettingValue>
          </div>
          <Toggle active={whitelistEnabled} onClick={() => setWhitelistEnabled(!whitelistEnabled)} />
        </SettingRow>
        
        <SettingRow>
          <div>
            <SettingLabel>Data Encryption</SettingLabel>
            <SettingValue>Encrypt NFC payload data</SettingValue>
          </div>
          <Toggle active={encryptionEnabled} onClick={() => setEncryptionEnabled(!encryptionEnabled)} />
        </SettingRow>
        
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <SecurityBadge secure={sslEnabled && whitelistEnabled && encryptionEnabled}>
            {sslEnabled && whitelistEnabled && encryptionEnabled ? (
              <>
                <Shield size={16} />
                Secure
              </>
            ) : (
              <>
                <AlertTriangle size={16} />
                Review Settings
              </>
            )}
          </SecurityBadge>
          
          <SecurityBadge secure={true}>
            <Zap size={16} />
            828 Byte Limit
          </SecurityBadge>
        </div>
      </NFCSettings>

      {lastScanData && (
        <TransactionPreview>
          <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={20} color="#10b981" />
            Last NFC Transaction
          </h4>
          
          <PreviewItem>
            <span>Type:</span>
            <span>{lastScanData.type}</span>
          </PreviewItem>
          
          {lastScanData.amount && (
            <PreviewItem>
              <span>Amount:</span>
              <span>{lastScanData.amount} HBAR</span>
            </PreviewItem>
          )}
          
          {lastScanData.destination && (
            <PreviewItem>
              <span>Destination:</span>
              <span>{lastScanData.destination}</span>
            </PreviewItem>
          )}
          
          {lastScanData.tokenName && (
            <PreviewItem>
              <span>Token:</span>
              <span>{lastScanData.tokenName} ({lastScanData.symbol})</span>
            </PreviewItem>
          )}
          
          <PreviewItem>
            <span>Data Size:</span>
            <span>{JSON.stringify(lastScanData).length} bytes</span>
          </PreviewItem>
        </TransactionPreview>
      )}
    </Container>
  );
};

export default NFCHandler;
