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
