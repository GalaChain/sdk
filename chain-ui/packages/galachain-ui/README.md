# @gala-chain/ui

GalaChain UI is a collection of custom web components that can be used to easily interact with GalaChain.

## Download

```
# Using npm
npm install @gala-chain/ui

# Using yarn
yarn add @gala-chain/ui
```

## Usage

Components can be integrated from the @gala-chain/ui package directly in to your application using custom web component tags.

```html
<gala-transfer-token></gala-transfer-token>

<script type="text/javascript">
  import galaChainUi from '@gala-chain/ui'
</script>
```

Alternatively, you can instantiate components programmatically.

```html
<div id="gala-transfer-token"></div>

<script type="text/javascript">
  import { GalaTransferToken } from '@gala-chain/ui'

  const galaTransferToken = new GalaTransferToken()
  document.getElementById('gala-transfer-token')?.appendChild(galaTransferToken)
</script>
```

Components are best used in conjunction with the [GalaConnect](https://www.npmjs.com/package/@gala-chain/connect) library. Using this, user input can be captured, validated, and then sent to the blockchain.

```html
<div id="gala-transfer-token"></div>

<script type="text/javascript">
  import { GalaTransferToken } from '@gala-chain/ui'
  import { BrowserConnectClient, TokenApi } from '@gala-chain/connect'

  // Initiate connection to a web3 wallet
  const walletProvider = new BrowserConnectClient();
  await walletProvider.connect();

  // Create TokenApi instance
  const tokenApi = new TokenApi('https://your-galachain-api-url/asset/token-contract', walletProvider);

  // Create Transfer Token Component
  const galaTransferToken = new GalaTransferToken()
  document.getElementById('gala-transfer-token')?.appendChild(galaTransferToken)

  // Listen for user submission of token transfer
  galaTransferToken?.addEventListener('submit', async (event: CustomEvent) => {
    const payload = event.detail[0]
    const response = await tokenApi.TransferToken({
      ...payload,
      uniqueKey: 'create-unique-key-here'
    })
    alert(JSON.stringify(response))
  })

  galaTransferToken?.addEventListener('error', async (event: CustomEvent) => {
    alert(JSON.stringify(event.detail[0]))
  })
</script>
```
