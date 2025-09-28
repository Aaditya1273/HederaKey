import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Smartphone, 
  Coins, 
  Shield, 
  ArrowUpDown, 
  Brain,
  Globe,
  Menu,
  X
} from 'lucide-react';

// Import components
import HackathonDemo from './components/HackathonDemo';
import NFCSimulator from './components/NFCSimulator';
import AMMSwapInterface from './components/AMMSwapInterface';
import PrivacyDashboard from './components/PrivacyDashboard';
import DePINNetworkMap from './components/DePINNetworkMap';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Header = styled.header`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  
  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'flex' : 'none'};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.9);
    flex-direction: column;
    padding: 2rem;
    gap: 1rem;
  }
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const Main = styled.main`
  min-height: calc(100vh - 80px);
`;

const HomePage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  text-align: center;
  padding: 2rem;
  color: white;
`;

const Title = styled(motion.h1)`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled(motion.p)`
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  max-width: 600px;
`;

const CTAButton = styled(motion(Link))`
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
  }
`;

const FeatureGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1000px;
  margin: 4rem auto 0;
  padding: 0 2rem;
`;

const FeatureCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const FeatureIcon = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: white;
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const FeatureDescription = styled.p`
  opacity: 0.8;
  line-height: 1.5;
`;

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    // Check API status
    fetch('/health')
      .then(res => res.json())
      .then(() => setApiStatus('connected'))
      .catch(() => setApiStatus('disconnected'));
  }, []);

  const features = [
    {
      icon: Smartphone,
      title: 'NFC Tokenization',
      description: 'Tap your phone to instantly tokenize real-world assets'
    },
    {
      icon: Shield,
      title: 'AI Fraud Detection',
      description: '99.2% accuracy with zero-knowledge privacy protection'
    },
    {
      icon: Globe,
      title: 'DePIN Network',
      description: '247 relay nodes across 20 cities for global coverage'
    },
    {
      icon: ArrowUpDown,
      title: 'AMM Trading',
      description: 'Trade tokenized assets with instant liquidity'
    }
  ];

  return (
    <Router>
      <AppContainer>
        <Header>
          <Nav>
            <Logo to="/">
              🚀 HederaKey
            </Logo>
            
            <NavLinks isOpen={isMenuOpen}>
              <NavLink to="/" onClick={() => setIsMenuOpen(false)}>
                <Home size={18} />
                Home
              </NavLink>
              <NavLink to="/demo" onClick={() => setIsMenuOpen(false)}>
                <Smartphone size={18} />
                Demo
              </NavLink>
              <NavLink to="/nfc" onClick={() => setIsMenuOpen(false)}>
                <Coins size={18} />
                NFC Scan
              </NavLink>
              <NavLink to="/swap" onClick={() => setIsMenuOpen(false)}>
                <ArrowUpDown size={18} />
                AMM Swap
              </NavLink>
              <NavLink to="/privacy" onClick={() => setIsMenuOpen(false)}>
                <Shield size={18} />
                Privacy
              </NavLink>
              <NavLink to="/network" onClick={() => setIsMenuOpen(false)}>
                <Globe size={18} />
                DePIN
              </NavLink>
            </NavLinks>
            
            <MobileMenuButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </MobileMenuButton>
          </Nav>
        </Header>

        <Main>
          <Routes>
            <Route path="/" element={
              <HomePage>
                <Title
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  Unlock the Future of Asset Ownership
                </Title>
                
                <Subtitle
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  Bridge physical and digital worlds through NFC technology, 
                  AI-powered fraud detection, and decentralized infrastructure on Hedera
                </Subtitle>
                
                <CTAButton
                  to="/demo"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Brain size={20} />
                  Try Live Demo
                </CTAButton>
                
                <FeatureGrid
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  {features.map((feature, index) => (
                    <FeatureCard
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <FeatureIcon>
                        <feature.icon size={24} />
                      </FeatureIcon>
                      <FeatureTitle>{feature.title}</FeatureTitle>
                      <FeatureDescription>{feature.description}</FeatureDescription>
                    </FeatureCard>
                  ))}
                </FeatureGrid>
                
                <div style={{ 
                  position: 'fixed', 
                  bottom: '20px', 
                  right: '20px',
                  background: apiStatus === 'connected' ? '#10b981' : '#ef4444',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  API: {apiStatus}
                </div>
              </HomePage>
            } />
            
            <Route path="/demo" element={<HackathonDemo />} />
            <Route path="/nfc" element={<NFCSimulator />} />
            <Route path="/swap" element={<AMMSwapInterface />} />
            <Route path="/privacy" element={<PrivacyDashboard />} />
            <Route path="/network" element={<DePINNetworkMap />} />
          </Routes>
        </Main>
      </AppContainer>
    </Router>
  );
}

export default App;
