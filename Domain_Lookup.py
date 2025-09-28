import requests
import json
from datetime import datetime

def resolve_domain_with_hedera(domain_name):
    """
    Enhanced domain resolution with Hedera Mirror Node integration
    """
    print(f"🔍 Resolving domain: {domain_name}")
    
    # Step 1: Resolve domain via Unstoppable Domains API
    ud_url = f"https://api.unstoppabledomains.com/resolve/domains/{domain_name}"
    ud_headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer <YOUR_TOKEN_HERE>"
    }
    
    try:
        ud_response = requests.get(ud_url, headers=ud_headers)
        ud_response.raise_for_status()
        domain_data = ud_response.json()
        
        print("✅ Domain resolved via Unstoppable Domains API")
        
        # Extract addresses
        records = domain_data.get('records', {})
        addresses = {
            'ethereum': records.get('crypto.ETH.address'),
            'polygon': records.get('crypto.MATIC.address'),
            'bitcoin': records.get('crypto.BTC.address'),
            'hedera': records.get('crypto.HBAR.address')
        }
        
        # Step 2: If Hedera address exists, query Mirror Node
        hedera_data = None
        if addresses['hedera']:
            print(f"🌐 Found Hedera address: {addresses['hedera']}")
            hedera_data = query_hedera_mirror_node(addresses['hedera'])
        
        # Step 3: Compile enhanced response
        enhanced_result = {
            'domain': domain_name,
            'owner': domain_data.get('meta', {}).get('owner'),
            'resolver': domain_data.get('meta', {}).get('resolver'),
            'addresses': addresses,
            'hedera_metadata': hedera_data,
            'records': records,
            'ipfs_hash': records.get('dweb.ipfs.hash'),
            'website': records.get('dns.A'),
            'email': records.get('whois.email.value'),
            'social': {
                'twitter': records.get('social.twitter.username'),
                'discord': records.get('social.discord.username'),
                'telegram': records.get('social.telegram.username')
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return enhanced_result
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error resolving domain: {e}")
        return None

def query_hedera_mirror_node(account_id):
    """
    Query Hedera Mirror Node for account information
    """
    mirror_url = f"https://testnet.mirrornode.hedera.com/api/v1/accounts/{account_id}"
    
    try:
        response = requests.get(mirror_url)
        response.raise_for_status()
        account_data = response.json()
        
        print(f"✅ Retrieved Hedera account data for {account_id}")
        
        # Enhanced metadata
        enhanced_data = {
            'account_id': account_id,
            'balance': account_data.get('balance', {}).get('balance', '0'),
            'tokens': account_data.get('balance', {}).get('tokens', []),
            'created_timestamp': account_data.get('created_timestamp'),
            'is_deleted': account_data.get('deleted', False),
            'staking_info': account_data.get('staking_info'),
            'account_type': 'Standard Account' if account_data.get('account') else 'Unknown',
            'token_relationships': len(account_data.get('balance', {}).get('tokens', [])),
            'network': 'testnet'
        }
        
        return enhanced_data
        
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Could not fetch Hedera data: {e}")
        return None

def main():
    # Example usage
    domain_name = input("Enter domain name (e.g., example.crypto): ").strip()
    
    if not domain_name:
        print("❌ Domain name is required")
        return
    
    result = resolve_domain_with_hedera(domain_name)
    
    if result:
        print("\n" + "="*50)
        print("🎉 ENHANCED DOMAIN RESOLUTION RESULT")
        print("="*50)
        print(json.dumps(result, indent=2))
        
        # Highlight Hedera integration
        if result['hedera_metadata']:
            print("\n🌐 HEDERA INTEGRATION DETECTED:")
            hedera_info = result['hedera_metadata']
            print(f"   Account ID: {hedera_info['account_id']}")
            print(f"   Balance: {hedera_info['balance']} tinybars")
            print(f"   Token Relationships: {hedera_info['token_relationships']}")
            print(f"   Account Type: {hedera_info['account_type']}")
    else:
        print("❌ Failed to resolve domain")

if __name__ == "__main__":
    main()
