// import { defineCustomElement } from 'vue'
import PrimeVue from 'primevue/config'
// import Button from './components/Button.ce.vue'
import { defineCustomElement } from './utils/defineCustomElement'
import primevueTheme from './theme/primevue/gala'
import TransferTokenComponent, { type TransferToken } from './elements/TransferToken.ce.vue'
import MintTokenWithAllowanceComponent, {
  type MintTokenWithAllowance
} from './elements/MintTokenWithAllowance.ce.vue'
import MintTokenComponent, { type MintToken } from './elements/MintToken.ce.vue'
import { type Component, type VueElementConstructor } from 'vue'

const defineCustomElementWithOptions = <T>(component: Component) => {
  // TODO change types so contructor param "initialProps" is typed to component props
  return defineCustomElement<T>(component, {
    plugins: [{ plugin: PrimeVue, options: { pt: primevueTheme } }]
  })
}

// TODO auto-construct from folder contents
const GalaTransferToken = defineCustomElementWithOptions<TransferToken>(TransferTokenComponent)
const GalaMintToken = defineCustomElementWithOptions<MintToken>(MintTokenComponent)
const GalaMintTokenWithAllowance = defineCustomElementWithOptions<MintTokenWithAllowance>(
  MintTokenWithAllowanceComponent
)

const prefix = 'gala'
export const galaChainElements: Record<string, VueElementConstructor> = {
  'transfer-token': GalaTransferToken,
  'mint-token': GalaMintToken,
  'mint-token-with-allowance': GalaMintTokenWithAllowance
}

Object.entries(galaChainElements).forEach(([key, value]) => {
  customElements.define(`${prefix}-${key}`, value)
})

export { GalaTransferToken, GalaMintToken, GalaMintTokenWithAllowance }
