import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  Wifi, 
  Zap, 
  CheckCircle,
  AlertCircle,
  Loader,
  Radio,
  Waves
} from 'lucide-react';

const ripple = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-height: 400px;
  position: relative;
`;

const NFCArea = styled(motion.div)`
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'scanning': return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
      case 'success': return 'linear-gradient(135deg, #10b981, #059669)';
      case 'error': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      default: return 'linear-gradient(135deg, #64748b, #475569)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: ${props => props.status === 'scanning' ? pulse : 'none'} 2s infinite;
  
  &:hover {
    transform: scale(1.05);
  }
  
  @media (max-width: 768px) {
    width: 150px;
    height: 150px;
  }
`;

const RippleEffect = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  animation: ${ripple} 1.5s infinite;
  
  &:nth-child(2) {
    animation-delay: 0.5s;
  }
  
  &:nth-child(3) {
    animation-delay: 1s;
  }
`;

const NFCIcon = styled.div`
  color: white;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const StatusText = styled.div`
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const Instructions = styled(motion.div)`
  text-align: center;
  margin-top: 30px;
  max-width: 400px;
`;

const InstructionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 10px;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const InstructionText = styled.p`
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 20px;
`;

const AssetPreview = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #e2e8f0;
  margin-top: 20px;
  width: 100%;
  max-width: 350px;
`;

const AssetHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
`;

const AssetIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const AssetInfo = styled.div`
  flex: 1;
`;

const AssetName = styled.div`
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
`;

const AssetType = styled.div`
  color: #64748b;
  font-size: 0.875rem;
`;

const AssetDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 15px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DetailLabel = styled.div`
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
`;

const DetailValue = styled.div`
  color: #1e293b;
  font-weight: 600;
  font-size: 0.875rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  width: 100%;
`;

const ActionButton = styled(motion.button)`
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &.primary {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    color: white;
  }
  
  &.secondary {
    background: #f1f5f9;
    color: #64748b;
    border: 2px solid #e2e8f0;
  }
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const WaveAnimation = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  pointer-events: none;
  
  @media (max-width: 768px) {
    width: 250px;
    height: 250px;
  }
`;

const Wave = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #3b82f6;
  opacity: 0.3;
