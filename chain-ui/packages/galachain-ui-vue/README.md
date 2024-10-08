# @gala-chain/ui-vue

GalaChain UI (Vue) is a collection of Vue3 components that can be used to easily interact with GalaChain.

## Download

```
# Using npm
npm install @gala-chain/ui-vue

# Using yarn
yarn add @gala-chain/ui-vue
```

## Usage

Components can be imported from the @gala-chain/ui-vue package and implemented directly in your application.

```javascript
<script setup>
    import { GalaTransferToken } from '@gala-chain/ui-vue'
</script>

<template>
    <GalaTransferToken></GalaTransferToken>
</template>
```

Components are best used in conjunction with the [GalaConnect](https://www.npmjs.com/package/@gala-chain/connect) library. Using this, user input can be captured, validated, and then sent to the blockchain.

```vue
<script setup>
import { GalaTransferToken } from '@gala-chain/ui-vue'
import { BrowserConnectClient, TokenApi } from '@gala-chain/connect'
import { TransferTokenDto } from '@gala-chain/api'

const walletProvider = new BrowserConnectClient();
const tokenApi = new TokenApi('https://your-galachain-api-url/asset/token-contract', walletProvider);

onMounted(async () => {
  // Initiate connection to a web3 wallet
  await walletProvider.connect();
})

const handleSubmit = (payload: TransferTokenDto) => {
  const response = await tokenApi.TransferToken({
    ...payload,
    uniqueKey: 'create-unique-key-here'
  })
  alert(JSON.stringify(response))
}

const handleError = (error: any) => {
  alert(JSON.stringify(error))
}
</script>

<template>
  <GalaTransferToken @submit="handleSubmit" @error="handleError"></GalaTransferToken>
</template>
```
