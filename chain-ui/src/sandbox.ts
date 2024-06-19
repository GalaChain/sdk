import { GalachainConnectClient, TokenClient } from '@gala-chain/connect'
import { GalaTransferToken } from './main'

const galaTransferToken = new GalaTransferToken()
const galachainClient = new GalachainConnectClient()
const tokenClient = new TokenClient(
  galachainClient,
  'https://int-operation-api-chain-platform-stage-chain-platform-eks.stage.galachain.com/api/asset'
)
await galachainClient.connectToMetaMask()
const element = document.getElementById('transfer-token')?.appendChild(galaTransferToken)

element?.addEventListener('submit', async (event: CustomEvent) => {
  const payload = event.detail[0]
  const response = await tokenClient.TransferToken(payload)
  console.log(response)
})
