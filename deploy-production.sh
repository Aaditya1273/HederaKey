#!/bin/bash

# MindKey NFC (Hedera Edition) - Production Deployment Script
# Usage: ./deploy-production.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="mindkey-nfc"
VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting MindKey NFC Production Deployment"
echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"
echo "Timestamp: $TIMESTAMP"
echo "----------------------------------------"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check environment file
    if [ ! -f ".env.${ENVIRONMENT}" ]; then
        log_error "Environment file .env.${ENVIRONMENT} not found"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Backup current deployment
backup_current() {
    log_info "Creating backup of current deployment..."
    
    if [ -d "backups" ]; then
        mkdir -p backups
    fi
    
    # Backup database
    if docker-compose ps | grep -q postgres; then
        log_info "Backing up database..."
        docker-compose exec -T postgres pg_dump -U mindkey mindkey_prod > "backups/db_backup_${TIMESTAMP}.sql"
        log_success "Database backup created"
    fi
    
    # Backup application data
    if [ -d "data" ]; then
        tar -czf "backups/data_backup_${TIMESTAMP}.tar.gz" data/
        log_success "Data backup created"
    fi
}

# Build application
build_application() {
    log_info "Building application..."
    
    # Install dependencies
    log_info "Installing server dependencies..."
    npm ci --only=production
    
    # Install client dependencies and build
    log_info "Building client application..."
    cd client
    npm ci --only=production
    npm run build
    cd ..
    
    # Compile smart contracts
    log_info "Compiling smart contracts..."
    npm run compile
    
    log_success "Application build completed"
}

# Deploy smart contracts
deploy_contracts() {
    log_info "Deploying smart contracts to Hedera..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        npm run deploy:mainnet
    else
        npm run deploy:testnet
    fi
    
    log_success "Smart contracts deployed"
}

# Start services
start_services() {
    log_info "Starting services with Docker Compose..."
    
    # Copy environment file
    cp ".env.${ENVIRONMENT}" .env
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    log_success "Services started"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check API health
    for i in {1..10}; do
        if curl -f http://localhost:8080/health &> /dev/null; then
            log_success "API health check passed"
            break
        else
            log_warning "API health check failed, retrying... ($i/10)"
            sleep 10
        fi
        
        if [ $i -eq 10 ]; then
            log_error "API health check failed after 10 attempts"
            exit 1
        fi
    done
    
    # Check database
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U mindkey -d mindkey_prod &> /dev/null; then
        log_success "Database health check passed"
    else
        log_error "Database health check failed"
        exit 1
    fi
    
    # Check Redis
    if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping | grep -q PONG; then
        log_success "Redis health check passed"
    else
        log_error "Redis health check failed"
        exit 1
    fi
}

# Run integration tests
run_tests() {
    log_info "Running integration tests..."
    
    # Wait a bit more for services to be fully ready
    sleep 10
    
    # Run integration tests
    if node test-integration.js; then
        log_success "Integration tests passed"
    else
        log_error "Integration tests failed"
        exit 1
    fi
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring and logging..."
    
    # Check if monitoring services are running
    if docker-compose -f docker-compose.prod.yml ps | grep -q prometheus; then
        log_success "Prometheus is running"
    fi
    
    if docker-compose -f docker-compose.prod.yml ps | grep -q grafana; then
        log_success "Grafana is running"
    fi
    
    if docker-compose -f docker-compose.prod.yml ps | grep -q kibana; then
        log_success "Kibana is running"
    fi
    
    log_info "Monitoring setup completed"
}

# Cleanup old resources
cleanup() {
    log_info "Cleaning up old resources..."
    
    # Remove old Docker images
    docker image prune -f
    
    # Remove old backups (keep last 5)
    if [ -d "backups" ]; then
        ls -t backups/ | tail -n +6 | xargs -r rm -f
    fi
    
    log_success "Cleanup completed"
}

# Main deployment flow
main() {
    log_info "Starting deployment process..."
    
    check_prerequisites
    backup_current
    build_application
    
    if [ "$ENVIRONMENT" = "production" ]; then
        deploy_contracts
    fi
    
    start_services
    health_check
    run_tests
    setup_monitoring
    cleanup
    
    log_success "🎉 Deployment completed successfully!"
    log_info "Application is now running at:"
    log_info "  - Frontend: http://localhost"
    log_info "  - API: http://localhost:8080"
    log_info "  - Grafana: http://localhost:3001"
    log_info "  - Kibana: http://localhost:5601"
    
    # Show service status
    echo ""
    log_info "Service Status:"
    docker-compose -f docker-compose.prod.yml ps
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
