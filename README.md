# HederaKey-Unlock-the-Decentralized-Web-Universal-Knowledge

![HederaKey](https://github.com/user-attachments/assets/6410f1d8-92c3-4178-a436-b926f4d29fc2)

![chip pay](https://github.com/user-attachments/assets/e8d67898-c565-412d-abc9-8272d5a884c2)


# Example of Get Records for a Domain

<img width="446" alt="Screenshot 2024-06-07 101035" src="https://github.com/MiChaelinzo/MindKey-Unlock-the-Decentralized-Web-Universal-Knowledge/assets/68110223/f5c57af0-5260-4320-a231-e161fa508677">

# Login with Unstoppable Domain Flowchart

![login-with-unstoppable-flow-revised](https://github.com/MiChaelinzo/MindKey-Unlock-the-Decentralized-Web-Universal-Knowledge/assets/68110223/31803eb3-3eb0-41b9-81fc-747a2261d939)

# UI of UD

<img width="592" alt="login-paid-domain-search" src="https://github.com/MiChaelinzo/MindKey-Unlock-the-Decentralized-Web-Universal-Knowledge/assets/68110223/279133f7-ee90-4eb9-9ab7-5003f9c27e09">


```
import requests

domain_name = "YOUR_domainName_PARAMETER"
url = "https://api.unstoppabledomains.com/resolve/domains/" + domain_name

headers = {"Authorization": "Bearer <YOUR_TOKEN_HERE>"}

response = requests.get(url, headers=headers)

data = response.json()
print(data)
```
## Getting started with the server-side:

```sh
# This application now uses Hedera Hashgraph testnet
# The configuration is set up for testnet by default
# Operator account and keys are configured in 'src/config.json'
# For production, update the operator credentials with your own Hedera account
```

```sh
# Install dependencies
npm install
```

```sh
# Start developing
npm run dev
```

```sh
# Start production server
npm start
```

### Config

```js
{
  "port": 8080, // port to launch app to
  "bodyLimit": "1kb", // max size of request json object
  "hederaNetwork": "testnet", // Hedera network (testnet/mainnet)
  "hederaMirrorNode": "https://testnet.mirrornode.hedera.com", // Mirror node URL
  "hederaOperatorId": "0.0.2", // Operator account ID
  "hederaOperatorKey": "..." // Operator private key
}
```

## Endpoints

`/createWallet`

```sh
GET localhost:8080/createWallet
```

```js
# response
{
  "accountId": "0.0.123456",
  "privateKey": "HEDERA_PRIVATE_KEY",
  "publicKey": "HEDERA_PUBLIC_KEY"
}
```

`/getBalance/HEDERA_ACCOUNT_ID`

```sh
GET localhost:8080/getBalance/0.0.123456
```

```js
# response
{
  "accountId": "0.0.123456",
  "balance": "10.5 ℏ",
  "balanceInTinybars": "1050000000"
}
```

`/transaction`

```sh
POST to localhost:8080/transaction
BODY
{
	"privateKey": "YOUR_HEDERA_PRIVATE_KEY",
	"amount": "1.5",
	"destination": "0.0.654321"
}
```

```js
# response
{
  "txHash": "0.0.2@1234567890.123456789",
  "status": "SUCCESS",
  "amount": "1.5",
  "from": "0.0.123456",
  "to": "0.0.654321"
}
```

`/deleteAccount`

```sh
POST to localhost:8080/deleteAccount
BODY
{
	"privateKey": "ACCOUNT_PRIVATE_KEY",
	"transferAccountId": "0.0.TRANSFER_TO_ACCOUNT"
}
```

```js
# response
{
  "txHash": "0.0.2@1234567890.123456789",
  "status": "SUCCESS",
  "deletedAccount": "0.0.123456",
  "transferredTo": "0.0.654321"
}
```

## Enhanced Domain Resolution Endpoints

`/domain/resolve/:domain`

```sh
GET localhost:8080/domain/resolve/example.crypto
```

```js
# response
{
  "domain": "example.crypto",
  "owner": "0x1234...",
  "addresses": {
    "ethereum": "0x1234...",
    "polygon": "0x5678...",
    "hedera": "0.0.123456"
  },
  "hederaMetadata": {
    "account_id": "0.0.123456",
    "balance": "1000000000",
    "tokens": [],
    "account_type": "Standard Account",
    "token_relationships": 0
  },
  "social": {
    "twitter": "username",
    "discord": "user#1234"
  }
}
```

`/domain/reverse`

```sh
POST localhost:8080/domain/reverse
BODY
{
  "addresses": ["0x1234...", "0.0.123456"]
}
```

```js
# response
{
  "results": [
    {
      "domain": "example.crypto",
      "has_hedera": true,
      "hedera_account": "0.0.123456",
      "enhanced": { /* full domain data */ }
    }
  ],
  "totalFound": 1,
  "hedera_enabled_domains": 1
}
```

`/domain/link-hedera`

```sh
POST localhost:8080/domain/link-hedera
BODY
{
  "domain": "example.crypto",
  "hederaAccountId": "0.0.123456",
  "signature": "optional_signature"
}
```

```js
# response
{
  "domain": "example.crypto",
  "hederaAccountId": "0.0.123456",
  "status": "linked",
  "linkedTimestamp": "2024-01-01T00:00:00.000Z"
}
```

`/hedera/account/:accountId`

```sh
GET localhost:8080/hedera/account/0.0.123456
```

```js
# response
{
  "accountId": "0.0.123456",
  "balance": "1000000000",
  "tokens": [],
  "createdTimestamp": "1234567890.123456789",
  "stakingInfo": null,
  "linkable": true
}
```
## Getting started with the client:
As a client we are using NFC Tools Pro to program and write the wallet "app" on the NFC chip.

The "app" has 25 tasks and total 828 bytes.

```sh
# Download 'xETH_profile.json' and save it on your phone somewhere.
# This file contains the NFC configuration for Hedera wallet access.
# This file is the main app file needed.
```
```sh

## Security tips
- Whitelisting your nfc chip
- Using password encrypted private key (soon)
- Using SSL to communicate to app

We configured app to work on Hedera testnet, so it's safe to play with.

If you want to use it on Mainnet, update the 'hederaNetwork' in 'src/config.json' 
to "mainnet" and provide your mainnet operator credentials.

## License

MIT

{{ ... }}

Thanks to @wingleung and @Omodaka9375 for simple api code [https://github.com/wingleung/Ripple-wallet-api-example
](https://github.com/Omodaka9375/xEth-wallet-for-NFC)https://github.com/Omodaka9375/xEth-wallet-for-NFC


