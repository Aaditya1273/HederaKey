import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  Coins, 
  Shield, 
  ArrowUpDown, 
  Brain,
  Globe,
  Play,
  Pause,
  RotateCcw,
  Info,
  CheckCircle,
  Zap,
  TrendingUp,
  Wifi
} from 'lucide-react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const Title = styled.h1`
  color: white;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const DemoControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ControlButton = styled.button`
  padding: 10px 15px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }
  
  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 0.875rem;
  }
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px;
  gap: 15px;
  
  @media (max-width: 768px) {
    padding: 15px;
    gap: 10px;
    overflow-x: auto;
  }
`;

const Step = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 80px;
  cursor: pointer;
  
  @media (max-width: 768px) {
    min-width: 60px;
  }
`;

const StepIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${props => props.active ? 
    'linear-gradient(135deg, #10b981, #059669)' : 
    props.completed ? 
    'linear-gradient(135deg, #3b82f6, #1d4ed8)' :
    'rgba(255, 255, 255, 0.2)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.3s ease;
  border: 2px solid ${props => props.active ? '#10b981' : 'transparent'};
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }
`;

const StepLabel = styled.div`
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 0.625rem;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
  
  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const StepContent = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  
  @media (max-width: 768px) {
    padding: 25px;
    border-radius: 15px;
  }
`;

const StepTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const StepDescription = styled.p`
  color: #64748b;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 25px;
  
  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
`;

const ActionButton = styled(motion.button)`
  width: 100%;
  padding: 15px 25px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    padding: 12px 20px;
    font-size: 0.875rem;
  }
`;

const InfoPopup = styled(motion.div)`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 15px 20px;
  border-radius: 12px;
  max-width: 300px;
  font-size: 0.875rem;
  line-height: 1.5;
  z-index: 1000;
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
`;

const ProgressBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  z-index: 1000;
`;

const Progress = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
`;

const PriceDisplay = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  min-width: 200px;
  
  @media (max-width: 768px) {
    top: 70px;
    right: 10px;
    left: 10px;
    min-width: auto;
  }
`;

const PriceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const PriceLabel = styled.div`
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
`;

const PriceValue = styled.div`
  color: #1e293b;
  font-weight: 700;
  font-size: 0.875rem;