`;

const NFCSimulator = ({ onScanComplete, onAssetSelect }) => {
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, success, error
  const [scannedAsset, setScannedAsset] = useState(null);
  const [showWaves, setShowWaves] = useState(false);

  const mockAssets = [
    {
      id: 'farm_001',
      name: 'Organic Farm Share #001',
      type: 'FARM_SHARE',
      valuation: 5000,
      location: 'California, USA',
      verified: true,
      nfcId: 'nfc_farm_001'
    },
    {
      id: 'real_estate_001',
      name: 'Downtown Apartment Unit',
      type: 'REAL_ESTATE',
      valuation: 250000,
      location: 'New York, NY',
      verified: true,
      nfcId: 'nfc_re_001'
    },
    {
      id: 'carbon_001',
      name: 'Carbon Credit Certificate',
      type: 'CARBON_CREDIT',
      valuation: 850,
      location: 'Amazon Rainforest',
      verified: true,
      nfcId: 'nfc_carbon_001'
    }
  ];

  const handleNFCTap = async () => {
    if (scanStatus === 'scanning') return;
    
    setScanStatus('scanning');
    setShowWaves(true);
    
    // Simulate NFC scanning delay
    setTimeout(() => {
      const randomAsset = mockAssets[Math.floor(Math.random() * mockAssets.length)];
      setScannedAsset(randomAsset);
      setScanStatus('success');
      setShowWaves(false);
      
      if (onScanComplete) {
        onScanComplete(randomAsset);
      }
    }, 2000);
  };

  const handleAssetConfirm = () => {
    if (onAssetSelect && scannedAsset) {
      onAssetSelect(scannedAsset);
    }
  };

  const handleRescan = () => {
    setScanStatus('idle');
    setScannedAsset(null);
    setShowWaves(false);
  };

  const getStatusIcon = () => {
    switch (scanStatus) {
      case 'scanning':
        return <Loader size={32} className="animate-spin" />;
      case 'success':
        return <CheckCircle size={32} />;
      case 'error':
        return <AlertCircle size={32} />;
      default:
        return <Radio size={32} />;
    }
  };

  const getStatusText = () => {
    switch (scanStatus) {
      case 'scanning':
        return 'Scanning...';
      case 'success':
        return 'Asset Found!';
      case 'error':
        return 'Scan Failed';
      default:
        return 'Tap to Scan';
    }
  };

  const getInstructions = () => {
    switch (scanStatus) {
      case 'idle':
        return {
          title: '📱 Ready to Scan',
          text: 'Tap the NFC area above to simulate scanning a real-world asset with your mobile device.'
        };
      case 'scanning':
        return {
          title: '🔍 Scanning NFC Tag',
          text: 'Hold your device steady while we read the asset information from the NFC chip.'
        };
      case 'success':
        return {
          title: '✅ Asset Detected',
          text: 'Successfully scanned asset! Review the details below and confirm to proceed with tokenization.'
        };
      case 'error':
        return {
          title: '❌ Scan Failed',
          text: 'Unable to read NFC tag. Please try again or check if the tag is properly positioned.'
        };
      default:
        return { title: '', text: '' };
    }
  };

  return (
    <Container>
      <NFCArea
        status={scanStatus}
        onClick={handleNFCTap}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {scanStatus === 'scanning' && (
          <>
            <RippleEffect />
            <RippleEffect />
            <RippleEffect />
          </>
        )}
        
        <NFCIcon>
          {getStatusIcon()}
          <StatusText>{getStatusText()}</StatusText>
        </NFCIcon>
      </NFCArea>

      {showWaves && (
        <WaveAnimation>
          {[...Array(3)].map((_, i) => (
            <Wave
              key={i}
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4
              }}
            />
          ))}
        </WaveAnimation>
      )}

      <Instructions
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <InstructionTitle>{getInstructions().title}</InstructionTitle>
        <InstructionText>{getInstructions().text}</InstructionText>
      </Instructions>

      <AnimatePresence>
        {scannedAsset && scanStatus === 'success' && (
          <AssetPreview
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <AssetHeader>
              <AssetIcon>
                {scannedAsset.type === 'FARM_SHARE' && '🌾'}
                {scannedAsset.type === 'REAL_ESTATE' && '🏠'}
                {scannedAsset.type === 'CARBON_CREDIT' && '🌱'}
              </AssetIcon>
              <AssetInfo>
                <AssetName>{scannedAsset.name}</AssetName>
                <AssetType>{scannedAsset.type.replace('_', ' ')}</AssetType>
              </AssetInfo>
              {scannedAsset.verified && (
                <CheckCircle size={20} color="#10b981" />
              )}
            </AssetHeader>

            <AssetDetails>
              <DetailItem>
                <DetailLabel>Valuation</DetailLabel>
                <DetailValue>${scannedAsset.valuation.toLocaleString()}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Location</DetailLabel>
                <DetailValue>{scannedAsset.location}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>NFC ID</DetailLabel>
                <DetailValue>{scannedAsset.nfcId}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Status</DetailLabel>
                <DetailValue style={{ color: '#10b981' }}>
                  {scannedAsset.verified ? 'Verified' : 'Pending'}
                </DetailValue>
              </DetailItem>
            </AssetDetails>

            <ActionButtons>
              <ActionButton
                className="secondary"
                onClick={handleRescan}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Radio size={16} />
                Rescan
              </ActionButton>
              <ActionButton
                className="primary"
                onClick={handleAssetConfirm}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Zap size={16} />
                Tokenize
              </ActionButton>
            </ActionButtons>
          </AssetPreview>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default NFCSimulator;
