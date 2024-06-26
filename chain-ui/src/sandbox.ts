import { GalachainConnectClient, TokenClient } from '@gala-chain/connect'
import { GalaMintToken, GalaMintTokenWithAllowance, GalaTransferToken } from './main'
import { ChainCallDTO, TokenAllowance, TokenBalanceWithMetadata } from '@gala-chain/api'
import { v4 as uuidv4 } from 'uuid'

const connectClient = new GalachainConnectClient()
connectClient.connectToMetaMask()
const addresses = await window.ethereum?.request({
  method: 'eth_requestAccounts'
})
const address = addresses[0]

const submit = async (element: HTMLElement, method: keyof TokenClient, payload: ChainCallDTO) => {
  element.setAttribute('loading', 'true')
  const tokenClient = new TokenClient(
    connectClient,
    'http://localhost:3002/api/asset/token-contract'
  )
  try {
    const response: any = await tokenClient[method](payload)
    if (response.ErrorCode) {
      throw new Error(response.Message)
    }
    return response.Data
  } catch (e: any) {
    throw new Error(e.message)
  } finally {
    element.removeAttribute('loading')
  }
}

// Transfer Token
const balancesResponse: any = await connectClient.submit(
  'http://localhost:3002/api/asset/token-contract',
  'FetchBalancesWithTokenMetadata',
  { owner: address, collection: 'GALA', category: 'Unit', type: 'none', additionalKey: 'none' }
)
const balance: TokenBalanceWithMetadata = balancesResponse.Data.results[0]

const galaTransferToken = new GalaTransferToken({
  tokenBalance: balance
})
const transferToken = document.getElementById('transfer-token')?.appendChild(galaTransferToken)

transferToken?.addEventListener('submit', async (event: CustomEvent) => {
  const payload = event.detail[0]
  const response = await submit(transferToken, 'TransferToken', { ...payload, uniqueKey: uuidv4() })
  alert(JSON.stringify(response))
})

transferToken?.addEventListener('error', async (event: CustomEvent) => {
  const payload = event.detail[0]
  alert(JSON.stringify(payload))
})

// Mint Token
const allowancesResponse: any = await connectClient.submit(
  'http://localhost:3002/api/asset/token-contract',
  'FetchAllowances',
  {
    grantedTo: address,
    collection: 'GALA',
    category: 'Unit',
    type: 'none',
    additionalKey: 'none',
    instance: '0',
    allowanceType: 4
  }
)
const allowances: TokenAllowance[] = allowancesResponse.Data

const galaMintToken = new GalaMintToken({
  address,
  tokenAllowance: balance ? { token: balance.token, allowances } : undefined
})
const mintToken = document.getElementById('mint-token')?.appendChild(galaMintToken)

mintToken?.addEventListener('submit', async (event: CustomEvent) => {
  const payload = event.detail[0]
  const response = await submit(mintToken, 'MintToken', { ...payload, uniqueKey: uuidv4() })
  alert(JSON.stringify(response))
})

mintToken?.addEventListener('error', async (event: CustomEvent) => {
  const payload = event.detail[0]
  alert(JSON.stringify(payload))
})

// Mint Token With Allowance
const tokeClassesResponse: any = await connectClient.submit(
  'http://localhost:3002/api/asset/token-contract',
  'FetchTokenClassesWithSupply',
  {
    tokenClasses: [
      {
        additionalKey: 'none',
        category: 'Unit',
        collection: 'GALA',
        type: 'none'
      }
    ]
  }
)
const token = tokeClassesResponse.Data[0]
const galaMintTokenWithAllowance = new GalaMintTokenWithAllowance({
  address,
  token
})
const mintTokenWithAllowance = document
  .getElementById('mint-token-with-allowance')
  ?.appendChild(galaMintTokenWithAllowance)

mintTokenWithAllowance?.addEventListener('submit', async (event: CustomEvent) => {
  const payload = event.detail[0]
  const response = await submit(mintTokenWithAllowance, 'MintTokenWithAllowance', {
    ...payload,
    uniqueKey: uuidv4()
  })
  alert(JSON.stringify(response))
})

mintTokenWithAllowance?.addEventListener('error', async (event: CustomEvent) => {
  const payload = event.detail[0]
  alert(JSON.stringify(payload))
})