`;

const HackathonDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [showInfo, setShowInfo] = useState(true);
  const [prices, setPrices] = useState({});
  const [demoData, setDemoData] = useState({});

  const steps = [
    {
      id: 'nfc',
      title: 'NFC Tap',
      icon: Smartphone,
      description: 'Tap your NFC-enabled device to scan a tokenized real-world asset',
      info: 'This demonstrates how physical assets can be instantly digitized using NFC technology',
      action: 'Simulate NFC Tap'
    },
    {
      id: 'mint',
      title: 'Token Mint',
      icon: Coins,
      description: 'Mint HTS tokens representing ownership of the scanned asset',
      info: 'Hedera Token Service creates fungible tokens backed by real-world assets',
      action: 'Mint RWA Token'
    },
    {
      id: 'compliance',
      title: 'AI Compliance',
      icon: Shield,
      description: 'AI-powered fraud detection and compliance verification',
      info: 'Zero-knowledge proofs ensure privacy while maintaining regulatory compliance',
      action: 'Verify Compliance'
    },
    {
      id: 'swap',
      title: 'AMM Swap',
      icon: ArrowUpDown,
      description: 'Trade tokens on automated market maker with dynamic pricing',
      info: 'Decentralized exchange with real-time price discovery and liquidity pools',
      action: 'Execute Swap'
    },
    {
      id: 'ai',
      title: 'AI Analysis',
      icon: Brain,
      description: 'Advanced AI analysis for risk assessment and optimization',
      info: 'Machine learning models analyze transaction patterns for fraud detection',
      action: 'Run AI Analysis'
    },
    {
      id: 'depin',
      title: 'DePIN Network',
      icon: Globe,
      description: 'Decentralized infrastructure network processes and validates',
      info: 'Global network of relay nodes ensures decentralized and reliable processing',
      action: 'View Network'
    }
  ];

  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        if (currentStep < steps.length - 1) {
          nextStep();
        } else {
          setIsPlaying(false);
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isPlaying]);

  const loadPrices = async () => {
    try {
      const response = await fetch('/oracle/prices');
      if (response.ok) {
        const data = await response.json();
        setPrices(data);
      }
    } catch (error) {
      // Mock prices for demo
      setPrices({
        'HBAR/USD': { price: 0.0523, priceChangePercent: 2.3 },
        'BTC/USD': { price: 43250, priceChangePercent: -1.2 },
        'ETH/USD': { price: 2650, priceChangePercent: 0.8 }
      });
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setIsPlaying(false);
    setDemoData({});
  };

  const executeStepAction = async () => {
    const step = steps[currentStep];
    
    try {
      switch (step.id) {
        case 'nfc':
          await simulateNFCScan();
          break;
        case 'mint':
          await simulateTokenMint();
          break;
        case 'compliance':
          await simulateCompliance();
          break;
        case 'swap':
          await simulateSwap();
          break;
        case 'ai':
          await simulateAIAnalysis();
          break;
        case 'depin':
          await simulateDePINNetwork();
          break;
      }
      
      if (!isPlaying) {
        nextStep();
      }
    } catch (error) {
      console.error('Step execution error:', error);
    }
  };

  const simulateNFCScan = async () => {
    setDemoData(prev => ({
      ...prev,
      nfcData: {
        tagId: 'nfc_farm_001',
        assetType: 'FARM_SHARE',
        assetName: 'Organic Farm Share #001',
        valuation: 5000,
        verified: true
      }
    }));
  };

  const simulateTokenMint = async () => {
    setDemoData(prev => ({
      ...prev,
      tokenData: {
        tokenId: '0.0.123456',
        symbol: 'FARM001',
        totalSupply: 1000000,
        pricePerToken: 0.005
      }
    }));
  };

  const simulateCompliance = async () => {
    setDemoData(prev => ({
      ...prev,
      complianceData: {
        kycStatus: 'APPROVED',
        amlStatus: 'CLEARED',
        riskScore: 0.15,
        aiDecision: 'AUTO_APPROVE'
      }
    }));
  };

  const simulateSwap = async () => {
    setDemoData(prev => ({
      ...prev,
      swapData: {
        fromToken: 'FARM001',
        toToken: 'HBAR',
        amountIn: 1000,
        amountOut: 5.23,
        priceImpact: 0.02
      }
    }));
  };

  const simulateAIAnalysis = async () => {
    setDemoData(prev => ({
      ...prev,
      aiData: {
        fraudScore: 0.08,
        riskLevel: 'LOW',
        confidence: 0.94,
        processingTime: 287
      }
    }));
  };

  const simulateDePINNetwork = async () => {
    setDemoData(prev => ({
      ...prev,
      depinData: {
        relayNodes: 247,
        networkLatency: 125,
        uptime: 0.987,
        coverage: 'Global'
      }
    }));
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    const IconComponent = step.icon;
    
    return (
      <StepContent
        key={currentStep}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.5 }}
      >
        <StepTitle>
          <IconComponent size={32} />
          {step.title}
        </StepTitle>
        
        <StepDescription>
          {step.description}
        </StepDescription>
        
        {renderStepSpecificContent()}
        
        <ActionButton
          onClick={executeStepAction}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Zap size={20} />
          {step.action}
        </ActionButton>
      </StepContent>
    );
  };

  const renderStepSpecificContent = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'nfc':
        return demoData.nfcData ? (
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f0fdf4', borderRadius: '8px' }}>
            <div style={{ fontWeight: '600', color: '#059669', marginBottom: '8px' }}>
              ✓ NFC Asset Detected
            </div>
            <div>Asset: {demoData.nfcData.assetName}</div>
            <div>Value: ${demoData.nfcData.valuation.toLocaleString()}</div>
          </div>
        ) : null;
        
      case 'mint':
        return demoData.tokenData ? (
          <div style={{ marginBottom: '20px', padding: '15px', background: '#eff6ff', borderRadius: '8px' }}>
            <div style={{ fontWeight: '600', color: '#1d4ed8', marginBottom: '8px' }}>
              ✓ Token Minted Successfully
            </div>
            <div>Token ID: {demoData.tokenData.tokenId}</div>
            <div>Symbol: {demoData.tokenData.symbol}</div>
            <div>Supply: {demoData.tokenData.totalSupply.toLocaleString()}</div>
          </div>
        ) : null;
        
      case 'compliance':
        return demoData.complianceData ? (
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px' }}>
            <div style={{ fontWeight: '600', color: '#0284c7', marginBottom: '8px' }}>
              ✓ Compliance Verified
            </div>
            <div>KYC: {demoData.complianceData.kycStatus}</div>
            <div>AML: {demoData.complianceData.amlStatus}</div>
            <div>Risk Score: {demoData.complianceData.riskScore}</div>
          </div>
        ) : null;
        
      case 'swap':
        return demoData.swapData ? (
          <div style={{ marginBottom: '20px', padding: '15px', background: '#fefce8', borderRadius: '8px' }}>
            <div style={{ fontWeight: '600', color: '#ca8a04', marginBottom: '8px' }}>
              ✓ Swap Executed
            </div>
            <div>{demoData.swapData.amountIn} {demoData.swapData.fromToken} → {demoData.swapData.amountOut} {demoData.swapData.toToken}</div>
            <div>Price Impact: {(demoData.swapData.priceImpact * 100).toFixed(2)}%</div>
          </div>
        ) : null;
        
      case 'ai':
        return demoData.aiData ? (
          <div style={{ marginBottom: '20px', padding: '15px', background: '#fdf4ff', borderRadius: '8px' }}>
            <div style={{ fontWeight: '600', color: '#a21caf', marginBottom: '8px' }}>
              ✓ AI Analysis Complete
            </div>
            <div>Fraud Score: {demoData.aiData.fraudScore}</div>
            <div>Risk Level: {demoData.aiData.riskLevel}</div>
            <div>Processing: {demoData.aiData.processingTime}ms</div>
          </div>
        ) : null;
        
      case 'depin':
        return demoData.depinData ? (
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f0fdf4', borderRadius: '8px' }}>
            <div style={{ fontWeight: '600', color: '#059669', marginBottom: '8px' }}>
              ✓ DePIN Network Active
            </div>
            <div>Relay Nodes: {demoData.depinData.relayNodes}</div>
            <div>Latency: {demoData.depinData.networkLatency}ms</div>
            <div>Uptime: {(demoData.depinData.uptime * 100).toFixed(1)}%</div>
          </div>
        ) : null;
        
      default:
        return null;
    }
  };

  return (
    <Container>
      <Header>
        <Title>🚀 HederaKey Demo</Title>
        <DemoControls>
          <ControlButton onClick={togglePlay}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Pause' : 'Auto Play'}
          </ControlButton>
          <ControlButton onClick={resetDemo}>
            <RotateCcw size={16} />
            Reset
          </ControlButton>
          <ControlButton onClick={() => setShowInfo(!showInfo)}>
            <Info size={16} />
            Info
          </ControlButton>
        </DemoControls>
      </Header>

      <StepIndicator>
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          return (
            <Step
              key={step.id}
              onClick={() => goToStep(index)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <StepIcon
                active={index === currentStep}
                completed={completedSteps.has(index)}
              >
                {completedSteps.has(index) ? (
                  <CheckCircle size={24} />
                ) : (
                  <IconComponent size={24} />
                )}
              </StepIcon>
              <StepLabel>{step.title}</StepLabel>
            </Step>
          );
        })}
      </StepIndicator>

      <MainContent>
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>
      </MainContent>

      <AnimatePresence>
        {showInfo && (
          <InfoPopup
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>
              💡 {steps[currentStep].title}
            </div>
            {steps[currentStep].info}
          </InfoPopup>
        )}
      </AnimatePresence>

      <PriceDisplay>
        <div style={{ fontWeight: '600', marginBottom: '10px', color: '#1e293b' }}>
          📈 Live Prices
        </div>
        {Object.entries(prices).slice(0, 3).map(([pair, data]) => (
          <PriceItem key={pair}>
            <PriceLabel>{pair}</PriceLabel>
            <PriceValue style={{ 
              color: data.priceChangePercent > 0 ? '#10b981' : '#ef4444' 
            }}>
              ${typeof data.price === 'number' ? data.price.toFixed(data.price < 1 ? 4 : 0) : data.price}
            </PriceValue>
          </PriceItem>
        ))}
      </PriceDisplay>

      <ProgressBar>
        <Progress
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </ProgressBar>
    </Container>
  );
};

export default HackathonDemo;
