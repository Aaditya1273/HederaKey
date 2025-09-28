#!/usr/bin/env python3
"""
MindKey NFC - AI Fraud Detection Pipeline
Real-time fraud scoring with privacy-preserving features
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score
import joblib
import json
import hashlib
import time
from datetime import datetime, timedelta
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FraudDetectionEngine:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'transaction_amount', 'hour_of_day', 'day_of_week',
            'user_age_days', 'previous_transactions', 'avg_transaction_amount',
            'location_risk_score', 'device_risk_score', 'velocity_score',
            'behavioral_score', 'time_since_last_tx', 'amount_deviation'
        ]
        self.load_or_train_model()
    
    def generate_synthetic_data(self, n_samples=10000):
        """Generate synthetic fraud detection training data"""
        np.random.seed(42)
        
        # Normal transactions (80%)
        normal_samples = int(n_samples * 0.8)
        normal_data = {
            'transaction_amount': np.random.lognormal(3, 1, normal_samples),
            'hour_of_day': np.random.choice(range(6, 23), normal_samples),  # Business hours
            'day_of_week': np.random.choice(range(1, 6), normal_samples),   # Weekdays
            'user_age_days': np.random.normal(365, 200, normal_samples),
            'previous_transactions': np.random.poisson(50, normal_samples),
            'location_risk_score': np.random.beta(2, 8, normal_samples),    # Low risk
            'device_risk_score': np.random.beta(2, 8, normal_samples),
            'velocity_score': np.random.beta(2, 8, normal_samples),
            'behavioral_score': np.random.beta(8, 2, normal_samples),       # High trust
            'is_fraud': np.zeros(normal_samples)
        }
        
        # Fraudulent transactions (20%)
        fraud_samples = n_samples - normal_samples
        fraud_data = {
            'transaction_amount': np.random.lognormal(5, 2, fraud_samples),  # Higher amounts
            'hour_of_day': np.random.choice(range(24), fraud_samples),       # Any time
            'day_of_week': np.random.choice(range(7), fraud_samples),        # Any day
            'user_age_days': np.random.normal(30, 50, fraud_samples),        # New accounts
            'previous_transactions': np.random.poisson(5, fraud_samples),    # Few transactions
            'location_risk_score': np.random.beta(8, 2, fraud_samples),      # High risk
            'device_risk_score': np.random.beta(8, 2, fraud_samples),
            'velocity_score': np.random.beta(8, 2, fraud_samples),           # High velocity
            'behavioral_score': np.random.beta(2, 8, fraud_samples),         # Low trust
            'is_fraud': np.ones(fraud_samples)
        }
        
        # Combine datasets
        data = {}
        for key in normal_data.keys():
            data[key] = np.concatenate([normal_data[key], fraud_data[key]])
        
        # Add derived features
        data['avg_transaction_amount'] = data['transaction_amount'] * np.random.normal(1, 0.3, n_samples)
        data['time_since_last_tx'] = np.random.exponential(24, n_samples)  # Hours
        data['amount_deviation'] = np.abs(data['transaction_amount'] - data['avg_transaction_amount'])
        
        return pd.DataFrame(data)
    
    def train_model(self):
        """Train the fraud detection model"""
        logger.info("Generating training data...")
        df = self.generate_synthetic_data()
        
        # Prepare features
        X = df[self.feature_columns]
        y = df['is_fraud']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train ensemble model
        logger.info("Training fraud detection model...")
        rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        gb_model = GradientBoostingClassifier(n_estimators=100, random_state=42)
        
        rf_model.fit(X_train_scaled, y_train)
        gb_model.fit(X_train_scaled, y_train)
        
        # Ensemble predictions
        rf_pred = rf_model.predict_proba(X_test_scaled)[:, 1]
        gb_pred = gb_model.predict_proba(X_test_scaled)[:, 1]
        ensemble_pred = (rf_pred + gb_pred) / 2
        
        # Evaluate
        binary_pred = (ensemble_pred > 0.5).astype(int)
        accuracy = accuracy_score(y_test, binary_pred)
        precision = precision_score(y_test, binary_pred)
        recall = recall_score(y_test, binary_pred)
        
        logger.info(f"Model Performance - Accuracy: {accuracy:.3f}, Precision: {precision:.3f}, Recall: {recall:.3f}")
        
        # Store models
        self.model = {
            'rf': rf_model,
            'gb': gb_model,
            'scaler': self.scaler
        }
        
        # Save model
        joblib.dump(self.model, 'models/fraud_detection_model.pkl')
        logger.info("Model saved successfully")
    
    def load_or_train_model(self):
        """Load existing model or train new one"""
        try:
            self.model = joblib.load('models/fraud_detection_model.pkl')
            self.scaler = self.model['scaler']
            logger.info("Loaded existing fraud detection model")
        except FileNotFoundError:
            logger.info("No existing model found, training new model...")
            self.train_model()
    
    def extract_features(self, transaction_data, user_history=None):
        """Extract features from transaction data"""
        features = {}
        
        # Basic transaction features
        features['transaction_amount'] = float(transaction_data.get('amount', 0))
        features['hour_of_day'] = datetime.now().hour
        features['day_of_week'] = datetime.now().weekday()
        
        # User features
        if user_history:
            features['user_age_days'] = user_history.get('account_age_days', 1)
            features['previous_transactions'] = user_history.get('transaction_count', 0)
            features['avg_transaction_amount'] = user_history.get('avg_amount', features['transaction_amount'])
        else:
            features['user_age_days'] = 1
            features['previous_transactions'] = 0
            features['avg_transaction_amount'] = features['transaction_amount']
        
        # Risk scores (normally computed from external services)
        features['location_risk_score'] = self._compute_location_risk(transaction_data)
        features['device_risk_score'] = self._compute_device_risk(transaction_data)
        features['velocity_score'] = self._compute_velocity_risk(transaction_data, user_history)
        features['behavioral_score'] = self._compute_behavioral_score(transaction_data, user_history)
        
        # Derived features
        features['time_since_last_tx'] = user_history.get('hours_since_last_tx', 24) if user_history else 24
        features['amount_deviation'] = abs(features['transaction_amount'] - features['avg_transaction_amount'])
        
        return features
    
    def _compute_location_risk(self, transaction_data):
        """Compute location-based risk score"""
        # Mock implementation - in reality, use IP geolocation, known fraud locations, etc.
        location = transaction_data.get('location', {})
        if location.get('country') in ['NG', 'KE', 'GH', 'ZA']:  # African countries - lower risk
            return np.random.beta(2, 8)  # Low risk
        return np.random.beta(5, 5)  # Medium risk
    
    def _compute_device_risk(self, transaction_data):
        """Compute device-based risk score"""
        device_info = transaction_data.get('deviceInfo', {})
        user_agent = device_info.get('userAgent', '')
        
        # Check for suspicious patterns
        if 'Mobile' in user_agent and 'Android' in user_agent:
            return np.random.beta(2, 8)  # Mobile devices - lower risk
        return np.random.beta(4, 6)  # Desktop - medium risk
    
    def _compute_velocity_risk(self, transaction_data, user_history):
        """Compute transaction velocity risk"""
        if not user_history:
            return 0.1  # New user, low velocity
        
        recent_tx_count = user_history.get('recent_tx_count', 0)
        if recent_tx_count > 10:  # High velocity
            return np.random.beta(8, 2)
        return np.random.beta(2, 8)  # Normal velocity
    
    def _compute_behavioral_score(self, transaction_data, user_history):
        """Compute behavioral trust score"""
        if not user_history:
            return 0.5  # Neutral for new users
        
        # Mock behavioral analysis
        return np.random.beta(6, 4)  # Generally trustworthy
    
    def predict_fraud(self, transaction_data, user_history=None):
        """Predict fraud probability for a transaction"""
        start_time = time.time()
        
        # Extract features
        features = self.extract_features(transaction_data, user_history)
        
        # Convert to DataFrame
        feature_df = pd.DataFrame([features])[self.feature_columns]
        
        # Scale features
        feature_scaled = self.scaler.transform(feature_df)
        
        # Predict using ensemble
        rf_prob = self.model['rf'].predict_proba(feature_scaled)[0, 1]
        gb_prob = self.model['gb'].predict_proba(feature_scaled)[0, 1]
        fraud_probability = (rf_prob + gb_prob) / 2
        
        # Determine risk level and decision
        if fraud_probability < 0.3:
            risk_level = 'LOW'
            decision = 'APPROVE'
        elif fraud_probability < 0.7:
            risk_level = 'MEDIUM'
            decision = 'REVIEW'
        else:
            risk_level = 'HIGH'
            decision = 'BLOCK'
        
        processing_time = (time.time() - start_time) * 1000  # ms
        
        return {
            'riskScore': round(fraud_probability, 3),
            'riskLevel': risk_level,
            'decision': decision,
            'confidence': round(max(fraud_probability, 1 - fraud_probability), 3),
            'processingTime': f"{processing_time:.0f}ms",
            'features': {
                'behavioralScore': round(features['behavioral_score'], 3),
                'locationScore': round(1 - features['location_risk_score'], 3),  # Invert for display
                'deviceScore': round(1 - features['device_risk_score'], 3),
                'velocityScore': round(1 - features['velocity_score'], 3)
            },
            'timestamp': datetime.now().isoformat()
        }

# Global instance
fraud_detector = FraudDetectionEngine()

def analyze_transaction(transaction_data, user_history=None):
    """Main function to analyze transaction for fraud"""
    return fraud_detector.predict_fraud(transaction_data, user_history)

if __name__ == "__main__":
    # Test the fraud detection system
    test_transaction = {
        'amount': 1000,
        'type': 'transfer',
        'timestamp': datetime.now().isoformat(),
        'location': {'country': 'NG'},
        'deviceInfo': {'userAgent': 'Mozilla/5.0 (Mobile; Android)'}
    }
    
    test_history = {
        'account_age_days': 30,
        'transaction_count': 15,
        'avg_amount': 500,
        'recent_tx_count': 2,
        'hours_since_last_tx': 6
    }
    
    result = analyze_transaction(test_transaction, test_history)
    print("Fraud Detection Result:")
    print(json.dumps(result, indent=2))
