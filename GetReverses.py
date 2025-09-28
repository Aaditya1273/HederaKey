import requests
import json
from datetime import datetime

def reverse_resolve_with_hedera(addresses):
    """
    Enhanced reverse domain resolution with Hedera Mirror Node integration
    """
    print(f"🔍 Reverse resolving addresses: {addresses}")
    
    url = "https://api.unstoppabledomains.com/resolve/reverse/query"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer <YOUR_TOKEN_HERE>"
    }
    
    payload = {
        "addresses": addresses if isinstance(addresses, list) else [addresses]
    }
    
    try:
        # Step 1: Reverse resolve via UD API
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        reverse_data = response.json()
        
        print("✅ Reverse resolution completed via Unstoppable Domains API")
        
        # Step 2: Enhance each found domain with Hedera data
        enhanced_results = []
        
        for item in reverse_data.get('data', []):
            enhanced_item = item.copy()
            
            if item.get('domain'):
                print(f"🌐 Enhancing domain: {item['domain']}")
                
                # Get full domain data with Hedera integration
                try:
                    from Domain_Lookup import resolve_domain_with_hedera
                    enhanced_domain = resolve_domain_with_hedera(item['domain'])
                    enhanced_item['enhanced'] = enhanced_domain
                    
                    # Check if this domain has Hedera integration
                    if enhanced_domain and enhanced_domain.get('hedera_metadata'):
                        enhanced_item['has_hedera'] = True
                        enhanced_item['hedera_account'] = enhanced_domain['addresses']['hedera']
                    else:
                        enhanced_item['has_hedera'] = False
                        
                except Exception as e:
                    print(f"⚠️ Could not enhance domain {item['domain']}: {e}")
                    enhanced_item['enhanced'] = None
                    enhanced_item['has_hedera'] = False
                    enhanced_item['error'] = str(e)
            
            enhanced_results.append(enhanced_item)
        
        # Step 3: Compile final response
        final_result = {
            'results': enhanced_results,
            'total_found': len(enhanced_results),
            'hedera_enabled_domains': len([r for r in enhanced_results if r.get('has_hedera')]),
            'query_addresses': payload['addresses'],
            'timestamp': datetime.now().isoformat()
        }
        
        return final_result
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error in reverse resolution: {e}")
        return None

def query_hedera_accounts_batch(account_ids):
    """
    Batch query multiple Hedera accounts via Mirror Node
    """
    print(f"🌐 Batch querying {len(account_ids)} Hedera accounts")
    
    results = []
    for account_id in account_ids:
        try:
            mirror_url = f"https://testnet.mirrornode.hedera.com/api/v1/accounts/{account_id}"
            response = requests.get(mirror_url)
            response.raise_for_status()
            account_data = response.json()
            
            results.append({
                'account_id': account_id,
                'data': account_data,
                'status': 'success'
            })
            
        except Exception as e:
            results.append({
                'account_id': account_id,
                'data': None,
                'status': 'error',
                'error': str(e)
            })
    
    return results

def find_domains_by_hedera_account(hedera_account_id):
    """
    Find domains that resolve to a specific Hedera account
    """
    print(f"🔍 Searching for domains linked to Hedera account: {hedera_account_id}")
    
    # This would require a comprehensive search across known domains
    # For now, we'll demonstrate the concept with a placeholder
    
    # In a real implementation, you might:
    # 1. Query a database of known domain->address mappings
    # 2. Use specialized indexing services
    # 3. Crawl popular domains
    
    placeholder_result = {
        'hedera_account': hedera_account_id,
        'linked_domains': [],  # Would contain actual domains
        'search_method': 'placeholder',
        'note': 'Real implementation would require comprehensive domain indexing',
        'timestamp': datetime.now().isoformat()
    }
    
    return placeholder_result

def main():
    print("🚀 Enhanced Reverse Domain Resolution with Hedera Integration")
    print("="*60)
    
    # Get input from user
    addresses_input = input("Enter addresses (comma-separated): ").strip()
    
    if not addresses_input:
        print("❌ At least one address is required")
        return
    
    # Parse addresses
    addresses = [addr.strip() for addr in addresses_input.split(',')]
    
    # Perform enhanced reverse resolution
    result = reverse_resolve_with_hedera(addresses)
    
    if result:
        print("\n" + "="*60)
        print("🎉 ENHANCED REVERSE RESOLUTION RESULT")
        print("="*60)
        print(json.dumps(result, indent=2))
        
        # Summary
        print(f"\n📊 SUMMARY:")
        print(f"   Total domains found: {result['total_found']}")
        print(f"   Hedera-enabled domains: {result['hedera_enabled_domains']}")
        
        # Highlight Hedera integrations
        hedera_domains = [r for r in result['results'] if r.get('has_hedera')]
        if hedera_domains:
            print(f"\n🌐 HEDERA-ENABLED DOMAINS:")
            for domain_info in hedera_domains:
                print(f"   • {domain_info['domain']} → {domain_info['hedera_account']}")
    else:
        print("❌ Failed to perform reverse resolution")

if __name__ == "__main__":
    main()
