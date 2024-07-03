import { GalachainConnectClient, TokenClient } from '@gala-chain/connect'
import { GalaMintToken, GalaMintTokenWithAllowance, GalaTransferToken } from './main'
import { ChainCallDTO, TokenAllowance, TokenBalanceWithMetadata } from '@gala-chain/api'
import { v4 as uuidv4 } from 'uuid'

// Instantiate
const galaTransferToken = new GalaTransferToken()
document.getElementById('transfer-token')?.appendChild(galaTransferToken)

const galaMintToken = new GalaMintToken()
document.getElementById('mint-token')?.appendChild(galaMintToken)

const galaMintTokenWithAllowance = new GalaMintTokenWithAllowance()
document.getElementById('mint-token-with-allowance')?.appendChild(galaMintTokenWithAllowance)

// Set params
const connectClient = new GalachainConnectClient('http://localhost:3002/api/asset/token-contract')
await connectClient.connectToMetaMask()
const address = connectClient.address

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
    alert(e.message)
    throw new Error(e.message)
  } finally {
    element.removeAttribute('loading')
  }
}

// Transfer
galaTransferToken?.addEventListener('submit', async (event: CustomEvent) => {
  const payload = event.detail[0]
  const response = await submit(galaTransferToken, 'TransferToken', {
    ...payload,
    uniqueKey: uuidv4()
  })
  alert(JSON.stringify(response))
})

galaTransferToken?.addEventListener('error', async (event: CustomEvent) => {
  const payload = event.detail[0]
  alert(JSON.stringify(payload))
})

const balancesResponse: any = await connectClient.submit(
  'http://localhost:3002/api/asset/token-contract',
  'FetchBalancesWithTokenMetadata',
  {
    owner: 'eth|E11F175251222B62cCB0D045D9aC8f9278Cd08ea',
    collection: 'GALA',
    category: 'Unit',
    type: 'none',
    additionalKey: 'none'
  }
)
const balance: TokenBalanceWithMetadata = balancesResponse.Data.results[0]
galaTransferToken.tokenBalance = balance

// Mint Token
galaMintToken?.addEventListener('submit', async (event: CustomEvent) => {
  const payload = event.detail[0]
  const response = await submit(galaMintToken, 'MintToken', { ...payload, uniqueKey: uuidv4() })
  alert(JSON.stringify(response))
})

galaMintToken?.addEventListener('error', async (event: CustomEvent) => {
  const payload = event.detail[0]
  alert(JSON.stringify(payload))
})

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
galaMintToken.tokenAllowance = balance ? { token: balance.token, allowances } : undefined

// Mint Token With Allowance
galaMintTokenWithAllowance?.addEventListener('submit', async (event: CustomEvent) => {
  const payload = event.detail[0]
  const response = await submit(galaMintTokenWithAllowance, 'MintTokenWithAllowance', {
    ...payload,
    uniqueKey: uuidv4()
  })
  alert(JSON.stringify(response))
})

galaMintTokenWithAllowance?.addEventListener('error', async (event: CustomEvent) => {
  const payload = event.detail[0]
  alert(JSON.stringify(payload))
})

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
galaMintTokenWithAllowance.address = address
galaMintTokenWithAllowance.token = token
