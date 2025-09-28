import requests
import json
from datetime import datetime

def hedera_proxy_query(account_id=None, transaction_id=None, query_type="account"):
    """
    Enhanced Hedera Mirror Node proxy with multiple query types
    """
    base_url = "https://testnet.mirrornode.hedera.com/api/v1"
    
    print(f"🌐 Hedera Mirror Node Proxy - Query Type: {query_type}")
    
    try:
        if query_type == "account" and account_id:
            # Account information query
            url = f"{base_url}/accounts/{account_id}"
            response = requests.get(url)
            response.raise_for_status()
            
            account_data = response.json()
            
            # Enhanced account information
            enhanced_data = {
                'query_type': 'account',
                'account_id': account_id,
                'balance': {
                    'hbar': account_data.get('balance', {}).get('balance', '0'),
                    'tokens': account_data.get('balance', {}).get('tokens', [])
                },
                'account_info': {
                    'created_timestamp': account_data.get('created_timestamp'),
                    'expiry_timestamp': account_data.get('expiry_timestamp'),
                    'auto_renew_period': account_data.get('auto_renew_period'),
                    'key': account_data.get('key'),
                    'deleted': account_data.get('deleted', False)
                },
                'staking_info': account_data.get('staking_info'),
                'metadata': {
                    'network': 'testnet',
                    'query_timestamp': datetime.now().isoformat(),
                    'mirror_node': base_url
                }
            }
            
            return enhanced_data
            
        elif query_type == "transactions" and account_id:
            # Account transactions query
            url = f"{base_url}/accounts/{account_id}/transactions"
            response = requests.get(url, params={'limit': 10})
            response.raise_for_status()
            
            transactions_data = response.json()
            
            enhanced_data = {
                'query_type': 'transactions',
                'account_id': account_id,
                'transactions': transactions_data.get('transactions', []),
                'links': transactions_data.get('links', {}),
                'metadata': {
                    'network': 'testnet',
                    'query_timestamp': datetime.now().isoformat(),
                    'mirror_node': base_url
                }
            }
            
            return enhanced_data
            
        elif query_type == "transaction" and transaction_id:
            # Specific transaction query
            url = f"{base_url}/transactions/{transaction_id}"
            response = requests.get(url)
            response.raise_for_status()
            
            transaction_data = response.json()
            
            enhanced_data = {
                'query_type': 'transaction',
                'transaction_id': transaction_id,
                'transaction_data': transaction_data,
                'metadata': {
                    'network': 'testnet',
                    'query_timestamp': datetime.now().isoformat(),
                    'mirror_node': base_url
                }
            }
            
            return enhanced_data
            
        elif query_type == "tokens":
            # Tokens query
            url = f"{base_url}/tokens"
            response = requests.get(url, params={'limit': 25})
            response.raise_for_status()
            
            tokens_data = response.json()
            
            enhanced_data = {
                'query_type': 'tokens',
                'tokens': tokens_data.get('tokens', []),
                'links': tokens_data.get('links', {}),
                'metadata': {
                    'network': 'testnet',
                    'query_timestamp': datetime.now().isoformat(),
                    'mirror_node': base_url
                }
            }
            
            return enhanced_data
            
        else:
            raise ValueError(f"Invalid query type or missing parameters: {query_type}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Hedera Mirror Node API error: {e}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def hedera_domain_integration_check(domain_name):
    """
    Check if a domain has Hedera integration and fetch related data
    """
    print(f"🔍 Checking Hedera integration for domain: {domain_name}")
    
    try:
        # First resolve the domain via UD API
        ud_url = f"https://api.unstoppabledomains.com/resolve/domains/{domain_name}"
        ud_headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer <YOUR_TOKEN_HERE>"
        }
        
        ud_response = requests.get(ud_url, headers=ud_headers)
        ud_response.raise_for_status()
        domain_data = ud_response.json()
        
        # Check for Hedera address
        records = domain_data.get('records', {})
        hedera_address = records.get('crypto.HBAR.address')
        
        if hedera_address:
            print(f"✅ Found Hedera address: {hedera_address}")
            
            # Get comprehensive Hedera data
            account_info = hedera_proxy_query(hedera_address, query_type="account")
            transactions = hedera_proxy_query(hedera_address, query_type="transactions")
            
            integration_result = {
                'domain': domain_name,
                'hedera_address': hedera_address,
                'has_hedera_integration': True,
                'account_info': account_info,
                'recent_transactions': transactions,
                'domain_records': records,
                'integration_timestamp': datetime.now().isoformat()
            }
            
            return integration_result
        else:
            print("⚠️ No Hedera address found for this domain")
            return {
                'domain': domain_name,
                'hedera_address': None,
                'has_hedera_integration': False,
                'domain_records': records,
                'integration_timestamp': datetime.now().isoformat()
            }
            
    except Exception as e:
        print(f"❌ Error checking Hedera integration: {e}")
        return None

def batch_hedera_query(account_ids):
    """
    Batch query multiple Hedera accounts
    """
    print(f"🌐 Batch querying {len(account_ids)} Hedera accounts")
    
    results = []
    for account_id in account_ids:
        print(f"   Querying: {account_id}")
        account_data = hedera_proxy_query(account_id, query_type="account")
        
        if account_data:
            results.append({
                'account_id': account_id,
                'status': 'success',
                'data': account_data
            })
        else:
            results.append({
                'account_id': account_id,
                'status': 'error',
                'data': None
            })
    
    return {
        'batch_query': True,
        'total_accounts': len(account_ids),
        'successful_queries': len([r for r in results if r['status'] == 'success']),
        'results': results,
        'timestamp': datetime.now().isoformat()
    }

def main():
    print("🚀 Hedera Mirror Node Proxy with Domain Integration")
    print("="*60)
    
    while True:
        print("\nSelect an option:")
        print("1. Query Hedera account")
        print("2. Query account transactions")
        print("3. Check domain Hedera integration")
        print("4. Batch query accounts")
        print("5. List recent tokens")
        print("6. Exit")
        
        choice = input("\nEnter your choice (1-6): ").strip()
        
        if choice == "1":
            account_id = input("Enter Hedera account ID (e.g., 0.0.123456): ").strip()
            if account_id:
                result = hedera_proxy_query(account_id, query_type="account")
                if result:
                    print(json.dumps(result, indent=2))
                    
        elif choice == "2":
            account_id = input("Enter Hedera account ID: ").strip()
            if account_id:
                result = hedera_proxy_query(account_id, query_type="transactions")
                if result:
                    print(json.dumps(result, indent=2))
                    
        elif choice == "3":
            domain = input("Enter domain name (e.g., example.crypto): ").strip()
            if domain:
                result = hedera_domain_integration_check(domain)
                if result:
                    print(json.dumps(result, indent=2))
                    
        elif choice == "4":
            accounts_input = input("Enter account IDs (comma-separated): ").strip()
            if accounts_input:
                account_ids = [acc.strip() for acc in accounts_input.split(',')]
                result = batch_hedera_query(account_ids)
                print(json.dumps(result, indent=2))
                
        elif choice == "5":
            result = hedera_proxy_query(query_type="tokens")
            if result:
                print(json.dumps(result, indent=2))
                
        elif choice == "6":
            print("👋 Goodbye!")
            break
            
        else:
            print("❌ Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
